---
description: Welcome to Audio Dispatcher FMOD
---

# 🏠 1. Introduction

**Advanced Audio Dispatcher for DOTS** is a high-performance, thread-safe, and zero-GC bridge between Unity's Data-Oriented Technology Stack (DOTS) and the native FMOD Studio C-API.

{% embed url="https://youtu.be/cIGFI-eBLuA" %}

Built specifically for Entities 1.0+ and the Burst Compiler, this asset allows you to dispatch thousands of audio events directly from your `IJobEntity` systems without allocating a single byte of managed memory.

**Key Features:**

* **Zero GC Allocations:** 100% unmanaged data structures.
* **Burst Compatible:** Dispatch audio commands from any background worker thread.
* **Automatic Lifecycle:** Looping sounds automatically track entity positions and clean themselves up when the target entity is destroyed.
* **Asynchronous Occlusion:** Built-in, multi-threaded raycast occlusion that doesn't block the Main Thread.

#### Why this asset?

The official FMOD Unity integration is fantastic for traditional OOP projects, but it relies heavily on `MonoBehaviour`, managed strings, and Main Thread execution. Using it in a DOTS project forces you to break the ECS paradigm, leading to thread locks and garbage collection spikes.

**Audio Dispatcher** solves this by bypassing the official C# wrapper entirely. It communicates directly with the raw FMOD native binaries (`fmodstudioL.dll`), providing a pure ECS architecture designed for AA/AAA performance.
