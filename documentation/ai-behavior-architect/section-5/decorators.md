# 🎀 Decorators

Decorator nodes have exactly **one child** (single Input + single Output flow port). They sit above the child and alter when it runs, how many times, or how its result is reported.

## 🔁 Repeater

`Decorators/Decorator Repeater`

Runs its child a fixed number of times, **fully re-executing** it on every iteration.

* **Value** (inspector, int, ≥ 0): number of full runs. **`0` = infinite.**
* On entry the loop counter resets to 0.
* After each child **completion** (Success *or* Failure) the counter increments; if `count < value` the child is **re-entered with a fresh (None) state**, otherwise the Repeater returns **Success** to the parent.
* While the child is mid-run, the Repeater is not in the tick path at all (the agent's resume point is the child) — this is what makes re-entrance clean: every iteration starts from zero.

> Use case: `Chop Tree 5 times`. The `value 0` + a `Blackboard Modify (Use DeltaTime)` inside is the canonical time-accumulator pattern (see [Blackboard Nodes](#blackboard-nodes)).

## 🔄 Retry

`Decorators/Decorator Retry`

Re-runs its child when it **fails**, up to a limit.

* **Value** (inspector, int): **maximum total attempts** (the child runs at most `value` times).
* On entry the attempt counter resets to 0.
* Child **Success** → **Success** to the parent.
* Child **Failure** → `attempts++`; if `attempts < value` the child is re-entered, otherwise **Failure** to the parent.

> ⚠️ **Known limitation — custom/composite children can hang (verified against `BtRunnerSystem`).** On the retry re-entry the child is resumed in **`Running`** state, and the resume point stays on the child. Each node type handles a `Running` re-entry differently:
> * **`Wait` / `Delay`** — correct: their handlers treat `Running` as "continue my timer", so `Retry → [Wait, then attempt]` works as expected.
> * **Custom actions** (`Requested`/`Transaction`) — **hang**: the child's failure already removed its `BtActionState` entry, and the `Running` re-entry path in `ProcessCustomAction` only *observes* an existing state — with none present it does **not** re-enqueue the request. The agent then sleeps forever on that node (permanent `Running` in the debugger).
> * **Composites** (`Sequence`/`Selector`/random variants) — **hang** the same way: they have no `Running` re-entry case at all.
>
> Workarounds for retry semantics around custom logic:
> * make the custom action retry internally — it re-runs `Process` every frame while `Running`, so implement attempt counting inside the action, or
> * use `Selector → [attempt-branch, …]` with the attempt counter in a blackboard variable, or
> * wrap the attempt in a `Repeater` **only if** the attempt is built from stateful leaves (same limitation applies to composites/custom actions).

> Use case: `Try to unlock the door up to 3 times` (with a `Wait` between attempts works out of the box).

## ⏳ Cooldown

`Decorators/Decorator Cooldown`

Gates its child with a **real-time** cooldown measured against `SystemAPI.Time.ElapsedTime`.

* **Value** (inspector, float, seconds).
* The state slot stores a **ready-time in milliseconds** (`uint` view of the float slot).
* On entry: if `now ≥ readyTime` → descend into the child; otherwise → **Failure immediately** (the child is *not* ticked).
* After the child completes — **with Success or Failure** — the ready time is set to `now + value`, and the child's result is passed through unchanged.

> Use case: prevent an enemy from spamming a heavy attack; rate-limit a projectile spawn.
> Note: a child that is *interrupted* without a terminal status (e.g. abandoned by a Parallel) does not arm the cooldown — only completed runs do.

## 🚫 Inverter

`Decorators/Decorator Inverter`

Inverts the child's **terminal** status:

* child `Success` → **Failure**
* child `Failure` → **Success**
* child `Running` → keeps running (inversion happens on completion)

> Use case: `NOT in range` — wrap an in-range condition.

## ✅ Force Success / ❌ Force Failure

`Decorators/Decorator Force Success` · `Decorators/Decorator Force Failure`

Run the child, **discard its result**, and report a fixed one:

* **Force Success:** always reports **Success** (even if the child failed).
* **Force Failure:** always reports **Failure** (even if the child succeeded).

The child is still fully executed — these decorators change *signaling*, not execution.

> Use case: fire a "best effort" animation trigger you don't want to block the branch on; or short-circuit a branch the moment a non-critical side effect completes.
