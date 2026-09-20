# 🐞 Runtime Visual Debugging

Debugging DOTS is notoriously hard because the logic lives inside multithreaded Burst jobs. AI Behavior Architect mirrors the evaluator's state machine back into the editor so you can watch your exact graph run, node by node, in real time.

## 🔍 How to Monitor an Agent

1. Enter **Play Mode** (the editor auto-switches to read-only and locks the canvas).
2. Open the **Entity Hierarchy** window (Window → General → Entity Hierarchy, provided by the Entities package).
3. Select any entity that carries a **`BtAgent`** component.
4. If the Behavior Editor is open, it **snap-loads** the graph asset that the selected entity is running (resolved by matching the blob's `TreeHash` against graph asset hashes) and begins polling that entity's debug state every editor frame.

> 💡 Selecting a *different* agent switches the editor to *that* agent's tree. If two agents run the same graph, the editor shows the graph once and mirrors the status of whichever agent you selected last.

## 🚦 Visual Feedback

The Burst job writes each node's `NodeStatus` into an editor-only `BtDebugState` buffer (one slot per flat node); the editor reads the whole buffer every frame and applies it to the canvas:

| Border / port color | Meaning |
|---|---|
| 🟡 **Yellow** | The node is currently **Running** (it will be re-ticked next frame). |
| 🟢 **Green** | The node returned **Success** this frame. The highlight fades after ~0.5 s. |
| 🔴 **Red** | The node returned **Failure** this frame. The highlight fades after ~0.5 s. |
| ⬜ Gray | Idle — the node was not touched this frame. |

Terminal results (Success/Failure) are stamped with a timestamp and automatically fade to gray, while **Running** stays lit as long as the node keeps ticking — so a `Wait` node glows yellow for its whole duration, and a fast `Condition` flickers green/red each frame.

**Status reset semantics:** when an agent's tree restarts (root completes and the index resets to 0), the runner flags `DebugReset`, and the editor resets every slot to `None` — *except* slots flagged `BlockReset` (nodes that are mid-execution, like a running Parallel's active branch or a running Wait), which keep their state. This prevents stale "success" flashes when a tree loops.

For **Parallel** nodes, each running branch is logged into its own flat node, so you can see *which branches* of a parallel are still alive. When a Parallel finishes and abandons still-running branches, the abandoned custom actions are **deactivated** (their Tag disabled, see [Runtime Internals](#runtime-internals)) so they stop burning CPU.

## ⚡ Zero Overhead in Production

Does visual debugging slow down the DOTS jobs? **No.**

* The `BtDebugState` buffer, the `BtDebugInitSystem` and every `logger.Log(...)` call sit behind `#if UNITY_EDITOR` and/or `[Conditional("UNITY_EDITOR")]` — in a player build the compiler strips the calls entirely, leaving no buffer, no writes, no branching.
* Editor-only warning/error logs go through `BtLogger` with `[Conditional("SNC_DEBUG_INFO")]` / `[Conditional("SNC_DEBUG_WARNINGS")]` define gates, so even log *formatting* disappears unless you opt in by defining those symbols.

> 💡 You *can* opt into managed logging in the editor for deeper diagnostics: define `SNC_DEBUG_INFO` (info) and/or `SNC_DEBUG_WARNINGS` in your assembly's player settings or a scripting define. `BtLogger.LogManaged` and `BurstLogBuilder.LogWarning` only emit under those defines.

## 🐛 What to Look For (Common Debug Patterns)

* **A node stuck yellow forever** — its action never completes. For custom actions: check that the agent actually has every component the `Process` method queries (the generated job silently skips entities that don't match its query — see [The Custom Action Execution Model](#the-custom-action-execution-model)).
* **A Find node flickering red** — nothing in range matches the component conditions, or the **Spatial Cell Size** is smaller than your world's entity spacing (cells are only visited inside the search cube).
* **Parallel looks "stuck"** — one branch is running a long action; the yellow branch child tells you exactly which one.
* **Tree restarts every frame** (whole root flashes) — your root completes and the tree re-runs from the top; that's normal Behavior Tree behavior (root is ticked every frame), not a bug.
