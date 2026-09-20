# ⚙️ Runtime Internals

This section documents the exact per-frame pipeline, the evaluator's state machine, and the runtime settings — everything you need to reason about timing, ordering and performance.

## The Frame Pipeline

All systems live in the **Simulation** group unless noted. "Generated" means produced by the code generator for your specific trees.

```
Initialization group (runs before simulation, every frame)
├── BtPrefabCacheSystem
│     keeps a persistent NativeHashMap<ulong,Entity> fed by the scene's
│     BtGlobalPrefabRegistry buffer; rebuilt only when the registry changes
│     (scene load). Consumed by BtSpawnSystem and [BtPrefab] action systems.
└── BtSpawnBlackboardSystem
      for each entity carrying BtSpawnEntityMarker (set by BtSpawnSystem
      last frame): copies the spawned Entity into the spawning agent's
      blackboard output slot, then removes the marker.
      ⇒ Create-Entity output ports are valid from this frame on.

Simulation group
├── BtDebugInitSystem                    [UNITY_EDITOR only]
│     ensures every BtAgent has a BtDebugState buffer (via a parallel ECB job)
├── BtRunnerSystem                       ★ the tree evaluator
│     Burst IJobEntity over: BtAgent, BtActionState, BtParallelBranchState,
│     BtNodeState (+BtDebugState in editor), BtBlackboardEntry
│     • reads BtRuntimeSettings once (max iterations, warnings)
│     • ticks each agent's tree (see state machine below)
│     • enqueues: BtSpawnRequest (Create Entity) and BtNodeRequest (actions)
├── BtDispatcherSystem                   [generated]  [UpdateAfter BtRunnerSystem]
│     drains the BtNodeRequest queue, sorts by entity index (determinism),
│     then per request (parallel deferred job):
│     • Find / Condition / custom action → EndSimulation-ECB:
│       SetComponentEnabled<Bt{H:X}System.Tag>(agent, active)
│     • Change Entity → enqueues BtTransitionRequest into that
│       transaction system's own queue
├── Bt{H:X}System  (one per unique Find / Condition / custom action)
│     Burst IJobChunk over agents whose Tag is enabled AND whose full
│     query matches; calls Process(); writes NodeStatus back into
│     BtActionState; disables the Tag on agents left with no running H-action
├── Bt{H:X}TransactionSystem  (one per unique Change-Entity config)
│     drains its BtTransitionRequest queue, sorts by target index, applies
│     the Modify operations via lookups in a deferred job, and writes the
│     resulting status back into the agent's BtActionState
└── BtSpawnSystem                        [UpdateAfter BtRunnerSystem]
      dequeues BtSpawnRequests, sorts by agent index (determinism), and in a
      parallel deferred job: Instantiates the prefab (from BtPrefabCacheSystem's
      map) via the EndSimulation-ECB, sets LocalTransform when "Enable
      Transform" is on, optionally parents to the agent + LinkedEntityGroup,
      tags the spawn with BtSpawnEntityMarker (for the output port), and
      writes Success/Failure back into the agent (or its Parallel branch state)
```

Notes on ordering guarantees:

* **`BtRunnerSystem` → `BtDispatcherSystem`** is explicit (`UpdateAfter`), so a node entered this frame can have its Tag enabled for this same frame's end (actions first run next frame).
* **Action systems vs. runner:** there is no explicit ordering between the generated action systems and the runner (both in Simulation group). The design doesn't need one: the runner only *reads* `BtActionState`, and actions only write statuses — the handshake converges within one frame regardless of intra-frame order.
* **Spawn results:** `BtSpawnSystem` writes the node's Success/Failure into the agent *immediately* (prefab resolution is synchronous against the registry map), so the tree sees the spawn as complete the same frame it was requested; only the *entity id output* waits for the Initialization relay.

## The Evaluator State Machine

`BtRunnerSystem` schedules `BtRunnerJob : IJobEntity` (Burst). Per agent:

1. **Resume point:** the agent's `BtAgent.CurrentNodeIndex` (persisted component). `-1` means "tree finished" → reset to `0` (re-run the root) and set `DebugReset` for the editor.
2. **Tick loop:** a `while` loop steps the state machine; each iteration dispatches on `NodeType` (Sequence, Selector, Random variants, Parallel, Wait, Delay, Requested/Transaction, the six decorators, Blackboard Condition/Modify, SpawnEntity). After each step:
   * if the node completed *and* advanced to a parent/sibling, the loop **continues** (so an all-immediate tree can traverse many nodes in one frame),
   * if the status is **Running**, the loop **breaks** — the agent sleeps until next frame,
   * the loop is capped at **MaxIterationsPerFrame** iterations; hitting the cap logs an error when warnings are enabled (see settings).
3. **Custom actions** (`Requested` / `Transaction`): the runner never runs them. It records a `BtActionState{ActionHash, NodeIndex, Running}` and enqueues a `BtNodeRequest`; on re-entry it *reads* the status the generated system wrote. Terminal statuses remove the state entry (and a `Success` on a node that has a flow child descends into it).
4. **Parallel:** each branch is an independent mini-state-machine stored in the `BtParallelBranchState` buffer (its own `CurrentNodeIndex`/`LastNodeIndex`/`Status`). On completion, abandoned branches get their running actions deactivated (see [Composites](#composites)).
5. **Random composites:** child picks are seeded from `math.hash(int3(entityIndex, nodeIndex, frame))` — deterministic per (agent, node, frame), different across agents.

**Resume-point semantics in one sentence:** the agent's *current node* is the deepest node that is not yet terminal — everything above it is implied by the parent/child links in the blob, so a whole tree's progress fits in `(CurrentNodeIndex, LastNodeIndex, LastStatus)` plus the small state buffers.

## Runtime Settings (`BtRuntimeSettings`)

Add **`BtSettingsAuthoring`** (MonoBehaviour, in a sub-scene) to configure the runner; it bakes into a world singleton `BtRuntimeSettings`:

| Field | Default | Meaning |
|---|---|---|
| `MaxIterationsPerFrame` | `50` | per-agent cap on node-transitions per frame (the "infinite loop" guard). A well-behaved tree typically uses far less; a tree of *always-completing* leaves (conditions, blackboard ops) that runs to completion in one frame consumes one step per node — **raise this for very deep trees**. |
| `LogInfiniteLoopWarnings` | `true` | when an agent hits the cap, log `Behavior Tree infinite loop detected on entity: …` (error). |

If the singleton is absent, the defaults above apply. The runner reads the settings lazily on its first update.

## What "Zero Allocation" Means Here (Precisely)

* **Hot path (per frame, per agent):** the runner touches only the blob (read-only), the agent's unmanaged buffers, and two `NativeQueue` parallel writers (fixed capacity, allocated once). No `new`, no strings, no `List`/`Dictionary`.
* **Find systems** allocate one `NativeParallelMultiHashMap` **per system per frame** (size = candidate entity count, `TempJob` allocator, disposed after the jobs) — this is unmanaged, job-allocator memory, not GC; it's the price of the spatial index and scales with world entity count, not agent count.
* **Transaction systems** allocate their queue/list once (`Persistent` in `OnCreate`).
* **Editor-only paths** (`BtDebugState`, log formatting under debug defines) vanish in builds.
* **Logging:** `BtLogger.BurstLog()` builds messages in a 512-byte `FixedString` and is `[BurstDiscard]` + `Conditional` — zero cost unless a debug define is active.
