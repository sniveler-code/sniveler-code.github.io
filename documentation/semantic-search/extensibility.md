# Extensibility

This package is architectured around small, composable pieces. You can extend it without
modifying the core modules.

## Architecture overview

```
EditorWindow (SemanticSearchEditor)
 └─ MiniContainer (constructor-injection DI)
     ├─ IEmbeddingModule   — model + tokenizer + Worker (Sentis)
     ├─ PrefabsModule      — Check/Index UI, result view, LocalTransformer
     └─ SearchModule       — query embedding + SIMD scoring over the index
```

- **Storage**: SQLite (`SqliteStorage`, partial class implementing `IAssetsStorage`,
  `IPropertiesStorage`, `IMetadataStorage`); index file `Library/SnivelerCode_SemanticIndex.db`.
- **Transformers**: `Transformer<T>` (base: chunked `ProcessAsync` → `CollectMetadata`),
  `LocalTransformer` (prefabs).
- **Metadata**: `Metadata<T>` — one semantic extractor per concern.

## Adding a metadata extractor (prefabs example)

1. Create a class in `Editor/Transformers/Local/Prefabs/Metadata/`:

   ```csharp
   public sealed class MyMetadata : Metadata<GameObject>
   {
       public override string Name => "My Rule";
       public override string Info => "Adds custom semantic hints.";
       public MyMetadata(IMetadataFacade facade) : base(facade) { }

       public override async Task<IMetadataResult> ProcessAsync(GameObject asset)
       {
           // ... analyze the GameObject ...
           return IMetadataResult.FromArray(new[] { "custom hint" });
       }
   }
   ```

2. Register it in `LocalMetadataProcessor` (constructor array):

   ```csharp
   _extractors = new Metadata<GameObject>[]
   {
       container.Create<IdentityMetadata>(),
       // ...existing extractors...
       container.Create<MyMetadata>(),   // ← new
   };
   ```

3. Use `_metadata.GetVectorsAsync(MetadataWord[])` for similarity against the category
   databases, and return a semantic description. The extractor automatically appears in
   the Prefabs tab settings (extractor toggles).

## Adding a new asset kind

1. Add a value to `AssetStorageType`.
2. Write a `Transformer<YourAssetType>` that collects metadata and persists vectors
   (model it on `LocalTransformer`: `CollectMetadata` + `ProcessAssets`).
3. Add a module/tab modeled on `PrefabsModule` (Check/Index + `Bind<YourResultView>()`
   where the result view extends `SearchResultView`).

## Working with the category databases

Category keyword databases (`Editor/Transformers/Local/Prefabs/Database/*.json`)
define semantic axes: `{ "categories": [ { "id", "parent?", "keys", "values", "examples?" } ] }`.
Each category is embedded and matched during indexing. The category databases are
validated by tests (unique ids across all databases, `Detailed.parent` resolves to a
`General` id, no self-parent, no category pair sharing ≥3 keys, minimum coverage). The optional `examples` field
enriches the category embedding with *your project's* typical prefab names — for
example `"examples": ["P_Weapon_Axe_LOD0", "Axe_Heavy"]`. Use your own nomenclature:
shipped databases ship without examples so the search stays generic and portable
across projects. The **Bake** action in the
Prefabs tab re-embeds them when the DB file changes — it also runs automatically the
first time. To see which categories your corpus never matches (dead categories) and
which assets match no category, open
`Window > SnivelerCode > Category Coverage (Debug)` after indexing.

## Code style notes

- Editor-only package: everything lives in the `SnivelerCode.SemanticSearch.*` namespaces.
- Register types in `SemanticSearchEditor.RegisterContainer()` or create them locally via
  `container.Create<T>()` (prefer `Create` for transformer-pipeline types that must not
  appear in other modules' dropdowns).
- Follow the existing custody pattern: modules implement `IDisposable` and unsubscribe
  event handlers.