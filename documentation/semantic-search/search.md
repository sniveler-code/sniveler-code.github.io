# Searching Assets

## How a search works

1. Your query is embedded with the same model used for indexing.
2. Every indexed asset gets a similarity score — cosine similarity between the query
   vector and the asset's vector, computed with SIMD acceleration.
3. A small **text-match bonus** is added when the raw query text appears in the asset's
   metadata.
4. Assets above the **Sensitivity** threshold are returned, sorted by score.

## What affects relevance

The quality of results depends on the metadata collected during indexing:

### Prefabs

| Signal | Example |
|---|---|
| **Name** | `Axe_Bronze` → "axe", "bronze" |
| **Components** | Light, VFX, Rigidbody, colliders → "lamp", "physical", "interactive" |
| **Context** | folder path & category keyword DBs → "workshop", "weapons", "furniture" |
| **Materials** | material names/keys → "wood", "metal", "cloth" |
| **Geometry** | mesh complexity hints (if the extractor is enabled) |

## Tips for better results

- Use **everyday words**: `small green plant` beats `Plant_SM_04`.
- Combine category words with context: `medieval storage barrel` is very precise.
- If a result is missing, lower the sensitivity a bit.
- After moving/renaming assets, re-run **Check** (it detects modified assets by hash)
  and **Index** to refresh vectors.

## Result interactions

- **Prefabs** — select a result and drag it into the scene (or an open prefab edit).