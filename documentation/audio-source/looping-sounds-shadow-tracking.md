# Looping Sounds (Shadow Tracking)

Playing a looping sound (like a car engine) in ECS is tricky because the sound needs to follow the moving entity, and it needs to stop when the entity is destroyed.

Audio Dispatcher handles this automatically using a technique called **Shadow Tracking**.

#### How to start a Loop

Instead of passing a `float3 Position`, you pass the `Entity` itself using the `.Loop()` method:

```csharp
AudioIDs.ENGINE_LOOP.Loop(entity)
    .Volume(0.5f)
    .Apply(AudioWriter);
```

#### What happens next?

1. **No Archetype Changes:** The system does **not** add any components to your vehicle entity. Your gameplay data remains tightly packed in memory.
2. **Shadow Entity:** The Audio Dispatcher creates a hidden "Shadow Entity" that tracks your vehicle using a fast `ComponentLookup<LocalTransform>`.
3. **Automatic Movement:** The `AudioSource` will automatically update its position every frame to match your vehicle.
4. **Automatic Cleanup:** If your vehicle entity is destroyed (e.g., `ecb.DestroyEntity(entity)`), the Shadow Tracker detects it, stops the `AudioSource`, returns it to the pool, and destroys itself. You don't need to write any cleanup code!
