# 🧠 The Blackboard System

In Behavior Trees, nodes need a way to share data with one another. For instance, a "Find" node might locate an enemy, and a "Move" node needs to know where that enemy is.

`AI Behavior Architect` handles this using a `Blackboard`—a shared memory space accessible by all nodes within a tree.

> ⚡ **DOTS Performance Note**\
> In object-oriented systems, Blackboards are usually dictionaries containing objects, which causes massive Garbage Collection. AI Behavior Architect stores Blackboard variables internally inside a 16-byte unmanaged wrapper (`BtBlackboardEntry`) attached directly to your Entity's chunk as a `DynamicBuffer`. This guarantees rapid, cache-friendly memory access during Burst jobs with zero allocations.

#### ➕ Creating Variables

1. Open the Behavior Editor and select your `Graph Asset`.
2. In the left-hand Settings Panel, click the **Variables** tab.
3. Click the **Add Variable** button.
4. Configure your variable:
   * **Name:** Give it a readable name (e.g., `TargetPosition` or `Health`).
   * **Type:** Select between `Float`, `Int`, or `Bool`. (Note: For advanced DOTS data like Entity or `float3`, you will pass these via `Data Ports`, which we cover below).
   * **Value:** Set the default starting value.

#### 🔌 Connecting Variables via Data Ports

Some nodes (like **Find** or **Create Entity**) explicitly require complex data types like an Entity ID or a `float3` position.\
These nodes feature **Horizontal Data Ports** (on the left for Inputs, and on the right for Outputs).

1. Left-click and drag from a `Data Port` to another compatible `Data Port` to create a link.
2. The framework will automatically assign a hidden `Blackboard hash` to transfer this unmanaged data from the outputting node directly into the receiving node during runtime.
