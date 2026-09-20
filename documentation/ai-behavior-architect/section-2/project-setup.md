# ⚙️ Project Setup

Because **AI Behavior Architect** writes C# code for you, the first thing to configure is *where* that generated code goes — and understanding what the generator produces.

## 1. Configuring the Generator

1. Open **Edit → Project Settings**.
2. Select the **AI Behavior Architect** tab in the left-hand menu (the settings provider registers it under `Project/AI Behavior Architect`).
3. **Generated Directory** — the folder where generated sources and the generated `.asmdef` are written. Default: `Assets/SnivelerCode/AiBehavior/Generated`. Use the **Browse** button to pick any folder under `Assets/`.
4. **Auto Compile On Save** — when enabled (default), the generator re-runs automatically at key moments:
   * when the Behavior Editor window is **closed**,
   * when you **switch the active tree** in the toolbar,
   * when you **enter Play Mode** (the graph is saved and recompiled first, so the bake always sees the latest data).

   When disabled, code generation only happens when you explicitly click **Compile** in the editor.

> ⚠️ **Important:** never hand-edit files inside the Generated Directory. They are overwritten the next time the content hash changes. Treat the folder like `bin/`.

## 2. What "Compile" Actually Writes

The **Compile** button (bottom of the left panel) does two things:

1. **Persists the current graph asset** to disk first — the generated code and the next DOTS bake both read from the saved asset, so the on-disk data is always in sync.
2. **Scans every `GraphAsset` in the project** (not just the open one), collects all unique node configurations and writes:

### `SystemsNote.g.cs`

A registry class consumed by the Roslyn source generator:

```csharp
[assembly: AlwaysLinkAssembly]

namespace SnivelerCode.AiBehavior.Generated
{
    [BaSystemNodes]
    public class SystemNodes
    {
        public BaSystem[] Nodes = new BaSystem[]
        {
            new BaFind
            {
                CellSize = 10,
                Index = 18101929384756482103,   // FNV-1a of the node configuration
                Components = new[] { "MyGame.PlayerTag" }
            },
            new BaCondition
            {
                Index = 2710883825131385922,
                Components = new[] { "MyGame.HealthComponent" }
            },
            new BaTransaction
            {
                Index = 10645025438390241920,
                Components = new[] { "Unity.Transforms.LocalTransform" }
            },
            new BaCustom
            {
                Index = 15436213217446092321,
                Components = new[] { "MyGame.AI.MoveAction" }
            }
        };
    }
}
```

* `Index` is the **FNV-1a 64-bit hash** of the node configuration (see [Core Concepts](#core-concepts-architecture) for the exact strings hashed).
* `Components` carries the **fully-qualified type names** the node operates on.

### `SnivelerCode.AiBehavior.Generated.asmdef`

An assembly definition that references:

* the base set: `Unity.Burst`, `Unity.Entities`, `Unity.Mathematics`, `Unity.Collections`, `Unity.Transforms`, `SnivelerCode.AiBehavior.Runtime`,
* **plus every non-system assembly that contains a type referenced by your trees** — your custom action structs (`[BtCustom]`) and your `[BtCondition]` components. These references are discovered by reflecting the assemblies in the editor.

> 💡 **Why this matters:** if your custom actions live in a custom assembly (e.g. `MyGame.AI`), that assembly is added to the generated asmdef automatically. If you later move an action into another assembly and don't re-Compile, the generated assembly won't see it and the Roslyn generator won't emit its system — nodes using it will fail at bake time. **Re-Compile whenever code assembly boundaries change.**

## 3. Incremental Generation

The writer hashes the generated `SystemsNote.g.cs` content and **skips the write entirely when nothing changed** — so pressing Compile on an unchanged project is a no-op, and Unity won't recompile. This keeps the workflow fast: edits to a graph that don't change node *configurations* (e.g. moving nodes around, changing a Wait duration) do not trigger a recompile at all; they only take effect after the next **bake** (next Play Mode entry), because the runtime data lives in the blob, not in code.

| Change you make | Code regenerated? | Re-bake needed? |
|---|---|---|
| Move/drag nodes, change graph view transform | No | Yes (Play Mode) |
| Change a node's parameter (Wait time, Find distance, blackboard value) | No | Yes (Play Mode) |
| Add/remove a component in Find/Condition/Change-Entity | **Yes** (new hash → new system) | Yes |
| Change a Find node's **Spatial Cell Size** | **Yes** (cell size is part of the hash) | Yes |
| Change a Find node's **Max Distance** or **Find Mode** | No (runtime data from blob) | Yes |
| Add a new `[BtCustom]` action type to your code | Not by the editor — the Roslyn generator picks it up on the next compile of your assembly | Yes |
| Change a `[BtCustom]` Process signature | Roslyn generator on next compile | Yes |
| Add a new `GraphAsset` that reuses existing configs | No | Yes |

## 4. The `BtSettings` Asset

The settings UI persists to a `BtSettings` ScriptableObject. On first use the provider auto-creates it at **`Assets/Settings/BtSettings.asset`**. It only stores the two generator options above — runtime behavior settings (iteration limits, warnings) are separate and live on your scene, see [Runtime Internals](#runtime-internals).
