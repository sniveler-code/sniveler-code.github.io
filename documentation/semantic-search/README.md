# Introduction

Welcome to the documentation for **AI Semantic Search**.

Finding assets by exact filename falls apart the moment a project outgrows its naming convention. **AI Semantic Search** fixes that: it indexes your prefabs with local semantic embeddings and lets you search by *meaning* — "heavy axe", "small green plant", "loud explosion" — instead of guessing names.

#### Key Features

* 🧠 **100% Local AI:** embeddings are computed in the Editor with Unity Sentis — no API keys, no internet connection.
* ⚡ **Instant Results:** SIMD-accelerated cosine similarity over a local SQLite index, plus a text-match bonus.
* 🎯 **Understands Context:** prefab names, components, folder/category context, materials and mesh geometry.
* 📦 **Small Footprint:** ships a uint8-quantized MiniLM-L6-v2 model (~24 MB) instead of the 90 MB float32 original.
* 🧩 **Extensible:** add new asset kinds or custom metadata extractors via the `Metadata<T>` base class.

Everything runs locally in the Unity Editor (Windows and macOS). Let's get started!
