# Audio Database & IDs

The `AudioDatabase` ScriptableObject is the heart of your audio configuration.

#### Pool Settings

* **Pool Size:** The maximum number of One-Shot sounds (explosions, gunshots) that can play simultaneously.
* **Loop Pool Size:** The maximum number of Looping sounds (engines, auras) that can play simultaneously.

> 💡 **Tip:** All `AudioSource` GameObjects are instantiated and pooled at startup. There are zero `Instantiate` or `Destroy` calls during gameplay.

#### Sound Definitions

For each sound, you can configure:

* **Mixer Group:** Route audio to UI, SFX, or Music buses.
* **Spatial Blend:** Set to `0` for 2D sounds (UI) or `1` for 3D spatialized sounds.
* **Min/Max Distance & Rolloff:** Standard Unity 3D audio settings.

#### Stable Hash IDs

Instead of using strings (which allocate memory) or Enums (which break if you reorder them), Audio Dispatcher uses **Stable Hash IDs**.

When you click **"Generate C# Constants"**, the system hashes the name of your AudioClip (e.g., `math.hash("Explosion")`) and generates a static class:

```csharp
public static class AudioIDs
{
    public const int EXPLOSION = -211360833;
    public const int SHOT = 188032901;
}
```
