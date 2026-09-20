# 🧠 The Blackboard System

In Behavior Trees, nodes need a way to share data: a `Find` node locates an enemy, and a `Move` action needs to know where it is. AI Behavior Architect provides a **two-tier data system** — both tiers are unmanaged, per-agent, allocation-free, but they serve different purposes and live in different buffers:

| | **① Named Variables** | **② Data Ports** |
|---|---|---|
| **Buffer** | `DynamicBuffer<BtNodeState>` | `DynamicBuffer<BtBlackboardEntry>` |
| **Slot size** | 4 bytes — float union (`float` / `int` / `bool` / `uint`) | 16 bytes — unmanaged union (any unmanaged type ≤ 16 bytes: `float`, `int`, `double`, `float2`, `int2`, `float3`, `Entity`, …) |
| **How created** | by designers in the editor's **Variables** tab (name + type + default value) | automatically, one slot per unique connected horizontal port |
| **Identity** | the variable's hash — FNV-1a of a GUID, assigned when the variable is created | the port's hash — FNV-1a of a GUID, stored in the node data |
| **Used by** | Blackboard Condition / Blackboard Modify nodes; `[BtBlackboard]` parameters of custom actions | Find / Condition / Change-Entity / Create-Entity ports; `[BtInput]` / `[BtOutput]` parameters of custom actions |


## ① Tier 1 — Named Variables (`BtNodeState` buffer)

These are the variables you see in the **Variables** tab. Each variable is:

* **Name** (editor-only, for humans),
* **Type** — `Bool`, `Int` or `Float` (this is the *editor's* interpretation; at runtime the slot is a 4-byte value union),
* **Value** — the default (stored as a float; `bool` uses `0`/`1`),
* **Hash** — FNV-1a of a random GUID, assigned when the variable is created. The hash is the variable's **identity** — it's what gets compiled into the blob, not the name. Renaming a variable is free; deleting and re-adding it changes its identity.

At bake time the compiler registers every variable (including sub-tree variables) into a **shared state table** keyed by hash:

* each unique hash gets exactly **one** `BtNodeState` slot (`GetOrCreateSharedState`),
* the variable's authored default value initializes that slot (`StateVariables`),
* nodes that reference the variable store only the slot's **index**, not the value.

So blackboard variables are just *named, initialized slots in the node-state buffer* — reading or writing one is a single unmanaged array access inside Burst.

### Where named variables are used

| Consumer | How it's wired |
|---|---|
| **Blackboard Condition** node | the inspector's *Variable* dropdown picks a variable → the node reads its slot |
| **Blackboard Modify** node | same; writes back to the slot |
| `Blackboard Condition/Modify` **output port** ("Enable Output") | the port's payload **is the variable's hash**; connect it into a custom action's `[BtBlackboard]` input port |
| Custom action `[BtBlackboard] float/int/uint p` (optionally `ref`) | resolved to the slot index via the connected port; `ref` writes back after `Process` |

> ⚠️ **`[BtBlackboard]` ≠ `[BtInput]`.** `[BtBlackboard]` connects to **named variables** (4-byte slots, `float`/`int`/`uint` only). `[BtInput]` connects to **data-port channels** (16-byte slots, any unmanaged type ≤ 16 bytes). They are different port types in the editor and cannot be connected to each other.

## ② Tier 2 — Data Ports (`BtBlackboardEntry` buffer)

Data ports are the horizontal connections. Each **output** port of a node (Find's `Entity`/`float3`, Create-Entity's `Entity`, a custom action's `[BtOutput]`, a blackboard node's variable port) is assigned a **port hash** (FNV-1a of a GUID, generated once and stored in the node data). When you connect it to an input port, the input port stores the *same* hash.

At compile time the compiler walks every port hash and builds the buffer:

* every unique **non-zero** hash gets one `BtBlackboardEntry` slot — a **16-byte unmanaged union** (`BtBlackboardValue`: `float`/`int`/`bool`/`double`/`float2`/`int2`/`float3` all overlay byte 0; `Entity` is 8 bytes),
* the blob stores a `Hash → slot index` table (`Hashes` + `BbIndices`), and each node that reads or writes a port stores only the slot index,
* at runtime, the producing node writes the value with a typed helper (`buffer.SetValue<float3>(slot, value)`), and the consuming node reads it with the *matching* type (`buffer.GetValue<float3>(slot)`).

> 💡 **Slots are shared by hash, not by connection.** If two output ports ever carried the same hash they would share a slot — which is exactly the mechanism that lets a `[BtOutput]` port and a `[BtInput]` port exchange values: the output port's hash is copied into the input port at connection time, so both resolve to the same slot.

### What can flow through a data port?

Any **unmanaged type ≤ 16 bytes**: `bool`, `byte`…`int`, `float`, `double`, `float2`, `int2`, `float3`, and `Unity.Entities.Entity`. The editor enforces type equality on connection, so a `float3` port can only feed another `float3` port. In generated code the value is bit-copied (`UnsafeUtility.CopyStructureToPtr`), which is why the 16-byte bound exists — the slot *is* a 16-byte field.

### Unconnected ports

An unconnected input port has hash `0`, which compiles to slot index `-1` ("no slot"):

* `[BtInput]` on an unconnected port reads the slot's **default value** (zero for numbers, `Entity.Null` for entities) — the read is bounds-checked and returns a type default.
* An unconnected `[BtBlackboard]` port logs an error at compile time (`Custom node 'X' has an unconnected [BtBlackboard] port.`) and compiles to slot `-1`.
* `Create-Entity` with an unconnected position input uses its authored static position instead.

## Lifetime & Reset

* Both buffers are created **per agent entity** at bake time, sized to the compiled graph (`NodeStateCount` and `BlackboardCount`).
* Values persist across frames and across tree restarts (they are *not* cleared when the root completes) — that's what makes blackboard variables stateful.
* If you destroy and re-spawn the agent, it gets a **fresh** buffer initialized from the graph defaults.

## Performance Note

In object-oriented frameworks, blackboards are typically `Dictionary<string, object>` — allocation-heavy and unusable in Burst. Here:

* **zero allocations** — everything is a pre-sized unmanaged buffer on the entity chunk,
* **cache-friendly** — the buffer lives in the same chunk family as the agent's other components,
* **type-stable** — slots are fixed at compile time; there is no runtime lookup by string, ever.
