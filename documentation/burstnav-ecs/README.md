# 👋 Introduction & Overview

**BurstNav ECS** is a hierarchical pathfinding (HPA\*) + ORCA steering system for Unity DOTS/ECS. Navmeshes are baked once into an immutable blob graph with a spatial-grid index and an optional cluster graph; at runtime a Burst-compiled flat/HPA\* A\* search (zero steady-state allocation) produces polygon corridors, a funnel simplifies them into waypoints, and a spatial-hash + ORCA pipeline keeps hundreds of agents apart. Dynamic obstacles block links at runtime — **no re-bake**.

Whether you are building an RTS, a factory-automation game, or a swarm-survival project, BurstNav gives you scalable crowd navigation where `NavMeshAgent` hits its per-MonoBehaviour limits.

***

#### ✨ Core Features

* 🗺️ **HPA\* Hierarchical Pathfinding**\
  Short hops run flat A\* over a grid-broadphased polygon graph; long paths (distance > threshold) run HPA\* over the cluster graph with a refinement pass. The threshold is per-mesh.
* 🚶 **ORCA Crowd Steering**\
  2-D disk avoidance with spatial-hash neighbor discovery (`MaxNeighbors = 48`) and a corridor containment clamp that keeps agents on the mesh and out of walls.
* 📦 **Baked Immutable Blob Graphs**\
  One `BlobAssetReference<BnBlobMeshGraph>`: deduplicated portals, uniform XZ spatial grid, optional HPA\* cluster layers. No per-frame allocation in the path hot path.
* 🚧 **Dynamic Obstacles Without Re-Bake**\
  Per-link blocking (`SetLinkBlocked` for debris) and door/water-style tag masks (`BnDoorComponent` + `PolygonTagMasks`). Affected agents re-path within 1–2 frames.
* 🎲 **Deterministic Bakes & Searches**\
  Same input → same blob → same paths. Re-baking is reproducible, and the shipped harness checks rely on it.
* 🧪 **EditMode Tests + Headless Harnesses**\
  An NUnit EditMode suite plus deterministic `BurstNav/…` editor checks runnable in `-batchmode`.

***

#### ⚙️ Technical Requirements

| Requirement | Supported Version | Notes |
|---|---|---|
| **Unity Engine** | **Unity 6 (6000.x) only** | Minimum `6000.0`. Earlier versions are not supported. |
| **Unity Entities** | `6.5.0`+ | Pulled in automatically as a dependency. |
| **Unity Collections** | `6.5.0`+ | Pulled in automatically. |
| **Burst Compiler** | `1.8.29`+ | Pulled in automatically. |
| **Unity Mathematics** | `1.4.0`+ | Pulled in automatically. |
| **AI Module** | `1.0.0` (built-in) | Built-in `NavMesh` triangulation at bake time. |

> 💡 **Note:** the asset relies strictly on the ECS paradigm — everything runs as `ISystem`s with `[BurstCompile]` jobs. There is no per-agent MonoBehaviour cost at runtime.

***

#### ⚠️ Scope & Known Limitations

> 🛑 **2.5-D Navigation (XZ only)**
>
> * Pathfinding and steering operate on **XZ only**: no stair/ramp following, agent Y is never modified by the pipeline (gameplay code handles vertical movement).
> * Multi-floor navmeshes flatten into one layer; a "vertical" path is a straight XZ shortcut.
> * Pathfinding throughput is capped at ≈ **256 new requests/frame** (excess is deferred, not dropped).
> * ORCA is 2-D disk avoidance with a fixed neighbor cap (48); agents with radius > 1 m are warned about, not clamped.
> * Spawn/destination more than one grid cell (2 m) from the mesh → first request fails (`BnPathState.Failed`) rather than snapping.

Full details: [Troubleshooting & FAQ](9.-troubleshooting-and-faq.md).
