# 👋 BurstNav Free — ECS Pathfinding for Unity DOTS

**BurstNav Free** is a zero-allocation navigation package for Unity DOTS: a baked polygon graph feeds a flat A* search, the search fills a per-agent waypoint buffer, and a kinematic funnel turns that corridor into a smooth desired velocity. Every stage is a Burst-compiled job reading chunk arrays — no `NavMeshAgent`, no MonoBehaviours, no per-frame allocations.

> 💡 **Why not `NavMeshAgent`?**
> `NavMeshAgent` is an object-oriented wrapper around a managed navigation world. One agent per MonoBehaviour means one transform sync, one callback and one managed object per unit. BurstNav keeps the whole agent state in six ECS components and resolves paths and velocity inside Burst jobs, so hundreds of agents cost chunk iteration instead of main-thread calls.

***

#### ✨ Core Features

* 🧊 **Static polygon graph in a blob asset** — one immutable `BlobAssetReference<BnMeshGraphBlob>` shared by every job. No graph copies, no per-agent topology.
* 🧠 **Branch-free flat A\*** — `BnAStar.FindPath` expands polygons from a single reusable `BnPathScratchpad`. Steady-state allocation is exactly zero.
* 🎯 **Kinematic funnel steering** — portal-based string pulling (`BnFunnel`) removes the stair-step corridor and returns corner-cutting velocity in one pass.
* 🧩 **Six-component agent archetype** — `BnAgentSteering`, `BnAgentPath`, `BnPathWaypoint`, `BnAgentPathRequest` plus two enableable toggles. One dominant archetype means dense chunks.
* ⚡ **Deferred, allocation-free command buffers** — request and steering toggles flip enable bits through `EndSimulationEntityCommandBufferSystem`; nothing completes a job on the main thread.
* 🧪 **EditMode and PlayMode tests** — the package ships a NUnit suite under `Tests` plus two runnable samples.

***

#### 🧭 How the pipeline fits together

```text
BnBlobMeshGraph (singleton)
  -> BnMeshGraphBlob (blob asset)
  -> BnAStar.FindPath + BnPathScratchpad
  -> BnAgentPath + BnPathWaypoint buffer
  -> BnFunnel.Solve
  -> BnAgentSteering.DesiredVelocity
  -> KinematicBypassJob
  -> BnAgentSteering.Velocity
  -> IntegrateJob
  -> BnAgentSteering.Position
```

Read [How It Works](3.-how-it-works.md) for the data passing through each arrow, or jump to [Quick Start](2.-quick-start.md) to get one agent moving.

***

#### 📦 Package Facts

| Property | Value |
|---|---|
| Package name | `sniveler-code.dev.burstnav-ecs` |
| Display name | BurstNav Free |
| Version | 1.1.0 |
| Minimum Unity | 2022.3 |
| Runtime assembly | `SnivelerCode.BurstNav.Runtime` (root namespace `BurstNav`) |
| Dependencies | `com.unity.entities` 1.2.4, `com.unity.burst` 1.8.12, `com.unity.collections` 2.4.0, `com.unity.mathematics` 1.3.1 |
| Verified host | Unity 6000.5.2f1 with `com.unity.entities` 6.5.0 |
| License | MIT |
| Editor tooling | None — no windows, no define symbols, no project settings |

***

#### 🚀 What ships in the box

| Layer | Implementation | Main types |
|---|---|---|
| Navigation graph | Static polygon graph in a blob asset | `BnMeshGraphBlob`, `BnPolygon`, `BnLinkData` |
| Graph owner | Singleton component pointing at the blob | `BnBlobMeshGraph` |
| Search | Flat A* with a fixed iteration budget | `BnAStar`, `BnPathScratchpad`, `BnLinkFilter` |
| Path storage | Per-agent path slot and waypoint buffer | `BnAgentPath`, `BnPathWaypoint` |
| Steering | Kinematic funnel over portal edges | `BnFunnel` |
| Velocity | Kinematic bypass: desired velocity becomes velocity | `KinematicBypassJob` |
| Integration | Position advanced by velocity and delta time | `IntegrateJob` |
| Environment | Static navmesh only | `BnMeshAuthoring` |
| Agent authoring | One dominant agent archetype | `BnAgentAuthoring`, `BnAgentSteering` |

Two samples are included: **Hello Navmesh** (one agent patrolling a 4 × 4 grid) and **Funnel Steering** (four agents crossing a 6 × 6 grid on diagonals). Both are imported from the Package Manager **Samples** tab.

***

#### ⚠️ What Free deliberately does not do

Free is a single-agent-quality steering pipeline. It has **no local avoidance**, **no dynamic obstacles** and **no door/area tags** — those stages do not exist in the runtime, so there is nothing to tune or toggle. If a level needs crowds that separate, obstacles that move, or doors that close, read [Limitations & Scope](5.-limitations-and-scope.md) before you commit to the package.

***

#### 📚 How this documentation is organised

* **Getting Started** — install the package, bake a graph, spawn an agent and issue the first request.
* **Core** — the frame-by-frame pipeline and the full runtime API for requests, search and steering.
* **Reference** — every component, job and system, the blob memory layout, and the tuning knobs that actually exist.
* **Handbook** — the exact scope of Free and a symptom-to-cause troubleshooting table.

Every type lives in the `BurstNav` namespace; every code snippet on these pages compiles against `SnivelerCode.BurstNav.Runtime`.
