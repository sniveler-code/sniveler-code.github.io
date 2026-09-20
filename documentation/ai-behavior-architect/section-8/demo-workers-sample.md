# 🎬 Demo: Workers Sample

The package ships a complete **`Samples~/DemoWorkers`** sample — a stress-test scene of GPU-animated workers (chopping/hammering at benches) driven entirely by Behavior Architect. It demonstrates the full pipeline at scale: custom actions with ports and params, buffer components, LOD switching from a tree, and dynamic agent spawning.

## Getting the Sample

1. Unity Package Manager → **Packages → My Assets** → find **Sniveler Code Ai Behavior Architect** (see [Installation](#installation-requirements) if it isn't there yet).
2. Click **Samples → Install "DemoWorkers"** (or open the package → *Samples* tab).
3. Open the sample's **`Workers.unity`** scene (a `Landing.unity` scene exists too).
4. Bake the sub-scene (the standard sub-scene baking workflow) and press Play.

> The sample includes a **GPU animation pipeline** (`GpuAnimation/` scripts) that is *demo support code*, not part of the behavior package — it renders the worker characters. You can delete everything under `GpuAnimation/` and keep the `AiBehavior/` scripts if you only want to study the AI logic.

## Scene & Prefab Layout

| Asset | Role |
|---|---|
| `Scene/Workers.unity` | the main sub-scene: bench/workplace layout |
| `Prefabs/WorkPlace.prefab` | a bench + chest + spawn slot group |
| `Prefabs/HammerWorker.prefab` | a worker character with `BtAgentAuthoring` attached (graph assigned in the inspector) |
| `Scripts/AiBehavior/DemoAuthoring.cs` | adds a `DemoLodsBuffer` (per-worker list of LOD entity ids) to the worker |
| `Scripts/AiBehavior/DemoChestAuthoring.cs` | adds `[BtCondition] DemoChestTag` to the chest — making it a query target for Find/Condition nodes |
| `Scripts/AiBehavior/DemoBenchAuthoring.cs` | workplace tagging/components |
| `Scripts/AiBehavior/DemoSpawnerAuthoring.cs` / `DemoSpawnerSystem.cs` | runtime **batch spawner**: instantiates `√N` work-places + workers per frame (grid layout, 1.25 × 4.0 units spacing) until `Total` is reached, then disables itself — this is how the stress test scales to thousands of agents |
| `Scripts/AiBehavior/DemoToolSystem.cs` / `DemoBenchAuthoring` | bench-side state (tool progress) that the workers' trees read/write |

## The Custom Actions (study these)

### `DemoMoveAction` — the reference action

```csharp
[BtCustom("Demo/Move")]
public partial struct DemoMoveAction
{
    [BtDeltaTime] public float DeltaTime;

    private NodeStatus Process([BtInput] float3 target,
                               [BtParam] float speed,
                               ref LocalTransform transform,
                               DynamicBuffer<AnimatorParameterData> parameters)
    {
        // moves toward `target` at `speed` units/s, triggers a "walk" animation
        // parameter while moving, and returns Running until close enough
    }
}
```

It shows the full toolbox in one node: an **input port** (target from a Find/Blackboard), a **param** (speed, tunable per instance), a **`ref` component** (the agent's own transform), a **buffer** (GPU-animation parameters), and **`[BtDeltaTime]`**.

### `DemoAnimatorAction` — enum params & buffers

```csharp
[BtCustom("Demo/Animator")]
public partial struct DemoAnimatorAction
{
    private NodeStatus Process(DynamicBuffer<AnimatorParameterData> parameters,
                               [BtParam] AnimatorTrigger trigger,   // enum param → dropdown
                               [BtParam] float value)
    { /* sets an animation parameter */ }
}
```

Demonstrates **enum `[BtParam]`** (the inspector renders a dropdown; the blob stores the int) and buffer access.

### `DemoLodsAction` — lookups + buffer params

```csharp
[BtCustom("DemoLods")]
public partial struct DemoLodsAction
{
    [NativeDisableParallelForRestriction]
    public ComponentLookup<LocalTransform> Transforms;

    private NodeStatus Process([BtParam] int lodIndex,
                               [BtParam] float enable,
                               DynamicBuffer<DemoLodsBuffer> lodsBuffer)
    {
        Transforms[lodsBuffer[lodIndex].Value] = LocalTransform.FromScale(enable);
        return NodeStatus.Success;
    }
}
```

The clearest demonstration of **random-access lookup usage**: the agent's own buffer holds the ids of its LOD mesh entities, and a lookup (exempt from the query) rescales the selected LOD's transform. Note the `[BtParam] float enable` — `0` hides a LOD, `1` shows it. (The `[NativeDisableParallelForRestriction]` is needed because the lookup write targets a *different* entity than the job's — standard ECS practice for cross-entity lookups inside IJobChunk.)

## What the Worker Trees Look Like

The included worker graph combines, in a single tree:

* a **Find** (nearest entity with `DemoChestTag` within radius) → the chest drives work selection,
* **Condition** gates on the agent's own state components,
* **`Demo/Move`** to walk to the bench,
* **`Demo/Animator`** to play the work animation,
* **`DemoLods`** to toggle LOD meshes based on tree context,
* a **Repeater/Sequence** loop around the whole work cycle.

Open the graph asset assigned to `HammerWorker.prefab`'s `BtAgentAuthoring` and use the [Visual Debugger](#runtime-visual-debugging) during Play Mode to watch the flow move.

## Running the Stress Test

1. Add a `DemoSpawnerAuthoring` (or use the scene's existing one) with your target **Total** (e.g. 1000).
2. Bake, Play. The spawner adds a grid of workers every frame until the total is met — you can watch agent count, CPU, and the debugger's per-frame cost scale.
3. Use `BtSettingsAuthoring`'s `MaxIterationsPerFrame`/logging to see the iteration guard in action on pathological trees.

> 💡 This sample is intentionally a **stress** scene — hundreds/thousands of agents with non-trivial trees. If you are *learning* the package, start from the [Quick Start](#quick-start) with a single hand-rolled agent, then scale up with this sample's patterns.
