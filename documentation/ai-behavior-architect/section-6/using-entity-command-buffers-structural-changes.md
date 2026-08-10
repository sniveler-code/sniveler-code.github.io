# 🏗 Using Entity Command Buffers (Structural Changes)

In DOTS, you cannot add components, remove components, or destroy entities on the main thread while jobs are iterating over chunks. You must use an `EntityCommandBuffer` (ECB).

To use an ECB in your custom action, declare a struct field with the `[BtCommandBuffer]` attribute and specify which `System Group` should execute the buffer (usually `EndSimulationEntityCommandBufferSystem`).

```csharp
using SnivelerCode.AiBehavior.Runtime.Attributes;
using SnivelerCode.AiBehavior.Runtime.Components;
using Unity.Entities;

namespace MyGame.AI
{
    [BtCustom("Combat/Destroy Self")]
    public partial struct DestroySelfAction
    {
        // 1. Declare the ECB Parallel Writer
        [BtCommandBuffer(typeof(EndSimulationEntityCommandBufferSystem))]
        public EntityCommandBuffer.ParallelWriter CommandBuffer;

        private NodeStatus Process([BtEntityIndex] int queryIndex, in Entity selfEntity)
        {
            // 3. Queue the destruction safely
            CommandBuffer.DestroyEntity(queryIndex, selfEntity);
            
            return NodeStatus.Success;
        }
    }
}
```

> ⚠️ **Critical ECB Rule:** Always use a deterministic sort key  `[BtEntityIndex]` as the first argument in CommandBuffer methods when writing multithreaded DOTS code
