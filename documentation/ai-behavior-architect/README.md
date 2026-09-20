# 👋 Welcome to AI Behavior Architect

**AI Behavior Architect** is a visual scripting tool and runtime framework designed from the ground up for Unity's **Data-Oriented Technology Stack (DOTS)** and the **Entity Component System (ECS)**.

> 💡 **The DOTS Challenge**
> While there are many Behavior Tree solutions available for Unity, most are built around object-oriented `MonoBehaviour` workflows. Attempting to force those object-oriented trees into an ECS environment often results in heavy memory allocations (Garbage Collection), thread-safety issues, and lost performance.

AI Behavior Architect solves this by bridging the gap between designer-friendly visual scripting and hardcore developer performance: designers author trees visually, and the framework automatically compiles them into Burst-compiled, allocation-free DOTS systems.

#### 🎯 Who is this for?

* 🎨 **For Designers:** A clean, intuitive node-based editor right inside Unity. Design AI logic, manage sub-trees, configure blackboards, and watch visual debugging in real-time—all without touching code.
* 💻 **For Programmers:** A robust backend that takes that visual graph and uses a custom two-stage code generator (an editor-side file writer plus a Roslyn incremental source generator) to automatically write highly optimized, Burst-compiled `ISystem` and `IJobChunk` C# scripts. You get the rapid iteration of visual scripting with the extreme runtime performance of pure DOTS code.

#### ✨ Core Features at a Glance

* **100% DOTS Native:** The entire tree evaluator and every generated action executes inside Burst-compiled jobs.
* **Zero-GC Allocations:** No runtime garbage collection. All per-agent state lives in unmanaged `DynamicBuffer<T>` components; the whole compiled tree lives in a single `BlobAsset`.
* **Auto-Code Generation:** Press **Compile** and the framework generates the DOTS backend systems for your trees automatically — including one shared system per unique node configuration.
* **Advanced Spatial Queries:** Built-in spatial-hashing **Find** node locates entities (First / Nearest / Random) without writing math.
* **Parallel Execution:** Per-agent trees evaluate in parallel across all agent entities via `ScheduleParallel`.
* **Visual Runtime Debugging:** Node borders light up live on the graph while Play Mode runs, with zero overhead in builds.
* **Extensible via C#:** Any `partial struct` tagged `[BtCustom]` becomes a node — ports, inspector fields, queries and jobs are generated from the method signature.

#### 📦 Package Facts

| Property | Value |
|---|---|
| Package name | `sniveler-code.dev.ai-behavior-architect` |
| Display name | AI Behavior Architect |
| Current version | 1.1.x |
| Minimum Unity | 2022.3 (0f1) |
| Required dependencies | `com.unity.entities` 1.4.5, `com.unity.entities.graphics` 1.4.18, `com.unity.burst` 1.8.27, `com.unity.mathematics` 1.3.2, `com.unity.collections` 2.6.5 |
| Optional dependencies | URP / HDRP 14.0.9 (required by the Demo Workers sample only) |
| Render pipeline | Core framework is 100% pipeline-agnostic (Built-in, URP, HDRP) |

#### 📚 How This Documentation is Organized

* **Section 1–2:** What the package is, how it works under the hood, installation, setup and your first agent.
* **Section 3:** The editor: layout, sub-trees, and live debugging.
* **Section 4:** The blackboard — the two-tier data system that connects nodes.
* **Section 5:** Complete reference of every built-in node with exact runtime semantics.
* **Section 6:** Writing custom nodes: the execution model, the full attribute API, component access and command buffers.
* **Section 7:** Runtime internals: the frame-by-frame pipeline, the blob memory layout, the full ECS component reference, and known pitfalls.
* **Section 8:** The Demo Workers stress-test sample and the test suite.
