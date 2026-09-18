# Troubleshooting

## "Semantic model is empty" / assignment does nothing

The model field expects a **Model Asset** (`.sentis` or `.onnx`). If nothing happens after
assigning:

- Check that the file is a valid model (re-import if it came from disk).
- Check the status bar: "Unsupported model. Expected BERT-like inputs (input_ids,
  attention_mask)" means the model architecture is not supported.

## "Tokenizer" errors when assigning Vocab

The **Vocab** slot expects the **`tokenizer.json`** config (JSON). A plain vocabulary
file (e.g. `vocab.txt` from a model repository) fails the JSON parse with a
`TokenizerException`. Use `Data/tokenizer.json` from the samples — it already contains
the complete vocabulary.

## Search button is disabled

The embedding model is not fully set up, or the model did not finish loading/validation.
Check the **Embedding** tab settings and the status bar messages; make sure both **Model**
and **Vocab** are assigned and no error message is shown.

## No results for a known asset

1. Lower **Sensitivity** — the default 25 is already loose, so if it is at the default the
   issue is likely indexing (steps 2–3), not the threshold.
2. Verify the asset was indexed: **Prefabs tab → Check** shows `Indexed: N`,
   and it appears in the database count in the status bar.
3. Re-run **Index** after changing model or metadata settings.

## "Database is empty" after it worked before

The index lives in `Library/SnivelerCode_SemanticIndex.db`. Cleaning `Library/` deletes
it — re-run **Check → Index** in both tabs. Your assets are never modified.

## Errors during Check/Index

Check/Index failures are shown in the status bar and detailed in the Console
(Window → General → Console). Typical causes:

- an asset marked as missing (moved/deleted file) — Check removes it automatically;
- a corrupt prefab — exclude it or fix it, then re-run Check.

## Performance is slow

- Indexing is GPU-accelerated by default. If your GPU lacks compute shaders, the tool
  falls back to CPU — expect lower throughput; consider setting **Backend = CPU**
  explicitly to avoid repeated warnings.
- Very deep folder structures may benefit from a higher **Tokens** value (256–512) at the
  cost of slower indexing.

## Collecting logs for support

1. Reproduce the issue.
2. Open **Window → General → Console**, note the error lines, and click the log entry
   to expand the stack trace.
3. Include Unity version (from Help → About Unity) and package version
   (Package Manager → AI Semantic Search).