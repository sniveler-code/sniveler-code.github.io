# 🎀 Decorators

Decorator nodes only ever have **one child**. They sit above that child and modify its behavior, alter its result, or restrict its execution.

#### 🔁 Repeater

Executes its child node multiple times before returning a result to the parent.

* **Configuration:** You define the number of loops in the Node Inspector. If set to 0, it loops infinitely.
* Use case: "Chop Tree 5 times."

#### 🔄 Retry

Similar to the Repeater, but it only restarts the child if the child returns **Failure**.

* **Configuration:** You define the maximum number of retry attempts. If all attempts fail, the Retry node returns Failure to the parent.
* Use case: "Try to unlock the door up to 3 times."

#### ⏳ Cooldown

Prevents its child node from being executed again until a specific real-world time duration has passed. If evaluated while the cooldown is active, it instantly returns Failure.

* **Configuration:** Set the cooldown time (in seconds).
* Use case: Preventing an enemy from spamming a heavy attack.

#### 🚫 Inverter

Reverses the result of its child node.

* If the child returns Success, the Inverter returns **Failure**.
* If the child returns Failure, the Inverter returns **Success**.
* Use case: "NOT in range." (Checks if in range, then inverts the success).

#### ✅ Force Success / ❌ Force Failure

These decorators ignore the actual result of their child node and override the output.

* **Force Success:** Always returns Success, even if the child failed.
* **Force Failure:** Always returns Failure, even if the child succeeded.
* Use case: Running a non-critical animation sequence that you don't care if it gets interrupted or fails, ensuring the main branch continues.
