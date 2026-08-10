# 🔍 Querying and Modifying ECS Components

You do not need to write `SystemAPI.Query` or manual `ComponentLookup` code to access ECS components.

If you pass any standard `IComponentData` into your `Process method`, the code generator automatically adds it to the internal `EntityQuery` and provides it to you.

#### Reading Data (in)

Use the in keyword to read component data without modifying it. This is highly optimized as it creates a read-only access path in the job.

```csharp
private NodeStatus Process(in LocalTransform transform)
{
    float3 currentPos = transform.Position;
    return NodeStatus.Success;
}
```

#### Writing Data (ref)

Use the ref keyword to read and modify component data.

```csharp
private NodeStatus Process(ref LocalTransform transform, [BtParam] float speed)
{
    // Move the entity up along the Y axis
    transform.Position.y += speed * DeltaTime; 
    return NodeStatus.Running;
}
```

_Note: If you are iterating over a buffer (`IBufferElementData`), simply pass `DynamicBuffer<T>` myBuffer without ref or in._

