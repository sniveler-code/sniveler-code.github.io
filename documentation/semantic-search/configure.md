# Configuration

This page explains every setting in the tool and how the database lifecycle works.

## Embedding tab — model setup

| Setting | Default | Description |
|---|---|---|
| **Model** | — | The embedding model (`.sentis` or `.onnx`). Any BERT-like model with `input_ids` / `attention_mask` inputs works; `MiniLM_uint8.sentis` from the samples is recommended. |
| **Vocab** | — | The BERT tokenizer configuration, provided as JSON (`tokenizer.json`). The tokenizer is built from this config. |
| **Tokens** (max length) | 128 | Maximum sequence length (range 128–512). 128 is enough for names; raise for deep folder paths or long descriptions. |
| **Backend** | GPU | Sentis compute backend. Use **CPU** when the GPU lacks compute shader support. |

When you assign a model, it is loaded and validated immediately — an unsupported model
shows an error in the status bar instead of crashing.

## Where things live in the window

The window has three tabs — **Search**, **Embedding**, **Prefabs** — and a status bar.

- **Embedding tab** — model setup: Model, Vocab, Tokens, Backend (all values are persisted).
- **Prefabs tab** — database actions: **Check** scans for new/modified prefabs,
  **Index** embeds them into the local database; extractor toggles live in the
  transformer settings panel of this tab.

## Search tab — sensitivity

**Sensitivity** (default 25) is the minimum similarity score, in percent, for a result.
Higher values are stricter (fewer, more precise matches); lower values allow broader
associations.
- Lower (e.g. 55–65) → more relaxed search, more noise;
- 60–70 → the "sweet spot" for most projects;
- Higher (e.g. 80+) → exact-ish matches only.

## Where the data lives

| Data | Location |
|---|---|
| Index + settings | `Library/SnivelerCode_SemanticIndex.db` (project-local, gitignored) |
| Category keyword DBs | inside the package: `Editor/Transformers/Local/Prefabs/Database/*.json` |

### Resetting the index

The database is stored in `Library/`. Cleaning `Library/` deletes it; the tool then starts
empty — re-run **Check → Index** after that. To rebuild categories only, use the
**Bake** action in the Prefabs tab settings (they rebuild automatically when missing).