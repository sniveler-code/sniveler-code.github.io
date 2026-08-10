# 🗂 Working with Sub-Trees

As your AI logic grows, your graphs can become massive. **Sub-Trees** allow you to encapsulate logic into smaller, reusable Graph Assets. For example, you can build an Attack Sub-Tree and reuse it across multiple different enemy types.

#### 🏗 How to Setup a Sub-Tree

1. Create a new `GraphAsset` in your project folder (e.g., `Sub_MeleeAttack`).
2. Open your main behavior tree in the Behavior Editor.
3. Add a **Composites > Sub-Tree** node.
4. Select the `Sub-Tree` node. In the left-hand **Node Tab**, assign your `Sub_MeleeAttack` asset to the field.

#### 🧭 Navigating Sub-Trees

* **Diving In:** Simply **double-click** the Sub-Tree node on the canvas, or click the "Open Sub-Tree" button in the Node Tab. The editor will instantly load the nested graph.
* **Going Back:** Look at the top toolbar. You will see a breadcrumb trail showing your current depth. Click the name of the parent tree to return.

> ⚠️ **Circular Dependency Protection**\
> The compiler strictly prevents infinite loops. You cannot assign a Graph Asset to itself, nor can you place a Sub-Tree inside a graph that eventually calls the parent graph. The compiler will catch this and throw a helpful error in the console.
