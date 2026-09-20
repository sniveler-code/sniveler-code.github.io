# 🔎 Queries & Transactions

These nodes reach **outside** the agent and into the DOTS world. They are the only built-in nodes that require **generated systems** (a unique Find/Condition/Transaction configuration compiles into its own Burst system — see [Core Concepts](#core-concepts-architecture)).

> 📌 **Component eligibility — read this first.** The *Components Setup* dropdowns in Find / Condition / Change-Entity only list component types tagged with the **`[BtCondition]`** attribute:
>
> ```csharp
> using SnivelerCode.AiBehavior.Runtime.Attributes;
> using Unity.Entities;
>
> [BtCondition]
> public struct PlayerTag : IComponentData { }
>
> [BtCondition]
> public struct HealthComponent : IComponentData
> {
>     public float Value;
> }
> ```
>
> Tagging a struct does two things: (1) the editor lists it in the dropdowns, and (2) the Roslyn generator emits `Compare`/`Modify` extension methods for it — the field-level condition/transaction evaluators the generated systems call. Supported field types are `bool`, `sbyte`/`byte`, `short`/`ushort`, `int`/`uint`, `float`, and enums. Untagged components (e.g. `LocalTransform`) can't be used here — but they *can* be used in **custom actions**, which use a different mechanism (see [ECS Components in Custom Nodes](#ecs-components-in-custom-nodes)).

## 📍 Query Find (spatial search)

`Queries/Query Find` — a terminal node that queries the world for entities matching component conditions **within a radius** of the agent, using a per-system **spatial hash**.

**Inspector:**

| Field | Meaning |
|---|---|
| **Find Method** | `First` (fastest), `Nearest` (closest match), `Random` (uniform random match) |
| **Max Distance** | search radius (world units). Distance check is a true sphere around the agent. |
| **Spatial Cell Size** | edge length of the hash cells (also **part of the node's hash** — changing it generates a new system) |
| **Complexity** | read-only estimator: `min(100, round(2 · (Distance/Cell)³))` — the approximate number of cells scanned |
| **Components Setup** | one or more `[BtCondition]` components, each with per-field conditions (operator dropdown per field: `Skip`/`Equal`/`NotEqual`/`Greater`/`Less` + value) |

**Data ports (outputs):**

| Port | Type | Content |
|---|---|---|
| `Entity` | `Entity` | the found entity (written to the port's blackboard slot) |
| `float3` | `float3` | the found entity's world position (`LocalToWorld.Position`) |

Both ports are **multi-capacity** — fan them out to any number of consumers.

**How the generated system works (per frame, per agent with a running Find):**

1. **Collect job** — one `IJobChunk` over all entities that have *all* required components **and** a `LocalToWorld` transform: each is inserted into a `NativeParallelMultiHashMap<int3, Result>` keyed by `floor(position / CellSize)`. `Result` carries the component values, the entity, and its position.
2. **Filter job** — for the agent: walks **every cell of the cube** `[pos − r, pos + r]` (a cube, not a sphere — the sphere only filters afterwards), and for each resident:
   * computes `distSq` to the agent and rejects beyond `r²`,
   * evaluates each component's conditions via the generated `Compare` (buffer components: *any* element matching the conditions qualifies),
   * applies the mode: `First` → stop at the first match (`goto` out of the cell loops); `Nearest` → keep the smallest `distSq`; `Random` → reservoir-style: replace the current pick with probability `1/candidates` (uniform over all matches),
   * on a match: writes `Entity` and `float3` into the agent's blackboard slots and sets the action **Success**; otherwise **Failure**.

**Tuning tips:**

* **Cell size ≈ typical entity spacing.** Too small → many empty cells visited; too large → each cell holds many entities you must compare. The Complexity field is your at-a-glance cost meter.
* The search cube means the worst case is `(2r/cell)³` cell lookups; keep `Max Distance` tight for dense worlds.
* **Both sides need a transform.** The collect job only sees entities that have **all** required components *and* a `LocalToWorld` transform — entities without a transform are invisible to Find. And the agent itself must have a transform (its position is the search origin); `BtAgentAuthoring` bakes one automatically.
* Find results are **point-in-time**: the found entity is stored in the blackboard — subsequent nodes should treat it as data, not a live reference (the entity may die; nodes that read it should handle `Entity.Null`/non-existent gracefully — custom actions can check `Entity.Exists`… note: existence checks require a component lookup; the simplest robust pattern is a `Condition` node against a tag component).

## 🧾 Query Condition (entity check)

`Queries/Query Condition` — a terminal node that checks components **on a target entity**.

**Inspector:** same *Components Setup* as Find, but **without** distance/cell settings (no spatial search — direct lookups).

**Data ports:** one **Entity input** (left). When connected (e.g. from a Find's `Entity` output), the check runs against that entity. When unconnected, it runs against **the agent itself** (the node's subtitle shows `Self` vs `Entity`).

**Runtime:** for each configured component: the target must *have* the component and it must *match* the field conditions (buffers: at least one element must match). All components must pass → **Success**, anything missing or mismatched → **Failure**.

> Use case: `Find nearest chest → Condition: ChestTag on it → …` or the self-check `Condition: MyStatus == Dead` as a tree root gate.

## 🛠 Action Change Entity (transactions)

`Actions/Action Change Entity` — modifies component data **on a target entity** via generated **transaction** systems. This is the only built-in node that *writes* world state.

**Inspector:**

| Field | Meaning |
|---|---|
| **Entity input port** | target; unconnected = the agent itself (subtitle `Self`/`Entity`) |
| **Components Setup** | `[BtCondition]` components to modify; each field gets a **transaction operator** dropdown: `Skip` / `Set` / `Inc` (add) / `Dec` (subtract) + value |

**Runtime semantics (exact, per component):**

* **Regular components** (`IComponentData`): the target must have the component (missing → node **Failure**). Each field with a non-`Skip` operator is applied through the generated `Modify` — with **range clamping**: integer fields that would overflow their type (e.g. `Inc` past `int.MaxValue`) make the whole transaction **fail** and the value is left untouched.
* **Buffer components** (`IBufferElementData`): the node *also* shows a **Conditions** list per component (in addition to the transaction list). At runtime it finds the **first element matching the conditions** and applies the transactions to it. **If no element matches, a new element is appended** — this is also how you grow buffers. *Implementation note:* the fresh element is first run through the component's **condition** operators in modify-space and then through the **transaction** operators; with the common setup (condition operators left at `Skip`, i.e. "match any element") the condition pass is a no-op and the transactions simply apply to element 0 or to the appended element. If the target has no such buffer at all → **Failure**.
* All modifications go through a generated **transaction system** driven by a per-frame request queue (`BtTransitionRequest`), applied via component/buffer lookups in a deferred job — so writes are batched per frame and safe under parallelism. The node completes as soon as the system reports the result back.

> Use case: damage application (`Health.Dec 10` on a found target), toggling tags (`Set`), growing per-entity buffers.
> ⚠️ Transactions modify **data only** — adding/removing components and destroying entities are *structural* changes and require custom actions with an `EntityCommandBuffer` (see [Entity Command Buffers](#entity-command-buffers)).

## 🐣 Query Create Entity (spawn)

`Queries/Query Create Entity` — spawns a **baked prefab** at runtime.

**Inspector:**

| Field | Meaning |
|---|---|
| **Entity** | the `GameObject` prefab to spawn. Its asset **GUID hash** is the node's identity — swapping the prefab regenerates the system's registry entry. The prefab is automatically registered into the scene's **global prefab registry** at bake time (no manual step). |
| **Enable Transform** | when on: the spawned entity is placed at the **Position** (static `float3` field, or from the `float3` input port when connected) — and the position input port exists only while this toggle is on |
| **Parent to Agent** | (requires Enable Transform) parents the spawn to the agent **and** links it into the agent's `LinkedEntityGroup`, so destroying the agent destroys the spawn |
| **Enable Output** | grows an **Entity output** port carrying the spawned entity (see timing note below) |

**Runtime:** the node reports **Running** the frame it's entered and enqueues a spawn request; `BtSpawnSystem` (running after the runner, same frame) dequeues all requests, sorts them by entity index for determinism, and instantiates via an `EndSimulationEntityCommandBuffer`. The node reports **Success** when the prefab resolves — or **Failure** if the prefab is missing from the registry (e.g. the prefab was assigned but never baked into any scene's registry).

**Output port timing:** the spawned entity id is delivered through a one-frame relay — the spawn system tags the new entity with a `BtSpawnEntityMarker`, and the next frame's Initialization group (`BtSpawnBlackboardSystem`) copies the entity into the output's blackboard slot and removes the marker. **Treat the output as valid from the frame after the spawn.**

> Use case: spawn a projectile at a target position (Find → `float3` → Create Entity), or spawn minions parented to the caster.
