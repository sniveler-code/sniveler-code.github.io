# 🧠 Core Concepts & Architecture

To get the most out of **AI Behavior Architect**, it is helpful to understand how it operates under the hood. The framework relies on three core DOTS pillars to achieve maximum performance:

#### ⚙️ 1. Automated Code Generation

Behavior Trees are inherently polymorphic (e.g., a generic "Node" can be an Action, a Sequence, or a Condition). Standard ECS does not support polymorphism well, as everything must be strictly typed data.

To bypass this, **AI Behavior Architect** uses a **Code Generator**. When you save your graph, the tool reads your nodes and automatically generates partial struct systems that process your specific logic. You never have to manually register nodes into systems; the architect wires it all up for you.

#### 📦 2. Blob Assets (BlobAssetReference)

When you bake your sub-scene, the framework reads your visual `Graph Asset` and converts the tree's layout into a `BtBlob` (a Blob Asset).

> 🚀 **Why Blob Assets?**\
> Blob Assets guarantee that the entire structure of your behavior tree is stored in a single, contiguous block of unmanaged memory. This makes navigating the tree incredibly cache-friendly and allows it to be safely read inside Burst-compiled multithreaded jobs.

#### 💾 3. Unmanaged State Buffers

Because a Behavior Tree needs to remember what it was doing last frame (e.g., waiting for a timer, or running a custom action), it requires memory. **AI Behavior Architect** allocates unmanaged `DynamicBuffer<T>` components directly onto your Agent Entity during the baking process:

* `BtNodeState`: Stores internal timers and loop counters (e.g., for Wait or Repeater nodes).
* `BtActionState`: Tracks which custom actions are currently running and their results.
* `BtBlackboardEntry`: A 16-byte unmanaged wrapper that stores your Blackboard variables (`floats`, `ints`, `bools`, and `Entity` references) directly on the memory chunk.

Because all state data is strictly unmanaged and tightly packed on the Entity, the runtime evaluator **never triggers the Garbage Collector**.
