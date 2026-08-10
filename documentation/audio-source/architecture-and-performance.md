# Architecture & Performance

Audio Dispatcher was built with strict Data-Oriented Design (DOD) principles to ensure it scales to AAA workloads.

#### 1. Double Buffering (No Main Thread Stalls)

In a naive implementation, the Main Thread must wait for ECS Jobs to finish before it can read the audio queue (`Dependency.Complete()`). This causes massive frame drops.

Audio Dispatcher uses **Double Buffering**:

* **Frame 1:** Your Jobs write to `Queue A`. The Main Thread reads from `Queue B` (which is empty).
* **Frame 2:** Your Jobs write to `Queue B`. The Main Thread reads from `Queue A`. Because the Main Thread is always reading the queue from the _previous_ frame, it never has to wait for worker threads. The 1-frame audio delay (\~16ms) is imperceptible to players.

#### 2. 32-Byte Cache Alignment

The `AudioEvent` struct uses `[StructLayout(LayoutKind.Explicit)]` to overlap the `Entity` (used for loops) and `float3 Position` (used for one-shots) in memory.

This compresses the struct to exactly **32 bytes**. This is a magic number in CPU architecture: exactly two events fit perfectly into a standard 64-byte L1 CPU cache line, resulting in lightning-fast queue processing.

#### 3. Priority-Based Voice Stealing

What happens if you have a pool of 32 sounds, but 40 explosions happen at once? Instead of a naive Round-Robin approach, the Burst-compiled `AudioBrainJob` evaluates the priority (Volume) of all currently playing sounds. It will automatically find the quietest sound and overwrite it with the new explosion.

#### 4. TimeScale Independent

The system calculates sound lifetimes using `AudioSettings.dspTime` instead of `Time.time`. If you use slow-motion effects (`Time.timeScale = 0.1f`), your sounds will not be cut off prematurely.
