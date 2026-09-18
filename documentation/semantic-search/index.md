# AI Semantic Search — Documentation

Welcome to **AI Semantic Search**, a local, AI-powered asset finder for the Unity Editor.
It indexes prefabs with semantic embeddings (Unity Sentis) and lets you
search them by *meaning* — "heavy axe", "small green plant" — instead
of exact filenames.

## What's inside the package

| Item | Purpose |
|---|---|
| Editor tool | `Window > SnivelerCode > Semantic Search` (window title *Asset AI Search*) |
| Search engine | SIMD-accelerated cosine similarity over the local SQLite index |
| Prefab analysis | names, components, folder/category context, materials, geometry |
| Samples | `Base AI Model & Demo Assets` — MiniLM ONNX model, BERT tokenizer config, medieval demo prefabs |

Everything runs locally — no API keys, no internet connection required.

## Getting started in 60 seconds

1. Install the package (**Assets → Import Package → Custom Package…** with the `.unitypackage`
   from the store listing).
2. Import the sample: **Package Manager → AI Semantic Search → Samples → Import**.
3. Open the tool: **Window > SnivelerCode > Semantic Search**.
4. In the **Embedding** tab assign:
   - **Model** ← `MiniLM_uint8.sentis`
   - **Vocab** ← `tokenizer.json`
5. In the **Prefabs** tab: **Check** → **Index**.
6. Go to **Search** and describe what you need.

See [Getting Started](getting-started.md) for the full walkthrough.

## Documentation contents

- [Getting Started](getting-started.md) — installation, setup, first search
- [Configuration](configure.md) — model, tokenizer, backend, sensitivity, database actions
- [Searching Assets](search.md) — how search works and how to get better results
- [Extensibility](extensibility.md) — add custom metadata extractors and asset kinds
- [Troubleshooting](troubleshooting.md) — common issues and fixes
- [FAQ](faq.md) — size, performance, privacy, roadmap

## Requirements

- Unity **2022.3 LTS or newer** (developed and tested on 6000.5.2f1)
- `com.unity.ai.inference` (Sentis) 2.3.0+ — installed automatically with the package
- GPU compute shader support for the GPU backend (a CPU backend is available as fallback)