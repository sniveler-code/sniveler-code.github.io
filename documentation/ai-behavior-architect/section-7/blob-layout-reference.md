# 🗃 Blob Layout Reference

The compiled tree is a `BlobAssetReference<BtBlob>` — one contiguous unmanaged block. This is the exact layout the runtime walks, as produced by `BtCompiler.Compile` and baked by `BtAgentAuthoring`.

## `BtBlob` — Root

```csharp
public struct BtBlob
{
    public int BlackboardCount;        // slots in the agent's BtBlackboardEntry buffer
    public ulong TreeHash;             // FNV-1a of the graph asset's GUID (editor identity link)
    public BlobArray<BtNode> Nodes;           // flat node table
    public BlobArray<BtNodeData> NodeData;    // per-node data offsets (sparse)
    public BlobArray<float> FloatData;        // pooled static floats (params, timers, positions)
    public BlobArray<BtCondition> Conditions; // pooled condition/transaction tables
    public BlobArray<BtParallel> Parallels;   // parallel node settings
    public BlobArray<short> ParallelChildren; // parallel branch child indices
    public BlobArray<ulong> Hashes;           // pooled hashes (node identity, prefab, ports)
    public BlobArray<short> BbIndices;        // hash → blackboard slot (Tier 2 data ports)
    public BlobArray<short> StateIndices;     // [BtBlackboard] port hash → state slot (multi-port nodes)
    public short NodeStateCount;              // slots in the agent's BtNodeState buffer
}
```

## `BtNode` — Flat Node Table

```csharp
public struct BtNode
{
    public NodeType Type;            // Sequence | Selector | SelectorRandom | SequenceRandom |
                                     // Waiting | Delay | Requested | Transaction |
                                     // DecoratorCooldown | DecoratorInverter | DecoratorForceSuccess |
                                     // DecoratorForceFailure | DecoratorRetry | DecoratorRepeater |
                                     // Parallel | SpawnEntity | BlackboardModify |
                                     // BlackboardCondition | SubTree (never appears in the flat table)
    public byte  ChildCount;         // max 31 (bitmask limit, enforced at compile)
    public short ParentIndex;        // index into Nodes; the SubTree node is transparent
    public short NextSiblingIndex;   // -1 = last child
    public short FirstChildIndex;    // -1 = leaf
    public short DataIndex;          // index into NodeData; -1 = no data (plain composites/decorators)
}
```

Children are linked as a **sibling list** (`FirstChild` → `NextSibling` chain), ordered left-to-right by canvas position. Sub-tree nodes are replaced *in place* by their sub-tree's root during flattening — a `NodeType.SubTree` never appears in the compiled blob.

## `BtNodeData` — Per-Node Data Offsets

```csharp
public struct BtNodeData
{
    public short ConditionIndex;  // → Conditions (blackboard cond/modify, find/condition/transaction tables)
    public short FloatIndex;      // → FloatData (params / timer values / spawn position)
    public short HashIndex;       // → Hashes (node identity; +1 = prefab hash if HasPrefab; +2… = ports)
    public short ParallelIndex;   // → Parallels
    public short StateIndex;      // → BtNodeState slot (timers, counters, named variable, visited mask)
    public bool  UseDeltaTime;    // Blackboard Modify: scale value by Δt
    public bool  HasPrefab;       // shifts the port hash positions by one
    public bool  IsChanged => any index != -1;
}
```

A node only gets a `NodeData` entry when it carries data (`IsChanged`) — plain `Sequence`/`Selector`/`Inverter`/`Force*` nodes are pure topology.

### Hash Layout at `HashIndex` (per node kind)

| Node kind | Layout |
|---|---|
| custom action | `[nodeHash] [prefabHash?] [inputPortHash…] [outputPortHash…]` |
| Find | `[nodeHash] [outEntityPortHash] [outPositionPortHash]` |
| Condition | `[nodeHash] [inEntityPortHash]` |
| Change Entity | `[nodeHash] [inEntityPortHash]` |
| Create Entity | `[prefabHash] [inPositionPortHash] [outEntityPortHash?]` |

`portHash = 0` ⇒ unconnected ⇒ `BbIndices` slot `-1` (reads default / static fallback).

### FloatData Layout (per node kind)

| Node kind | Layout |
|---|---|
| Wait | `[seconds]` |
| Delay | `[frames]` |
| Repeater / Retry | `[count]` |
| Cooldown | `[seconds]` |
| Parallel | *(none — uses Parallels table)* |
| Blackboard Condition/Modify | *(none — uses Conditions[ConditionIndex]) |
| Find | `[findMode] [cellSize²] [distance²]` |
| Create Entity | `[x, y, z, useTransform(0/1), addParent(0/1)]` |
| custom action | `[param0, param1, …]` (booleans as 0/1) |

## `BtCondition` — Condition / Transaction Table

```csharp
public struct BtCondition
{
    public ushort Mask;             // bit i = field i is active (operator != Skip)
    public BlobArray<float> Values; // per-field value
    public BlobArray<byte> Ops;     // per-field operator
}
```

* `Ops` are `CompareOperator` (Skip=0, Equal, NotEqual, Greater, Less) for Find/Condition checks, or `ModifyOperator` (Skip=0, Set, Inc, Dec) for Change-Entity transactions — the same struct serves both; the *generated code* decides the interpretation.
* **One `BtCondition` entry per (component, purpose):** Find/Condition nodes produce one entry per component (comparisons); Change-Entity produces one per component for buffer components (comparisons) *and* one for the transactions, plus one per non-buffer component (transactions only). `ConditionIndex` points at the first entry of the node's component list; the generated code indexes through them in order.
* **Field order** within an entry follows the component's field declaration order (as reflected in the editor rows); `Mask` uses the same indices.
* Comparison of `Equal`/`NotEqual` uses the **0.001 epsilon**; `Modify` clamps integer results to the field's type range (overflow ⇒ the transaction fails, value untouched).

## `BtParallel`

```csharp
public struct BtParallel
{
    public ParallelPolicy Policy;          // RequireAllSuccess | RequireOneSuccess
    public short ChildrenStartIndex;       // → ParallelChildren
    public short ChildrenCount;
    public short StateStartIndex;          // → the agent's BtParallelBranchState buffer
}
```

`StateStartIndex` is assigned during a post-flattening pass (`CalculateParallelOffsets`) — Parallel branches anywhere in the tree (including inside sub-trees) get contiguous branch-state slots, which the baker sizes the agent's buffer to.

## Pooled Tables & Sharing

* **`FloatData`, `Hashes`, `Conditions`, `StateIndices`** are *pools*: nodes reference positions in them; identical data across nodes is never duplicated in the blob.
* **State slots (`BtNodeState`)** are **shared by hash** — the same named blackboard variable used in the parent tree and in a sub-tree occupies exactly one slot (`GetOrCreateSharedState`), and its default value initializes it at bake time.
* **Blackboard slots (`BtBlackboardEntry`)** are **shared by port hash** — the same output port feeding N inputs maps to one slot.

## Sizing Formulas (per agent, at bake time)

| Buffer | Size |
|---|---|
| `BtNodeState` | `NodeStateCount` = unique shared state hashes (named variables) + one per Wait/Delay/Cooldown/Retry/Repeater/random-composite node + Parallel branch wait states |
| `BtBlackboardEntry` | `BlackboardCount` = unique non-zero port hashes across the compiled tree |
| `BtParallelBranchState` | sum of `ChildrenCount` over every Parallel in the tree |
| `BtActionState` | 0 (grows at runtime, one entry per running custom/Find/Condition node instance) |
| `BtDebugState` (editor) | `Nodes.Length` (resized on demand by the runner in Play Mode) |
