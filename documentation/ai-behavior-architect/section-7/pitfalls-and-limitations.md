# ⚠️ Pitfalls & Limitations

A consolidated list of the sharp edges, verified against the source. If you hit a "weird" behavior, check here first.

## Trees & Nodes

1. **Children are ordered by canvas position, not creation order.** The compiler sorts siblings by `Position.x` (left → right). Tidy your canvas; overlapping x-positions are ordered by the link list's remaining order.
2. **At most 31 children per composite** (random variants *require* ≤ 31 — a hard compile-time assert; the visited bitmask is 32 bits).
3. **A tree with no root (or a root with no input) is dead.** `BtAgentAuthoring` bakes what it finds; the runner starts at index 0 of the flat table, which corresponds to the first node the editor exposes as root (topmost node without an input link).
4. **Empty composites:** `Sequence` = Success, `Selector` = Failure. Not an error — just vacuous.
5. **Sub-trees are flattened at compile time** — a `SubTree` node type never appears in the blob. A sub-tree's root inherits the parent's parent; its blackboard variables become *shared* state slots (same variable ⇒ same slot across the whole tree).
6. **Circular sub-tree references are rejected** at compile time with an error log, and the offending node is *skipped* (its children are disconnected) — the tree still compiles.
7. **Node identity is by type+configuration hash, not by position.** Renaming a custom struct's *type* or changing a Find node's *Spatial Cell Size* changes the node's hash ⇒ a new generated system is produced (old Tag stays on baked agents until re-bake). Changing a `[BtParam]` value does *not* change identity (params are data, in `FloatData`).

## Custom Actions

8. **The query rule is silent.** An agent missing any component/buffer in the `Process` signature simply doesn't run the action — no log, just a hang (permanent `Running`). Verify with the ECS debugger: if the Tag is enabled but the action system's query is empty for that agent, a component is missing.
9. **Unattributed bare scalars get `default`.** A `Process(float x)` with no `[BtParam]`/`[BtInput]` compiles but always receives `0` — the generator has no mapping and passes `default` silently.
10. **`[BtBlackboard]` ports are strict:** only `float`/`int`/`uint`; each must be *connected* in the graph (unconnected ⇒ compiler error log at bake, slot index `-1`).
11. **`Process` is Burst-compiled.** No `UnityEngine.Debug.Log` (use `BtLogger`), no managed allocations, no coroutines, no `SystemAPI`. If you see `[Burst]` warnings about your struct, they are about *your* `Process` body.
12. **Abandonment has no callback.** When a Parallel finishes early, running actions are disabled (Tag off) without notification. Don't rely on "my action always completes"; make side effects idempotent or explicitly handle restarts.
13. **One `[BtPrefab]` per action**, type must be `Entity`; unassigned prefab ⇒ authoring-time error. The prefab is resolved at runtime from the *scene's* registry — spawning from a sub-scene whose registry doesn't contain the prefab passes `Entity.Null`.

## Runtime Timing

14. **Custom actions have ≥ 1 frame of activation latency** (request → Tag enable → next execution) and their result is observed by the runner no earlier than the next runner pass. Design stateful actions around "ticked every frame while Running".
15. **Create-Entity output ports are one frame late** (the spawned entity id arrives via the Initialization-group relay). The spawn *itself* completes the same frame (registry lookup is synchronous).
16. **Cooldown/elapsed time is real (unscaled) time** — `SystemAPI.Time.ElapsedTime`; `Wait` is scaled (integrates `Δt`); `Delay` is frames. Mixing them in one design is a classic source of "why is this faster/slower than expected".
17. **`MaxIterationsPerFrame` (default 50) caps per-agent progress.** A tree of all-immediate nodes (conditions, blackboard ops) that completes fully in one frame can trip the cap on deep trees — you'll see an error log. Raise the setting in `BtSettingsAuthoring` rather than "fixing" the tree.
18. **Determinism:** sibling processing order is canvas order; Find/Random-composite randomness is seeded per `(entity, node, frame)`; the dispatcher and spawn systems sort their queues by entity index before parallel processing. Re-bake after *any* structural change to keep agents in sync.

## Stateful Nodes

19. **`Retry` around custom/composite children can hang** (see [Decorators](#decorators) for the exact mechanism). Safe children: `Wait`/`Delay` and immediate-failing leaves.
20. **All stateful nodes in the same Parallel branch share one wait-state slot** (a deliberate optimization — on a linear path, only one stateful node is active at a time; nested Parallel branches get their own slots). Consequence: you cannot run two independent timers *in parallel within one branch* via built-in nodes — wrap the second one in a nested `Parallel` if you need simultaneous timers.
21. **`Repeater` with `0` = infinite**, and each iteration is a *fresh* run (state re-initialized). A `Repeater → Wait(1)` that you interrupt (Parallel abort) loses the in-progress timer on restart.

## Editor & Code Generation

22. **Two-stage generation — respect the order.** Stage 1 (editor) writes `SystemsNote.g.cs` + the generated asmdef when graphs/settings change; Stage 2 (Roslyn) reacts to `[BtCustom]`/`[BtCondition]`/`[BaSystemNodes]` types *and* the registry. Adding a new custom struct requires a Unity recompile (stage 2 runs then); adding a new *node instance* of an existing type does not (it's just data).
23. **`[BtCondition]` components are a closed set.** Only types carrying the attribute appear in the Find/Condition/Change-Entity dropdowns. Adding/removing the attribute from a struct that is *already used in a graph* will break the generated systems on next compile (BA0003 until fixed) — change such component types only with care.
24. **The generated asmdef references your code.** If your `[BtCustom]` types move between assemblies, the generated asmdef may fail to resolve them (BA0003) — the generated `Assembly-CSharp`-style assembly references are derived from where the types live.
25. **Auto-save is throttled (0.5 s)** and flushes on play-mode entry. Closing Unity with unsaved graph changes in the throttle window can lose the last edit — `Ctrl+S` (Save button) is immediate.
26. **Graph assets are the source of truth for identity** (`AssetHash`/`TreeHash` from the asset GUID). Duplicating a graph asset creates a *new* tree identity; agents referencing the old GUID keep the old tree until re-baked.

## Performance

27. **Find cost is O(entities-with-components + (2r/cell)³ × cell-occupancy).** Keep `Max Distance` tight and cell size near average entity spacing. The per-frame `NativeParallelMultiHashMap` in Find systems scales with *world* entity count for the configured components — in worlds with tens of thousands of matching entities, consider reducing the component set (more specific components ⇒ fewer candidates).
28. **Baked prefabs are per-scene.** Each scene that spawns gets its own registry (baked entities are scene-local). A prefab used across scenes must be baked in each.
29. **Agent count ≠ action cost:** an agent only costs runner iterations for nodes that are *active* (Running) or being traversed this frame; idle agents (tree finished) reset to the root and run their first pass. If "finished = do nothing forever" is your intent, end the root in a `Wait` with a very large value or an infinite `Repeater → Wait` — the tree's "completion" semantics are *re-run from the root*, not "stop".

## Known Limitations Summary

| Limitation | Status |
|---|---|
| `Retry` re-entry hang for custom/composite children | known; workaround documented |
| No cancellation callback for abandoned actions | by design; Tag-based stop only |
| `BtBlackboard` (Tier 1) variables are float-only (4 bytes) | by design; Tier 2 ports cover wider types |
| Find requires `LocalToWorld` on candidates and agent | by design (spatial index) |
| No `Aborted` status propagation from user code | `Aborted` is internal (parallel-abort path only) |
| Editor-only debug state; no profiling overlays | out of scope for runtime |
