# Tree export folder

Regenerate:

```bash
python3 tools/tree_to_markdown.py --tree public/tree.json --rulers public/rulers.json --out-dir docs/tree-export
```

- `TREE_INGESTION.md` — stats, pat/mat from `--root`, ruler overlap, Freya note
- `individuals_all.tsv` — all individuals (tab-separated for Sheets / DuckDB)
- `families_all.md` — all families table
