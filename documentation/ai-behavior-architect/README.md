# 👋Welcome to AI Behavior Architect

**AI Behavior Architect** is a visual scripting tool and runtime framework designed from the ground up for Unity's **Data-Oriented Technology Stack (DOTS)** and the **Entity Component System (ECS)**.

> 💡 **The DOTS Challenge**\
> While there are many Behavior Tree solutions available for Unity, most are built around object-oriented `MonoBehaviour` workflows. Attempting to force those object-oriented trees into an ECS environment often results in heavy memory allocations (Garbage Collection), thread-safety issues, and lost performance.

AI Behavior Architect solves this by bridging the gap between designer-friendly visual scripting and hardcore developer performance.

#### 🎯 Who is this for?

* 🎨 **For Designers:** A clean, intuitive node-based editor right inside Unity. Design AI logic, manage sub-trees, configure blackboards, and watch visual debugging in real-time—all without touching code.
* 💻 **For Programmers:** A robust backend that takes that visual graph and uses a custom code-generator to automatically write highly optimized, Burst-compiled `ISystem` and `IJobChunk` C# scripts.

You get the rapid iteration of visual scripting with the extreme runtime performance of pure DOTS code.

#### ✨ Core Features at a Glance

* **100% DOTS Native:** Executes entirely inside Burst-compiled jobs.
* **Zero-GC Allocations:** No runtime garbage collection. Memory is handled strictly via unmanaged buffers and Blob Assets.
* **Auto-Code Generation:** Click "Compile" and watch the framework generate optimized backend systems for you automatically.
* **Advanced Spatial Queries:** Built-in spatial hashing nodes to easily find entities (nearest, random, etc.) without writing complex math.
* **Parallel Execution:** Native support for evaluating multiple nodes simultaneously.
