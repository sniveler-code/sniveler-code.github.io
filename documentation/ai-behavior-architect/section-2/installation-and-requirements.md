# 📥 Installation & Requirements

Before importing AI Behavior Architect, make sure your Unity project meets the requirements below. The package manifest declares the following (values from `package.json` of the current release):

## 📋 System Requirements

| Requirement | Minimum Version | Notes |
|---|---|---|
| **Unity** | 2022.3 (`2022.3.0f1`) | Any later 2022.3 LTS patch or 6000 series release works |
| **Entities** (`com.unity.entities`) | 1.4.5 | Core ECS/DOTS package |
| **Entities Graphics** (`com.unity.entities.graphics`) | 1.4.18 | Required by the package manifest; only needed if you render DOTS entities |
| **Burst Compiler** (`com.unity.burst`) | 1.8.27 | Compiles the runner and all generated systems |
| **Mathematics** (`com.unity.mathematics`) | 1.3.2 | `float3`, `quaternion`, `Random`, … |
| **Collections** (`com.unity.collections`) | 2.6.5 | `NativeQueue`, `NativeParallelMultiHashMap`, … |
| **URP / HDRP** (optional) | 14.0.9 | **Only** required by the *Demo Workers* sample |

> 💡 **Render Pipeline Compatibility**
> The core AI framework is 100% render-pipeline agnostic. It relies purely on ECS and the Job System, so it works identically under the **Built-in Render Pipeline**, **URP** and **HDRP** — whether or not your agents are rendered through Entities.Graphics at all (you can drive classic `MonoBehaviour`-adjacent systems from the same trees).

## 📦 Installation

AI Behavior Architect is a **private package** — it is **not** published to any public registry (there is no OpenUPM / scoped registry entry and no public git URL). You install it one of two ways:

### Option A — Package Manager: local package (shows up in *My Assets*)

1. Place the `sniveler-code.dev.ai-behavior-architect` package **folder** (the one containing the package's `package.json`) somewhere on disk — outside your project is the common layout, inside works too.
2. In Unity: **Window → Package Manager** (with the **Project** package view selected) → click the **`+`** button → **Add package from disk…**
3. Select the package folder.
4. The package now appears under **Packages → My Assets** (and in the *Project Packages* list); Unity resolves **Entities, Entities.Graphics, Burst, Mathematics and Collections** automatically from the manifest.

> 💡 A disk-referenced package is a **live folder**: to upgrade, replace the folder's contents with the new package version (keeping the folder path) and press **Refresh** in the Package Manager — nothing to re-import.

### Option B — Import a `.unitypackage`

1. Obtain the current **`AI Behavior Architect.unitypackage`** from the publisher.
2. In Unity: **Assets → Import Package → Custom Package…** and select the file.
3. Unity imports the package into your project and resolves the DOTS dependencies for you.

**Samples (both options):**

* **Option A:** open **Package Manager → Packages → My Assets → AI Behavior Architect → Samples → Demo Workers → Import** to get the stress-test scene.
* **Option B:** `.unitypackage` files don't carry the `Samples~` folder — copy the sample's `Scripts`, `Prefabs` and `Scene` folders into your project manually (the `GpuAnimation` scripts inside are demo-only support code and can be skipped if you don't need the animated characters).

## ✅ Post-Installation Checklist

1. **Wait for the first compile.** The package ships with editor + runtime assemblies and the Roslyn source generator; Unity performs one full compile on first open.
2. **Open Project Settings** (`Edit → Project Settings → AI Behavior Architect`) and verify the **Generated Directory** — see [Project Setup](#project-setup).
3. **(Optional) Demo Workers:** the sample requires URP. After importing it, run **AI Behavior Architect → Demo Workers → Setup URP Pipeline** (see [Demo Workers Sample](#demo-workers-sample)).
4. **Smoke test:** follow the [Quick Start](#quick-start) to create a graph, compile it and watch it light up in Play Mode.

> ⚠️ **Generated code and asmdef are created on the first Compile**, not at import time. The generated assembly (`SnivelerCode.AiBehavior.Generated`) must be able to reference the assemblies that contain your custom actions and your `[BtCondition]` components — if you move code between assemblies, press **Compile** once more so the generated `.asmdef` picks up the new references.
