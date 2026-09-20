# 🧠 Core Concepts & Architecture

To get the most out of **AI Behavior Architect** — especially when writing custom nodes or diagnosing runtime behavior — it helps to understand the four stages a visual graph passes through on its way to executing DOTS code:

> **1. Editor compile** → **2. Roslyn code generation** → **3. Sub-scene bake** → **4. Per-frame runtime**

| # | Stage | Where it runs | Reads | Produces |
|---|---|---|---|---|
| **1** | **Editor compile** | Editor — `BtCodeGenerator`, triggered by the **Compile** button (or auto on save) | every `GraphAsset` in the project | `SystemsNote.g.cs` (the `[BaSystemNodes]` registry) + `SnivelerCode.AiBehavior.Generated.asmdef`, written into your **Generated Directory** |
| **2** | **Roslyn code generation** | the C# compiler — `AiBehaviorAnalyzer` (incremental `IIncrementalGenerator`) | the `[BtCustom]` structs, `[BtCondition]` components and the generated `[BaSystemNodes]` class in your compilation | one Burst `ISystem` + `IJobChunk` per unique node configuration (custom actions, Find, Condition, Transaction), plus the shared `BtBakingSystem` and `BtDispatcherSystem` |
| **3** | **Sub-scene bake** | sub-scene baking — `BtAgentAuthoring.Baker`, once per agent `GameObject` | the compiled registry + the agent's assigned `GraphAsset` | a `BlobAssetReference<BtBlob>` (the tree flattened into one contiguous unmanaged block), the per-agent state buffers (`BtNodeState`, `BtActionState`, `BtBlackboardEntry`, `BtParallelBranchState`), and bake requests (per-action Tag components + prefab registry entries) |
| **4** | **Per-frame runtime** | every simulation frame | the blob + the agent's state buffers | behavior: `BtRunnerSystem` ticks the tree; custom actions run in their own generated Burst jobs and report back (see [Runtime Internals](#runtime-internals)) |

## ⚙️ 1. Automated Code Generation (Two Stages)

Behavior Trees are inherently polymorphic (a generic "node" can be an Action, a Sequence, or a Condition). ECS does not support polymorphism — everything must be strictly typed data. AI Behavior Architect bypasses this with a **two-stage code generator**:

**Stage 1 — Editor file writer (`BtCodeGenerator`).**
When you press **Compile** (or it auto-runs on save, depending on your settings), the editor scans **every `GraphAsset` in the project**, extracts the unique *node configurations* (each Find query, each Condition set, each Transaction set, each custom action type) and writes two files into your **Generated Directory**:

* `SystemsNote.g.cs` — a single `[BaSystemNodes]` class holding a `BaSystem[] Nodes` array that registers every unique node configuration with a 64-bit hash index.
* `SnivelerCode.AiBehavior.Generated.asmdef` — an assembly definition referencing the runtime, the DOTS packages, and **the assemblies that actually contain your custom action structs and your `[BtCondition]` components** (detected via reflection).

This stage is *incremental*: the content is hashed, and files are only rewritten (and Unity only recompiles) when the registry content actually changed.

**Stage 2 — Roslyn incremental source generator (`Source~`).**
While Unity compiles, `AiBehaviorAnalyzer` (`IIncrementalGenerator`) reacts to three attribute families anywhere in your compilation:

| Trigger attribute | Target | Generated output |
|---|---|---|
| `[BtCustom("Name")]` | your `partial struct` | `Bt{HASH:X}System : ISystem` **plus** the rest of your `partial struct` turned into a `[BurstCompile] IJobChunk`. Lives in **your** namespace. |
| `[BtCondition]` | component structs | `partial class ComponentsExtension` with `Compare(this ref T, ref BtCondition)` and `Modify(this ref T, ref BtCondition)` — the field-level condition/transaction evaluators used by Find, Condition and Change-Entity systems. |
| `[BaSystemNodes]` | the generated `SystemNodes` class | One system per registry entry: `Bt{HASH:X}System` for Find (spatial hash), Condition (lookup compare) and Transaction (queue-driven modify) nodes, **plus** the shared `BtBakingSystem` and `BtDispatcherSystem`. Lives in `SnivelerCode.AiBehavior.Generated`. |

The 64-bit hash of a node configuration is an **FNV-1a** of a canonical string:

* **Custom actions:** the fully-qualified type name (namespace + struct name). Your struct is therefore registered *by type*, and the graph's node hash matches it exactly.
* **Find / Condition / Change-Entity nodes:** the sorted, de-duplicated list of the involved component type names plus the node kind (Find additionally includes its **Spatial Cell Size** — changing the cell size produces a *new* system; changing Max Distance or Find Mode does **not**, because those are read from the blob at runtime).

> 💡 **Configuration sharing is by design.** Two Find nodes in different graphs that query the same components with the same cell size share **one** generated system. Only entities whose trees actually use a running instance of that node carry its (enabled) Tag, so shared systems cost nothing for agents that don't use them.

## 📦 2. Blob Assets (`BlobAssetReference<BtBlob>`)

At **bake time**, `BtAgentAuthoring`'s baker runs `BtCompiler.Compile(graph)` which flattens your visual tree — following Sub-Tree nodes recursively — into a compact, **offset-based** structure:

* a flat `BlobArray<BtNode>` (type + parent/child/sibling indices),
* a parallel `BlobArray<BtNodeData>` of per-node data pointers,
* pooled `FloatData` (static parameters), `Conditions` (field masks + ops + values), `Parallels`, `Hashes` (node/prefab/port hashes) and `BbIndices` (blackboard slot indices) arrays.

That structure is written into a single **`BlobAsset`** (`BtBlob`) and attached to the agent entity as a `BlobAssetReference<BtBlob>` component inside `BtAgent`.

> 🚀 **Why Blob Assets?**
> The whole tree — nodes, parameters, condition tables — lives in one contiguous block of unmanaged memory. Walking it is cache-friendly, it is read-only, and it can be safely dereferenced with raw pointers inside Burst-compiled multithreaded jobs. No `GameObject` walks, no virtual calls, no allocations.

The **execution model** is an iterative state machine (not recursion): the agent entity carries its resume point (`BtAgent.CurrentNodeIndex`) and the runner re-enters the tree at that node every frame. Every node transition is a small `switch` over `NodeType`, and per-node timers/counters live in the agent's unmanaged buffers. See [Blob Layout Reference](#blob-layout-reference) and [Runtime Internals](#runtime-internals) for the full layout and state machine.

## 💾 3. Unmanaged State Buffers

A Behavior Tree must remember what it was doing last frame (timers, loop counters, which actions are running). `BtAgentAuthoring` allocates the following unmanaged `DynamicBuffer<T>` components directly on the agent entity during baking:

| Buffer | Element type | Purpose |
|---|---|---|
| `BtNodeState` | 4-byte float union (`Value` / `IntValue` / `UIntValue`) | Blackboard variable values, Wait/Delay timers, Cooldown timestamps, Retry/Repeater counters, random-visited bitmasks. Size = `NodeStateCount` from the compile step. |
| `BtActionState` | `{ActionHash, NodeIndex, Status}` | One entry per *currently running* custom/Find/Condition node instance on this agent. The bridge between the runner and the generated action systems. |
| `BtBlackboardEntry` | 16-byte unmanaged union (`BtBlackboardValue`) | The **data-port** blackboard: Entity ids, `float3` positions and any other unmanaged ≤16-byte value passed between nodes through horizontal ports. |
| `BtParallelBranchState` | `{CurrentNodeIndex, LastNodeIndex, Status}` | One entry per Parallel child branch, so Parallel can resume each branch independently. |

Because all state is strictly unmanaged and packed onto the entity chunk, the runtime evaluator **never touches the managed heap** — no `List`, no `Dictionary`, no string formatting (logging goes through `BtLogger`'s `FixedString`-based builder, which is stripped in non-editor builds).

## 🧱 4. The Frame Pipeline at a Glance

Per simulation frame (full details in [Runtime Internals](#runtime-internals)):

1. **`BtDebugInitSystem`** (editor only) — ensures every agent has a `BtDebugState` buffer.
2. **`BtRunnerSystem`** — Burst `IJobEntity` scheduled in parallel over all agents. Ticks each tree as far as it can get (bounded by *Max Iterations Per Frame*), and *requests* custom actions instead of running them inline.
3. **`BtDispatcherSystem`** (generated) — drains the request queue and toggles the per-action **Tag components** (enabling/disabling action systems per agent) or enqueues **transition requests** for Change-Entity nodes.
4. **Generated action systems** (one per unique Find / Condition / custom action) — Burst `IJobChunk` jobs over the agents whose Tag is enabled; they call your `Process` method and write the resulting `NodeStatus` back into `BtActionState`.
5. **`BtSpawnSystem`** — drains spawn requests from Create-Entity nodes and instantiates baked prefabs through an `EndSimulationEntityCommandBuffer`.
6. Next frame's **Initialization group**: `BtPrefabCacheSystem` (keeps an O(1) prefab-hash → entity map) and `BtSpawnBlackboardSystem` (copies newly spawned entities into the blackboard output ports).

The runner never calls action code inline: **requests are queued, actions run in their own parallel jobs, and results are read back one or more frames later.** This indirection is what makes the whole graph safely parallel — and it is the single most important concept to internalize before writing custom nodes. See [The Custom Action Execution Model](#the-custom-action-execution-model).
