# 🧬 ECS Component Reference

Every entity component and buffer in the package, grouped by where they live. All types are in `SnivelerCode.AiBehavior.Runtime.Components`.

## On the Agent (baked by `BtAgentAuthoring`)

| Component | Kind | Content |
|---|---|---|
| `BtAgent` | `IComponentData` | `BlobAssetReference<BtBlob> Tree` (the compiled tree — read-only after baking), `short CurrentNodeIndex`, `short LastNodeIndex`, `NodeStatus LastStatus`, `bool DebugReset` (editor-only progress reset flag) |
| `DynamicBuffer<BtNodeState>` | buffer, fixed size at bake | per-node working state (timers, counters, named variables, random masks) — see [Blob Layout](#blob-layout-reference) |
| `DynamicBuffer<BtBlackboardEntry>` | buffer, fixed size at bake | one 16-byte unmanaged slot per data-port channel (Tier 2 blackboard) |
| `DynamicBuffer<BtParallelBranchState>` | buffer, fixed size at bake | per-Parallel-branch resume state |
| `DynamicBuffer<BtActionState>` | buffer, **grows at runtime** | one entry per currently-running custom/Find/Condition node instance |
| `DynamicBuffer<BtDebugState>` | buffer, **editor only** | per-node runtime status log driving the visual debugger; sized on demand |
| `<Bt{H:X}System.Tag>` (per generated system) | tag, **IEnableableComponent** | per-action-type activation marker; enabled ⇔ the agent has a running node of that action type |
| `BtActionBakeRequest` | buffer (removed after bake) | compile-time list of `(actionHash, hasPrefab, prefabHash)` used by the generated baking system to install the Tags |
| `LocalTransform` (+ dynamic transform) | component | baked automatically by `BtAgentAuthoring` (required for Find and any action with transform params) |

## State Structs

### `BtNodeState` — the 4-byte working slot

```csharp
public struct BtNodeState
{
    public float Value;   // alias: IntValue (int), UIntValue (uint)
}
```

One slot per (shared) state owner. Reinterpreted per node kind:

| Used by | Interpretation |
|---|---|
| named blackboard variable / `[BtBlackboard]` port | the variable's value (float) |
| `Wait` / `Cooldown` | remaining seconds (Wait) / ready-time in ms (Cooldown, `UIntValue`) |
| `Delay` | target frame index (`IntValue`) |
| `Repeater` / `Retry` | loop/attempt counter (`IntValue`) |
| Random Sequence/Selector | visited-children bitmask (`IntValue`) |

### `BtBlackboardEntry` — the 16-byte data slot

```csharp
public struct BtBlackboardEntry
{
    public BtBlackboardValue Value;   // 16-byte union
}
```

`BtBlackboardValue` is an explicit-layout (16-byte) union: `FloatValue`, `IntValue`, `BoolValue`, `DoubleValue`, `Float3Value`, `Int2Value`, `Float2Value`. Written by output ports and `[BtBlackboard]`-less inputs read it; `Entity` ports store the handle in the first 8 bytes.

### `BtActionState`

```csharp
public struct BtActionState
{
    public ulong ActionHash;   // the generated system's ACTION_HASH
    public short NodeIndex;    // which node instance (unique per (tree position))
    public NodeStatus Status;  // Running → written by the action system
}
```

### `BtParallelBranchState`

```csharp
public struct BtParallelBranchState
{
    public short CurrentNodeIndex;
    public short LastNodeIndex;
    public NodeStatus Status;
}
```

### `BtDebugState` (editor only)

```csharp
public struct BtDebugState
{
    public bool BlockReset;
    public NodeStatus Status;   // last status the debugger saw for this node index
}
```

The runner writes `Status` per visited node each frame (buffer auto-resizes to `Nodes.Length`); the editor's graph view colors nodes from it. `BlockReset` stops the "auto-restart on tree completion" in Play Mode (see [Runtime Visual Debugging](#runtime-visual-debugging)).

## Queues & Singletons (world-level)

| Type | Kind | Role |
|---|---|---|
| `BtNodeRequestSingleton` | singleton with `DynamicBuffer<BtNodeRequest>` | the runner → dispatcher request queue (enable/disable action Tags, transaction routing) |
| `BtTransitionRequest` | (struct) per-transaction-system queue element | `Agent`, `Target`, `ActionHash`, `NodeIndex` — Change-Entity work items |
| `BtSpawnRequest` | struct enqueued to `BtSpawnSystem`'s world buffer | `Agent`, `NodeIndex`, `Position` |
| `BtSpawnEntityMarker` | tag on freshly spawned entities (one frame) | `Agent` + `BtBlackboardIndex` — routes the spawned entity into the output port |
| `BtGlobalPrefabRegistry` | component on a scene registry entity | owns the `DynamicBuffer<BtPrefabEntry>` |
| `BtPrefabEntry` | buffer element | `Hash` (prefab asset GUID hash) + `Prefab` (baked entity) |
| `BtRuntimeSettings` | world singleton (baked by `BtSettingsAuthoring`) | `MaxIterationsPerFrame`, `LogInfiniteLoopWarnings` |
| `BtNodeRequest` | struct | `Agent`, `Target`, `ActionHash`, `NodeIndex`, `bool Active` |

## Prefab Pipeline Components

| System | Group | What it does |
|---|---|---|
| `BtPrefabBakingSystem` | (bake) | collects `BtPrefabBakeRequest`s from agents, bakes the referenced `GameObject`s once (dedup by hash) into a registry entity with `BtGlobalPrefabRegistry` + `BtPrefabEntry` buffer, in the agent's scene |
| `BtPrefabCacheSystem` | Initialization | mirrors the registry buffer into a persistent `NativeHashMap<ulong, Entity>` (rebuilt only when the registry's contents change — e.g. scene load) for O(1) hash→prefab lookup by `BtSpawnSystem` and `[BtPrefab]` action systems |

## Enums (reference)

| Enum | Values |
|---|---|
| `NodeStatus` | `None`, `Success`, `Failure`, `Running`, `Aborted` |
| `NodeType` | `None`, `Sequence`, `Selector`, `SelectorRandom`, `SequenceRandom`, `Waiting`, `Delay`, `Requested`, `Transaction`, `DecoratorCooldown`, `DecoratorInverter`, `DecoratorForceSuccess`, `DecoratorForceFailure`, `DecoratorRetry`, `DecoratorRepeater`, `Parallel`, `SpawnEntity`, `BlackboardModify`, `BlackboardCondition`, `SubTree` |
| `ParallelPolicy` | `RequireAllSuccess`, `RequireOneSuccess` |
| `CompareOperator` | `Skip`, `Equal`, `NotEqual`, `Greater`, `Less` |
| `ModifyOperator` | `Skip`, `Set`, `Inc`, `Dec` |
| `FindMode` | `First`, `Nearest`, `Random` |
| `BtBlackboardType` | `Bool`, `Int`, `Float` |
| `BaSystemType` | `None`, `Find`, `Condition`, `Dispatcher`, `Baker`, `Custom`, `Transaction`, `Spawn` |
