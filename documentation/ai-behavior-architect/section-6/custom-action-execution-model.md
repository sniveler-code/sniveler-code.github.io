# ⏱ The Custom Action Execution Model

Custom actions (and the built-in Find / Condition nodes) do **not** run inside the tree evaluator. The runner *requests* them, and a dedicated generated system executes them in its own parallel job. Understanding this request → execute → read-back loop is the single most important thing for custom-node authors, because it explains the timing, the query rules, and the most common "my action never runs" bug.

## The Frame-by-Frame Timeline

```
Frame N
  BtRunnerSystem (parallel over agents)
    └─ node entered → BtActionState{hash, nodeIndex, Running} added to the agent
                      BtNodeRequest{agent, nodeIndex, hash, Active=true} enqueued
  BtDispatcherSystem (generated, after the runner)
    └─ dequeues request → EndSimulation-ECB: ENABLE <Bt{H:X}System.Tag> on the agent
  (tag becomes effective at end of frame N)

Frame N+1
  Bt{H:X}System (generated action system)
    └─ IJobChunk over agents with Tag + full query match:
         Process() is called; status written back into BtActionState
         agents left without a Running H-action get their Tag DISABLED
  BtRunnerSystem
    └─ re-enters the node: reads BtActionState.Status
         Running   → node stays Running
         Success   → action state removed; node reports Success (and, if the
                     node has a flow child, descends into it)
         Failure   → action state removed; node reports Failure
```

**Consequences:**

* **One-frame activation latency.** `Process` first runs the frame *after* the node was entered; the runner observes the result the next time it runs (same frame if the action system runs before the runner in your world layout, one more frame otherwise). A "single-frame" action therefore occupies **at least 2 frames**: enter → execute → complete.
* **`Running` means "call me again".** While `Process` returns `Running`, the Tag stays enabled and the action re-executes every frame — no polling code needed, the loop is implicit.
* **Deactivation is automatic.** When the action reports a terminal status, its `BtActionState` entry is removed and the Tag is disabled (no running actions left) — the job stops visiting the agent entirely. Zero cost when idle.
* **Parallel abandonment.** If a Parallel node finishes while your action is still `Running`, the runner removes the state entry and queues a *deactivation* — the Tag is disabled and your action stops mid-run. (Your `Process` is not given a cancellation callback; it simply stops being called. Any side effects it made remain.)

## The Query Rule (the #1 "my action never runs" bug)

The generated system builds **one entity query** from your `Process` signature:

```
WithAllRW<BtActionState, Tag>
.WithAll<BtAgent>
.WithAll<every IComponentData parameter>      // WithAllRW when passed `ref`
.WithAll<every DynamicBuffer<T> parameter>
.WithAll(RW if [BtOutput] present)<BtBlackboardEntry>
.WithAll(RW if [BtBlackboard] ref present)<BtNodeState>
```

An agent entity is only visited if it matches the **entire** query. Therefore:

> ⚠️ **Every component and buffer you reference in `Process` must exist on *every* agent entity that can run this action.** If an agent lacks even one of them, the entity silently falls out of the query: `Process` is never called, the `BtActionState` entry stays `Running` forever, the Tag stays enabled, and the agent's tree **hangs on that node** (watch for the permanent yellow border in the debugger).

Design guidance:

* Reference only components you are certain **all** your agents have (e.g. `LocalTransform`, a shared `AgentData` struct).
* If you need to *optionally* touch a component, don't put it in the signature — use a `ComponentLookup<T>` field and `HasComponent`/`TryGetComponent` inside `Process` (lookups are exempt from the query — see [ECS Components in Custom Nodes](#ecs-components-in-custom-nodes)).
* If different agent *types* need different actions, that's the point: give each type its own `[BtCustom]` action (or gate with a `Condition` node before the action).

## State, Identity and the Tag

* The **Tag** is added at **bake time** by the generated `BtBakingSystem` to every agent carrying a `BtActionBakeRequest` for the hash (i.e. every agent whose compiled tree contains the node). It starts **disabled** and is toggled at runtime.
* If you change which agents use an action, **re-bake**.
* The action identifies *its node instances* by `(ActionHash, NodeIndex)`: the same action type can run at several positions in one tree simultaneously, each with an independent `BtActionState` entry.
* **Blackboard ports are resolved per node instance** from the blob (`HashIndex` → `BbIndices`), so two instances of the same action in the same tree can read/write different blackboard slots.

## Performance Characteristics

* **Idle cost: zero.** No Tag enabled ⇒ the action system's query is empty for that agent; the job doesn't even schedule over it (`_query.IsEmpty` → return).
* **Active cost: one `IJobChunk` invocation per entity per frame** while `Running` — same order of magnitude as any other ECS system job, Burst-compiled, no allocations.
* **Burst constraints apply to your `Process` body**: no managed allocations, no string ops (use `BtLogger`'s `FixedString` builder), no `UnityEngine` types except those explicitly allowed. Use `Unity.Mathematics` for math.
