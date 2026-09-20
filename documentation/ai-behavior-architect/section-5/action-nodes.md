# ⏱ Action Nodes

The built-in **action** leaves under *Actions/* in the search window are the two time primitives. Both are **terminal** nodes (single Input flow port, no Output flow port) and both are **stateful** — their timer lives in the agent's `BtNodeState` buffer, so they survive frame-to-frame without any external help.

## ⏱ Wait (time-based)

`Actions/Action Wait`

* **Value** (inspector, float, seconds). Default 1.
* On first entry: the timer is loaded with `Value` and the node reports **Running**.
* Each frame: `timer -= DeltaTime` (the simulation frame's delta, i.e. it respects time scaling), the timer is stored back, and the node stays **Running** while `timer > 0`.
* When `timer ≤ 0` → **Success**.

Because the timer persists in the state slot, a `Wait` interrupted by a Parallel abort and later resumed continues from where it left off — it never "jumps" on time-scale changes, it simply integrates `Δt`.

## ⏸ Delay (frame-based)

`Actions/Action Delay`

* **Value** (inspector, **int, frames**). Default 1.
* On first entry: `targetFrame = CurrentFrame + Value` is stored (the `int` view of the state slot) and the node reports **Running**.
* Each frame: if `CurrentFrame ≥ targetFrame` → **Success**, otherwise keep running.

## Wait vs. Delay — which to use?

| | **Wait** | **Delay** |
|---|---|---|
| Unit | seconds (float) | frames (int) |
| Time scaling | scales with `DeltaTime` (slow-mo stretches it) | **frame-locked** — always exactly N frames regardless of FPS |
| Precision | sub-frame (completes mid-frame) | whole frames |
| Use when | game-time durations (cooldowns, animation sync) | frame-exact timing (deterministic step patterns, per-N-frames behavior) |

> ⚠️ Under a fixed-timestep simulation both behave as described. `Delay` is the choice when you need *deterministic* cadence (e.g. "every 30 frames" for LOD checks or animation steps) because frame count is stable even when frame time isn't.

## 📝 Notes

* A `Wait`/`Delay` with `Value ≤ 0` completes on the next evaluation (Wait: `timer ≤ 0` immediately; Delay: `targetFrame ≤ now` immediately).
* Neither node has a data port — they are pure flow primitives.
* Both are the **safe children** for `Retry` (see the [Retry caveat in Decorators](#decorators)).
