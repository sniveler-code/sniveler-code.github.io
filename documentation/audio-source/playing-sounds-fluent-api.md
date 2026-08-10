# Playing Sounds (Fluent API)

Audio Dispatcher features a zero-allocation **Fluent Builder API**. It makes writing audio code inside Jobs incredibly clean and readable.

#### The Syntax

Every generated Audio ID gets extension methods. You start by calling `.Shot()` or `.Loop()`, chain your modifiers, and finish with `.Apply(writer)`.

**Basic One-Shot**

```csharp
AudioIDs.SHOT.Shot(transform.Position).Apply(AudioWriter);
```

**Modifying Volume and Pitch**

You can chain modifiers to randomize sounds. This is fully Burst-compatible:

```csharp
AudioIDs.EXPLOSION.Shot(transform.Position)
    .Volume(0.8f)
    .Pitch(random.NextFloat(0.9f, 1.1f))
    .Apply(AudioWriter);
```

#### How it works under the hood

The Fluent API does not allocate any classes. It builds a 32-byte `AudioEvent` struct on the stack and pushes it directly into the lock-free `NativeQueue`.

