# FAQ

## Why is the package so large?

The sample ships the sentence-transformer model as a **uint8-quantized** build
(`MiniLM_uint8.sentis`, ~24 MB) so that the tool works out of the box. The editor code
itself is small; you can remove the sample after importing and keep only the model files
you need. The full-precision float32 version (`MiniLM.onnx`, ~90 MB) is **not** part of the
shipped package — the original float32 weights live on Hugging Face; see the README
("Embedding model").

## Does it work offline?

Yes. All embedding and search computations run in the editor, locally. No API keys,
no cloud calls, no telemetry. Open-source friendly.

## What hardware is required?

- Unity 2022.3 LTS or newer.
- A GPU with compute shader support delivers fast indexing (HSAIL/DX12/Vulkan/Metal
  compute); otherwise the CPU backend is used.

## How accurate is the search?

MiniLM-L6-v2 embeddings capture semantic similarity well for names and short descriptions.
The package adds strong context: components, folder/category keywords, materials,
geometry — which is what makes queries like
"small green plant" work despite no exact filename.

## Which models are supported?

BERT-like models (`.onnx` or `.sentis`) with `input_ids` and `attention_mask` inputs.
The bundled `MiniLM_uint8.sentis` is a uint8-quantized build of all-MiniLM-L6-v2 (float32
source: the original weights on Hugging Face). Other sentence models may work if they
share the same input/output contract.

## Will there be a cloud/AI-powered version?

A **Gemini Transformer** appears in the Prefabs dropdown as *"(PRO experimental)"* — it is
a placeholder reserved for future PRO versions and is not functional in this release.

## Will my assets be modified?

No. The tool only reads assets and writes to `Library/SnivelerCode_SemanticIndex.db`
(project-local and gitignored). Deleting that file resets the index; your prefabs
and scenes are untouched.

## How do I improve search quality on my project?

- Keep asset names descriptive (`Chest_Medieval` > `T_chest_03`);
- let the tool index after folder reorganizations (Check picks up new/changed assets by hash);
- enable/disable extractors per project — e.g. context or geometry toggles in the
  Prefabs tab settings;
- adjust sensitivity and, for deep hierarchies, token length.

## What if I find a bug?

Report it via the **support section of the store listing** with the Unity version, package
version, and steps to reproduce (see Troubleshooting).

## I imported the package but the sample model is missing

The model (`MiniLM_uint8.sentis`), the tokenizer config and the demo prefabs are part of the
sample content shipped inside the package file. Re-run the import and make sure the files
appear in your project; for the Package Manager flow, open **AI Semantic Search → Samples →
Base AI Model & Demo Assets → Import**.

## Why is the shipped model quantized?

The sample ships `MiniLM_uint8.sentis` — the float32 model (original weights on Hugging
Face) quantized to uint8 with Unity Sentis (`ModelQuantizer`). That cuts the model
~4× (90 MB → ~24 MB) with negligible impact on search quality for this model. Note: the
Sentis ONNX importer does **not** accept pre-quantized ONNX (QDQ) graphs — quantization is
applied to the imported model and serialized as a `.sentis` file. See the README
("Embedding model") for the exact script.