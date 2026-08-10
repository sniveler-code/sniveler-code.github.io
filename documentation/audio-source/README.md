# Introduction

Welcome to the documentation for **Audio Dispatcher for DOTS**.

Triggering standard Unity `AudioSource` components from pure ECS is notoriously difficult because managed objects cannot be accessed inside Burst-compiled jobs.

**Audio Dispatcher** solves this problem elegantly. It is a production-ready, Data-Oriented audio bridging system that allows your high-frequency ECS systems to trigger, move, and stop sounds without ever touching the Managed Heap or stalling the Main Thread.

#### Key Features

* ⚡ **100% Burst Compatible:** Trigger sounds directly from `IJobEntity` or `ISystem`.
* 🚀 **Zero Main Thread Stalls:** Uses a Double Buffering Command Architecture.
* 🗑️ **Zero GC Allocations:** Pre-allocated object pools for One-Shot and Looping sounds.
* 🧠 **Smart Voice Stealing:** Automatically replaces the quietest/furthest sound when pools are full.
* 🔗 **Shadow Tracking:** Looping sounds follow entities without modifying your core archetypes.
* 💎 **Fluent API:** Clean, readable, and chainable syntax for triggering sounds.
* 🛠️ **Stable Hash IDs:** Auto-generates C# constants using stable hashes. Reordering your audio database will never break your code.

Let's get started!
