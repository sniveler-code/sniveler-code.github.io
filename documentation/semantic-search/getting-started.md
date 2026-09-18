# Getting Started

This guide walks you from a fresh project to your first semantic search.

## 1. Install the package

1. In the Editor open **Assets → Import Package → Custom Package…**.
2. Select the **`AI Semantic Search.unitypackage`** file (from the store listing) and click
   **Import**. The `com.unity.ai.inference` (Sentis) dependency installs automatically.

## 2. Locate the sample assets

The sample (model, tokenizer config and demo prefabs) ships **inside** the package file, so
it is already in your project after step 1. If you imported a build without the sample, use
**Package Manager → AI Semantic Search → Samples → Base AI Model & Demo Assets → Import**.

The files you need:

- `Models/MiniLM_uint8.sentis` — the MiniLM-L6-v2 sentence model, uint8-quantized (~24 MB);
- `Data/tokenizer.json` — the BERT WordPiece tokenizer config (the full vocabulary is
  embedded in this file — no separate `vocab.txt` is needed);
- `Resources/…` — a small set of medieval prefabs to search immediately.

## 3. Open the tool

**Window → SnivelerCode → Semantic Search** (window title: *Asset AI Search*).

The window has three tabs: **Search**, **Embedding**, **Prefabs**, and a
status bar at the bottom showing progress and messages.

## 4. Set up the model

In the **Embedding** tab:

1. **Model** — drag `MiniLM_uint8.sentis` into the field.
2. **Vocab** — drag `tokenizer.json` into the field.
   > ⚠ This must be the JSON tokenizer config. Plain vocabulary files (e.g. `vocab.txt`
   > published by some model repositories) do not work — the tool reads the JSON config,
   > which already contains the complete vocabulary.
3. Leave **Tokens = 128** and **Backend = GPU**. If your GPU has no compute shader
   support, switch **Backend** to **CPU**.

The status bar confirms the model is ready and the **Search** button becomes enabled.

## 5. Index your assets

**Prefabs tab:**

1. **Check** — scans the project for new/modified prefabs.
2. **Index** — runs the model over them and saves vectors to the local database.

> Tip: you can toggle individual metadata extractors (name/context/components/…) in the
> Prefabs tab settings panel before indexing.

## 6. Search

Open the **Search** tab, type e.g. `heavy axe` and press **Search**.
Results appear grouped by type, sorted by similarity score.

- Clicking a prefab result lets you drag it into the scene.

Adjust the **Sensitivity** slider if you get too many or too few results (default 25 is loose;
raise it for stricter matches).

That's it — you are now searching assets by meaning, fully offline.