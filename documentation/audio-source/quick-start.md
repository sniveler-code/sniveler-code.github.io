# Quick Start

Get your first sound playing in 4 simple steps.

#### 1. Create an Audio Database

Right-click in your Project view and select `Create > SnivelerCode > Audio Database`. Add an `AudioClip` (e.g., an explosion sound) to the list.

#### 2. Generate IDs

Select your new Audio Database asset. In the Inspector, click the green **"Generate C# Constants"** button. This creates a file containing your Audio IDs.

#### 3. Scene Setup

Create an empty GameObject in your sub-scene. Add the `AudioSettingsAuthoring` component to it and assign your Audio Database asset.

#### 4. Play a Sound from Code

Use the Fluent API inside any Burst-compiled system:

```csharp
using SnivelerCode.AudioDispatcher.Runtime;
using Unity.Burst;
using Unity.Entities;

[BurstCompile]
public partial struct CombatSystem : ISystem
{
    [BurstCompile]
    public void OnUpdate(ref SystemState state)
    {
        // 1. Get the Audio Writer
        var audioSingleton = SystemAPI.GetSingleton<NativeAudioSystem.Singleton>();
        
        state.Dependency = new CombatJob
        {
            AudioWriter = audioSingleton.Writer
        }.ScheduleParallel(state.Dependency);
    }
}

[BurstCompile]
public partial struct CombatJob : IJobEntity
{
    public NativeQueue<AudioEvent>.ParallelWriter AudioWriter;

    private void Execute(in LocalTransform transform)
    {
        // 2. Play the sound!
        AudioIDs.EXPLOSION.Shot(transform.Position).Apply(AudioWriter);
    }
}
```
