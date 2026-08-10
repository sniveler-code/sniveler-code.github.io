---
description: Welcome to the official documentation for Sniveler GPU Animation!
---

# 👋 Introduction & Overview

This asset is a high-performance, strictly DOTS/ECS-driven animation system designed for the Universal Render Pipeline (URP). It bypasses traditional CPU animation bottlenecks by baking skeletal data into highly optimized `BlobAssets` and performing matrix/Dual Quaternion skinning directly inside the Vertex Shader.

Whether you are building a massive RTS, a factory automation game, or a swarm-survival (Vampire Survivors-like) project, this tool allows you to render **10,000+ animated units** on screen with zero CPU overhead.

***

#### ✨ Core Features

* ⚔️ **Zero-Latency Sockets (Attachments)**\
  Unlike traditional GPU skinning solutions where attachments lag by a frame, our system uses synchronous Burst-compiled `BlobAsset` queries. You can attach weapons, armor, or VFX to specific bones, and they will follow the animation with frame-perfect precision.
* 🎨 **Full Shader Graph Support**\
  Don't limit yourself to standard shaders. We provide out-of-the-box Shader Graph templates. Add dissolve effects, outlines, or custom emission logic to your animated crowds in seconds.
* 🦾 **Dual Quaternion Skinning (DQS)**\
  Say goodbye to the "candy-wrapper" effect where joints (like shoulders and knees) lose volume during extreme bending. DQS preserves mesh volume, drastically improving the visual fidelity of low-poly and stylized characters.
* ⚙️ **One-Click Automated Baking**\
  No complex setup. Drag your standard Unity `GameObject` (with a `SkinnedMeshRenderer` and Animator) into our custom Editor Window, click "Bake", and receive a fully configured DOTS Prefab ready to be spawned via ECS.
* 🚀 **Extreme Performance & LODs**\
  Built-in support for Unity's `LODGroup`. The system automatically drops bone influences (4 bones -> 2 bones -> 1 bone) and disables interpolation for distant units and shadow casters to save ALU instructions. Includes distance-based Tick-Rate optimization (animating at 30fps or 15fps for distant crowds).

***

#### 🛠️ Technical Requirements

To use this asset, your project must meet the following minimum requirements:

| Requirement           | Supported Version | Notes                                       |
| --------------------- | ----------------- | ------------------------------------------- |
| **Unity Engine**      | 2022.2 or higher  | Tested up to Unity 6.                       |
| **Render Pipeline**   | URP 14.0+         | HDRP and Built-in RP are **not** supported. |
| **Entities (DOTS)**   | 1.4.5 or higher   | Requires `com.unity.entities`.              |
| **Entities Graphics** | 1.4.18 or higher  | Requires `com.unity.entities.graphics`.     |
| **Burst Compiler**    | 1.8.27 or higher  | Required for high-performance jobs.         |

> 💡 **Note:** The asset relies strictly on the ECS paradigm. It does not use traditional `GameObjects` for runtime rendering. You must be familiar with spawning and managing entities via `EntityCommandBuffer` or Bakers.

***

#### ⚠️ Known Limitations

Because this system is built for maximum performance at massive scales, it relies on pre-computed (baked) data. Please be aware of the following architectural limitations:

> 🛑 **Important Limitations**
>
> * **No Runtime IK:** Inverse Kinematics (like procedural foot placement or aiming) is not supported, as the bone matrices are baked into static arrays.
> * **No Ragdolls:** Physics-driven ragdolls cannot be applied to the GPU-skinned meshes.
> * **Memory Footprint:** Animation data is baked per-frame, per-bone. While highly optimized, baking 50+ long animations for a character with 100+ bones will consume noticeable VRAM/RAM.
