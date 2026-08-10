# 🌳 Composites

Composite nodes are the structural backbone of your Behavior Tree. They control the flow of execution, deciding which of their children (connected below them) to run, and in what order.

#### ➡️ Sequence

The Sequence node executes its children from left to right.

* **Success:** It returns Success only if **all** of its children return Success.
* **Failure:** It stops and returns Failure the moment **any** child returns Failure.
* Use case: A strict list of tasks. (e.g., Check Ammo -> Aim -> Fire). If the agent has no ammo, the sequence fails and stops immediately.

#### 🔀 Selector

The Selector node executes its children from left to right.

* **Success:** It stops and returns Success the moment **any** child returns Success.
* **Failure:** It returns Failure only if **all** of its children return Failure.
* Use case: Prioritizing actions. (e.g., Try to take cover -> Try to shoot -> Try to run away). It attempts the first option; if that fails, it tries the next.

#### 🎲 Random Sequence & Random Selector

These function exactly like their standard counterparts, but instead of evaluating children strictly from left to right, they evaluate them in a **random, non-repeating order**.

* Use case: Making AI feel less predictable (e.g., choosing a random patrol point or picking a random taunt animation).

#### ⏸ Parallel

The Parallel node executes **all** of its connected children simultaneously on the same frame.\
When you select the Parallel node, you can configure its **Policy** in the settings panel:

* **Require All Success:** The Parallel node returns Success only when every running child finishes with Success. If any child fails, the Parallel node immediately returns Failure and aborts the other children.
* **Require One Success:** The Parallel node returns Success the moment any child finishes with Success, instantly aborting the remaining running children.
* Use case: Moving while shooting, or monitoring for threats while performing a task.
