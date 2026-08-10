# 🎛 Blackboard Nodes

While custom C# actions can read and write to the Blackboard programmatically, you can also manipulate Blackboard variables directly using visual nodes.

#### ⚖️ Blackboard Condition Node

This node acts as a gatekeeper. It checks the value of a Blackboard variable and returns **Success** if the condition is met, or **Failure** if it is not.

**How to use:**

1. Add a **Blackboard Condition** node via the Search Window (`Blackboard/Blackboard Condition`).
2. Select the node.
3. In the Node Tab (left panel), configure the check:
   * **Variable:** Select the variable from your `Blackboard list`.
   * **Operator:** Choose how to compare it (`Equal`, `NotEqual`, `Greater`, `Less`).
   * **Value:** The static value to compare against.

Example: Check if Health is Less than 20. If true (Success), the tree can move on to a "Flee" action.

#### ✏️ Blackboard Modify Node

This node allows you to mathematically alter the value of a Blackboard variable during the execution of the tree. It always returns **Success** upon completion.

**How to use:**

1. Add a **Blackboard Modify** node (Blackboard/Blackboard Modify).
2. Select the node.
3. In the Node Tab, configure the modification:
   * **Variable:** Select the variable you want to change.
   * **Operator:** Choose the math operation (`Set`, `Inc` \[Increase/Add], `Dec` \[Decrease/Subtract]).
   * **Value:** The static value to apply.

Example: When a "Take Damage" action completes, use this node to Dec (decrease) the Health variable by 10.
