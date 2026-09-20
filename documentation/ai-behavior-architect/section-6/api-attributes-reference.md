# 🏷 API Attributes Reference

All attributes live in `SnivelerCode.AiBehavior.Runtime.Attributes`. The Roslyn generator reads them from your `Process` signature and from your struct fields, and the editor reads the same metadata to draw ports and inspector fields.

## Parameter Attributes

### `[BtParam]` — static, designer-tunable value

```csharp
private NodeStatus Process([BtParam] float speed, [BtParam] bool aggressive) { }
```

* Exposes a **field in the node inspector** (no port).
* Supported types: `int`, `float`, `bool`, and **enums** (rendered as a dropdown; stored as their int value).
* Stored in the blob's pooled `FloatData` (bools as `0/1`) and cast back at the call site.
* Values are **per-node-instance** — two instances of the same action in one tree can have different params.

### `[BtInput]` — dynamic value from a data-port channel

```csharp
private NodeStatus Process([BtInput] float3 targetPosition) { }
```

* Generates a **horizontal input port (left side)** typed with the parameter's type.
* Any **unmanaged type ≤ 16 bytes**: `bool`, integral types, `float`, `double`, `float2`, `int2`, `float3`, `Entity`.
* At runtime the value is read from the agent's `BtBlackboardEntry` slot that the *connected output port* writes to. Unconnected ⇒ the slot's default (zero / `Entity.Null`).
* **Read-only** inside `Process`.

### `[BtOutput]` — dynamic value to a data-port channel

```csharp
private NodeStatus Process([BtOutput] ref float3 currentPosition) { }
```

* Generates a **horizontal output port (right side)**; connect it to `[BtInput]` ports of other nodes.
* **Must be declared `ref`** — the generated code passes a local, reads your write-back, then stores it into the blackboard slot after `Process` returns.
* Same type rules as `[BtInput]`.
* Multiple `[BtOutput]` parameters are allowed (one port each, in declaration order).

### `[BtBlackboard]` — named blackboard variable (4-byte slot)

```csharp
private NodeStatus Process([BtBlackboard] float health) { }
private NodeStatus Process([BtBlackboard] ref float health, [BtBlackboard] int state) { }
```

* Connects to a **named blackboard variable** (created in the Variables tab, exposed via a Blackboard Condition/Modify node's *Enable Output* port). Port type is the blackboard-variable marker — it cannot be connected to `[BtInput]`/`[BtOutput]` ports.
* Supported types: **`float`, `int`, `uint` only** (these map to the `BtNodeState` slot's `Value`/`IntValue`/`UIntValue` views). Any other type is a generator error.
* With **`ref`**: the slot is written back after `Process` — this is the only way to mutate a named variable from C#.
* Multiple `[BtBlackboard]` parameters are allowed; each needs its own connected port.

### `[BtEntityIndex]` — the agent's deterministic sort key

```csharp
private NodeStatus Process([BtEntityIndex] int index, in Entity self) { }
```

* Injects the entity's **index in the generated system's query** (computed via `CalculateBaseEntityIndexArrayAsync` — the same array you pass to `EntityCommandBuffer.ParallelWriter` methods).
* Required for deterministic ECB usage: always pass it as the `sortKey` (see [Entity Command Buffers](#entity-command-buffers)).
* At most one per `Process`.

### `[BtPrefab]` — prefab resolved from the global registry

```csharp
private NodeStatus Process([BtPrefab] Entity projectile) { }
```

* Parameter type **must be `Entity`**. At most **one** per action (a second is a generator error).
* The node inspector grows a **prefab `ObjectField`**; its **asset GUID hash** is stored with the node and the prefab is **automatically registered** into the scene's global prefab registry at bake time.
* At runtime the parameter receives the baked prefab entity (via `BtUtils.GetPrefab`), so you can `CommandBuffer.Instantiate(i, projectile)` — no `BtSpawnEntity` node needed.
* Unassigned prefab ⇒ generator/editor error at authoring time; missing at runtime ⇒ `Entity.Null` is passed.

## Bare (unattributed) Parameters

| Parameter shape | Interpretation |
|---|---|
| `Entity e` (no attribute) | **The agent's own entity** (`entities[i]`) |
| `in T comp` / `ref T comp` where `T : IComponentData` | **Query component** — added to the system query; passed by value / by reference (see [ECS Components in Custom Nodes](#ecs-components-in-custom-nodes)) |
| `DynamicBuffer<T> buffer` where `T : IBufferElementData` | **Query buffer** — added to the query; element access via `buffer[i]`… (pass by value; write elements back explicitly) |
| A type matching a `[BtSingleton]` field | the singleton's component data (by value) |
| anything else (e.g. a bare `float` with no attribute) | **silently receives `default`** — the generator has no mapping for it and passes `default`. If a parameter mysteriously arrives as zero/null, check that it carries the right attribute |

## Field Attributes

### `[BtDeltaTime]`

```csharp
[BtDeltaTime] public float DeltaTime;
```

* On a struct field (typically `float`). The generated `OnUpdate` assigns `state.WorldUnmanaged.Time.DeltaTime` to it before scheduling the job — the sim's frame delta, exactly what your movement code wants.

### `[BtCommandBuffer(typeof(SomeSystem))]`

```csharp
[BtCommandBuffer(typeof(EndSimulationEntityCommandBufferSystem))]
public EntityCommandBuffer.ParallelWriter CommandBuffer;
```

* Field type must be **`EntityCommandBuffer.ParallelWriter`**.
* The generated system fetches the named system group's singleton each frame and calls `CreateCommandBuffer(state.WorldUnmanaged)`; the ParallelWriter is handed to your job.
* Typical choice: `EndSimulationEntityCommandBufferSystem` (structural changes replayed at end of frame).

### `[BtSingleton(typeof(MarkerComponent))]`

```csharp
[BtSingleton(typeof(WorldConfig))]
public WorldConfig Config;
```

* Any field type. The generated system queries the world singleton with the **marker** type you pass in the attribute and passes the **field's type** component data into `Process` (by value). Use this to reach any world singleton without `SystemAPI` (which isn't available in jobs).

### `ComponentLookup<T>` / `BufferLookup<T>` fields

```csharp
public ComponentLookup<LocalTransform> Transforms;          // read/write
[ReadOnly] public BufferLookup<ScoreBuffer> Scores;         // read-only
```

* **Exempt from the query** — the system compiles even if your agents don't all have `T`. Inside `Process` use `HasComponent`, `TryGetComponent`, `TryGetBuffer`, `[entity]`, … for random access. This is the correct tool for *targeted* access (e.g. modifying the entity a Find node located).

## The Hash Layout Inside the Blob

For an action node the compiler stores, starting at the node's `HashIndex`:

```
[ nodeHash (identity) ] [ prefabHash (only if [BtPrefab] used) ] [ inputPortHash_0 ] [ inputPortHash_1 ] … [ outputPortHash_0 ] …
```

* `nodeHash` = FNV-1a of the fully-qualified struct name (matches the generated system's `ACTION_HASH`).
* Port hashes resolve through the blob's `Hash → BbIndices` table into blackboard slots; `0`/`-1` means "unconnected → default".
* The editor keeps this layout in sync with your `Process` signature when you change the component type of an existing node: surviving ports keep their hashes, stale entries are dropped, new ports start unconnected.

## Error Codes You May See

| Code | Meaning |
|---|---|
| **BA0001** | `Process` doesn't return `NodeStatus` (or is missing) |
| **BA0002** | generation failure — invalid type parse, no valid components for a registered system, or `[BtBlackboard]`/`[BtPrefab]` with an unsupported type |
| **BA0003** | warning: a component type in a generated system's `Components` array couldn't be resolved in the project (usually a typo in a `[BtCondition]` component name, or the assembly isn't referenced) |
