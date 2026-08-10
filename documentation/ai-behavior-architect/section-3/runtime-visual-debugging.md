# 🐞 Runtime Visual Debugging

Debugging DOTS applications can be notoriously difficult since the logic happens inside multithreaded Burst jobs. AI Behavior Architect completely solves this by providing real-time, visual debugging directly on the graph.

#### 🔍 How to Monitor an Agent

1. Enter **Play Mode** in the Unity Editor.
2. Open the **Entity Hierarchy** window (provided by Unity's Entities package).
3. Select any Entity that possesses a `BtAgent` component.
4. If your `Behavior Editor` window is open, it will immediately snap to the `Graph Asset` currently running on that Entity.

#### 🚦 Visual Feedback

As the C# Job evaluates the behavior tree, the Editor listens to the state buffer and updates the nodes on your canvas in real-time. Look at the colored borders of the nodes:

* 🟡 **Yellow Border:** The node is currently **Running**.
* 🟢 **Green Border:** The node returned **Success** this frame.
* 🔴 **Red Border:** The node returned **Failure** this frame.

> 🔒 **Read-Only Mode**\
> When you enter Play Mode, the entire graph canvas and toolbar become locked (Read-Only). This prevents you from accidentally making structural changes to the graph while the backend DOTS systems are actively iterating over the unmanaged Blob Assets.

#### ⚡ Zero Overhead in Production

You might be wondering: "Does visual debugging slow down my DOTS jobs?"\
The answer is **No**.\
The debug state buffers (`BtDebugState`) are wrapped in strict `#if UNITY_EDITOR` preprocessor directives. When you build your game, the debugging memory footprint and logging logic are completely stripped from the compilation. Your production builds run with absolute maximum performance.

***

<br>
