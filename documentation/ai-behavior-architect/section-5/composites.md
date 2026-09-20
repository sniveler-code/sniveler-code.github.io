# 🌳 Composites

Composite nodes are the structural backbone of a tree. They have an **Input flow port (top)** and a **Multi Output flow port (bottom)** — you can hang any number of children, ordered **left to right** by their horizontal position on the canvas (the compiler sorts children by `Position.x`).

All composites below are implemented as an **iterative state machine**: the agent's current node index is persisted on the entity, and each frame the evaluator re-enters the tree exactly where it left off. A composite never "waits" — it either descends into a child, or reports a terminal status to its parent.

## ➡️ Sequence

`Composites/Composite Sequence`

Runs children left → right, one at a time.

* **Descend:** when first entered, jumps to the first child.
* **Child Success:** advances to the next sibling (fresh state). No siblings left → **Success**.
* **Child Failure:** immediately **Failure** (remaining children are not attempted).
* **Child Running:** suspends there; resumes next frame.
* **Empty Sequence:** returns **Success** vacuously.

> Use case: a strict task list — `Check Ammo → Aim → Fire`. Any failed step aborts the whole sequence.

## 🔀 Selector

`Composites/Composite Selector`

Runs children left → right, trying each until one succeeds.

* **Descend:** first child.
* **Child Success:** immediately **Success** (remaining children skipped).
* **Child Failure:** tries the next sibling. No siblings left → **Failure**.
* **Child Running:** suspends there; resumes next frame.
* **Empty Selector:** returns **Failure** (nothing to try).

> Use case: prioritized fallback — `Take Cover → Shoot → Flee`.

## 🎲 Random Selector / Random Sequence

`Composites/Composite Selector Random` · `Composites/Composite Sequence Random`

Same policies as Selector/Sequence, but children are picked in a **random, non-repeating order** for each pass:

* the composite stores a **visited bitmask** (one bit per child, in left-to-right order) in its state slot,
* each pick draws a random child among the unvisited ones; the random is seeded from `hash(entityIndex, nodeIndex, frame)`, so different agents pick different orders *and* the order changes frame to frame,
* when all children have been visited, the composite returns its terminal status (`Success` for Random Sequence, `Failure` for Random Selector).

> ⚠️ **Limit: at most 31 children.** The visited mask is a 32-bit int; the compiler asserts this at bake time (`Random selector/sequence node X has N children, max supported is 31`).

> Use case: non-repeating patrol point selection, varied taunt animations.

## ⏸ Parallel

`Composites/Composite Parallel`

Executes **all** children **simultaneously** — each child branch is ticked in the same frame, each with its **own** state (stored in the agent's `BtParallelBranchState` buffer, sized at bake time for every Parallel branch in the tree, including branches inside sub-trees).

**Policy (inspector dropdown):**

| Policy | Completes when… | Result |
|---|---|---|
| **Require All Success** (default) | any child returns **Failure** → abort | **Failure** |
| | all children finish (no failures) | **Success** |
| **Require One Success** | any child returns **Success** → abort | **Success** |
| | all children finish with no success | **Failure** |

**Abort behavior (exact):** when the Parallel completes, every branch still `Running` is abandoned:

1. each abandoned branch's running custom/Find/Condition action is removed from `BtActionState`,
2. a **deactivation request** is queued so the dispatcher disables that action's Tag on this agent — the abandoned action stops executing immediately (this is what `BtParallelDeactivationTests` verifies).

Branches that haven't been started yet are simply never started. When the Parallel is re-entered later, all branch states are reset to `None` and every branch starts fresh.

> Use case: move *while* shooting; monitor threats while performing a task.

## ⚠️ Resuming a Suspended Composite

Because the resume point is stored **on the child**, a composite only re-enters when its child reports a terminal status. Practical consequences:

* a `Sequence` whose child is `Running` stays on that child next frame (the sequence itself is not re-ticked),
* decorators like `Repeater`/`Retry` re-enter their child with an explicit state transition (see [Decorators](#decorators)),
* this is why a tree that is *entirely* of immediate-completing leaves (conditions, blackboard ops) can run many nodes in a single frame — bounded by **Max Iterations Per Frame** (default 50). Deep, always-completing trees may need a higher budget; see [Runtime Internals](#runtime-internals).
