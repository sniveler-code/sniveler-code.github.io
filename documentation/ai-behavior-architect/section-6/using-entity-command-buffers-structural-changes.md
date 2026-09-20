# 🏗 Entity Command Buffers (Structural Changes)

In DOTS you cannot add components, remove components, or destroy entities from inside a parallel job — structural changes must go through an **`EntityCommandBuffer` (ECB)**. AI Behavior Architect wires ECBs into custom actions with two attributes.

## The Two Pieces

1. **`[BtCommandBuffer(typeof(<SystemGroup>))]`** on an `EntityCommandBuffer.ParallelWriter` field — tells the generator to create a command buffer from that system group's singleton each frame and hand you its `ParallelWriter`:

```csharp
[BtCommandBuffer(typeof(EndSimulationEntityCommandBufferSystem))]
public EntityCommandBuffer.ParallelWriter CommandBuffer;
```

The group type you pass decides **when the commands replay**:

| Group | Replays | Use for |
|---|---|---|
| `EndSimulationEntityCommandBufferSystem` | end of the simulation step | the default choice — most structural changes |
| `BeginSimulationEntityCommandBufferSystem` | start of the simulation step | changes that must be visible to this frame's systems |
| `PostPhysicsEntityCommandBufferSystem` | after physics | physics-related structural changes |
| any other `…EntityCommandBufferSystem` | at that group's replay point | specialized pipelines |

2. **`[BtEntityIndex]`** on an `int` parameter — your **deterministic sort key** for the ParallelWriter methods.

## Full Example

```csharp
using SnivelerCode.AiBehavior.Runtime.Attributes;
using SnivelerCode.AiBehavior.Runtime.Components;
using Unity.Entities;

namespace MyGame.AI
{
    [BtCustom("Combat/Destroy Self")]
    public partial struct DestroySelfAction
    {
        [BtCommandBuffer(typeof(EndSimulationEntityCommandBufferSystem))]
        public EntityCommandBuffer.ParallelWriter CommandBuffer;

        private NodeStatus Process([BtEntityIndex] int index, in Entity self)
        {
            CommandBuffer.DestroyEntity(index, self);   // deterministic replay order
            return NodeStatus.Success;
        }
    }
}
```

> ⚠️ **Critical ECB rule:** always pass the `[BtEntityIndex]` value as the **first argument (sort key)** of the ParallelWriter method. The sort key is how Unity guarantees a *deterministic* replay order across threads — omitting it (or using a non-deterministic one) can change simulation order from run to run on multi-core machines.

## Spawning Prefabs from an Action

Combining `[BtPrefab]`, `[BtCommandBuffer]` and `[BtEntityIndex]` gives you full dynamic spawning without any built-in spawn node:

```csharp
[BtCustom("Combat/Spawn Projectile")]
public partial struct SpawnProjectileAction
{
    [BtCommandBuffer(typeof(EndSimulationEntityCommandBufferSystem))]
    public EntityCommandBuffer.ParallelWriter CommandBuffer;

    private NodeStatus Process([BtEntityIndex] int index,
                               [BtPrefab] Entity projectile,
                               [BtInput] float3 position,
                               ref LocalTransform self)
    {
        var spawned = CommandBuffer.Instantiate(index, projectile);
        CommandBuffer.SetComponent(index, spawned,
            LocalTransform.FromPosition(position));
        return NodeStatus.Success;
    }
}
```

Remember the prefab must be assigned in the node inspector (it's registered into the scene's prefab registry at bake time, and resolved through it at runtime).

## What You Can and Can't Do

| Operation | In a custom action? | How |
|---|---|---|
| Modify existing component **data** | ✅ freely | `ref` component params, or lookups |
| **Add / remove / set** components | ✅ | ECB (`AddComponent`, `RemoveComponent`, `SetComponent`) |
| **Instantiate** baked prefabs | ✅ | ECB (`Instantiate`) — prefab via `[BtPrefab]` registry or any baked entity |
| **Destroy** entities | ✅ | ECB (`DestroyEntity`) |
| Create entities from scratch (new archetype) | ✅ | ECB (`CreateEntity`) — though note: a fresh entity starts with no components; add them in the same buffer |
| Structural changes on the *main thread* during play | ❌ | never — always ECB |

> 💡 **Change-Entity vs. custom actions:** the built-in **Action Change Entity** node covers *data modification* (Set/Inc/Dec on component and buffer fields) with zero code. The moment you need *structural* changes (add/remove/destroy/spawn), you're in custom-action territory.
