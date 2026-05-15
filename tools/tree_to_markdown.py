#!/usr/bin/env python3
"""
Build Markdown (+ TSV) exports from ancestory compact tree.json + rulers.json.

  python3 tools/tree_to_markdown.py
  python3 tools/tree_to_markdown.py --tree public/tree.json --out-dir docs/tree-export

Verifies lineage depth, oldest birth years, ruler overlap with ancestor cone, etc.
"""
from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path


def father_id(pid: str, ind: dict, fam: dict) -> str | None:
    c = ind.get(pid, {}).get("c")
    if not c:
        return None
    return fam.get(c, {}).get("h") or None


def mother_id(pid: str, ind: dict, fam: dict) -> str | None:
    c = ind.get(pid, {}).get("c")
    if not c:
        return None
    return fam.get(c, {}).get("w") or None


def patriline(root: str, ind: dict, fam: dict, max_gen: int = 500) -> list[str]:
    out: list[str] = []
    cur: str | None = root
    seen: set[str] = set()
    while cur and len(out) < max_gen and cur not in seen:
        seen.add(cur)
        out.append(cur)
        cur = father_id(cur, ind, fam)
    return out


def matriline(root: str, ind: dict, fam: dict, max_gen: int = 500) -> list[str]:
    out: list[str] = []
    cur: str | None = root
    seen: set[str] = set()
    while cur and len(out) < max_gen and cur not in seen:
        seen.add(cur)
        out.append(cur)
        cur = mother_id(cur, ind, fam)
    return out


def ancestor_set(root: str, ind: dict, fam: dict) -> set[str]:
    acc: set[str] = set()
    stack = [root]
    while stack:
        pid = stack.pop()
        if pid in acc:
            continue
        acc.add(pid)
        f, m = father_id(pid, ind, fam), mother_id(pid, ind, fam)
        if f:
            stack.append(f)
        if m:
            stack.append(m)
    return acc


def md_cell(s: object) -> str:
    t = "" if s is None else str(s)
    t = t.replace("\n", " ").replace("|", "\\|").strip()
    return t or "—"


def main() -> None:
    ap = argparse.ArgumentParser(description="Export tree.json + rulers.json to Markdown.")
    ap.add_argument("--tree", type=Path, default=Path("public/tree.json"))
    ap.add_argument("--rulers", type=Path, default=Path("public/rulers.json"))
    ap.add_argument("--root", default="@P1@", help="Primary person for lineage / ruler scope")
    ap.add_argument("--out-dir", type=Path, default=Path("docs/tree-export"))
    args = ap.parse_args()

    data = json.loads(args.tree.read_text(encoding="utf-8"))
    rulers_payload = json.loads(args.rulers.read_text(encoding="utf-8"))
    ind: dict = data["individuals"]
    fam: dict = data["families"]
    root = args.root

    pat = patriline(root, ind, fam)
    mat = matriline(root, ind, fam)
    anc = ancestor_set(root, ind, fam)

    ys = [v["y"] for v in ind.values() if isinstance(v.get("y"), (int, float))]
    dys = [v["dy"] for v in ind.values() if isinstance(v.get("dy"), (int, float))]

    ruler_people = rulers_payload.get("people") or []
    ruler_in = [p for p in ruler_people if p.get("id") in anc]
    ruler_out_ct = len(ruler_people) - len(ruler_in)

    freya_ids = [
        pid
        for pid, v in ind.items()
        if re.search(r"freya", (v.get("n") or ""), re.I) or re.search(r"noir", (v.get("n") or ""), re.I)
    ]

    f1353 = fam.get("@F1353@", {})
    out_dir: Path = args.out_dir
    out_dir.mkdir(parents=True, exist_ok=True)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    lines: list[str] = []
    lines.append("# Fortner–Clements compact tree — ingestion export\n")
    lines.append(f"_Generated {now} by `tools/tree_to_markdown.py`._\n")
    lines.append("## Verification vs. chat summaries\n")
    lines.append(
        "If an LLM claimed the **oldest** person in this GED export was **1882** or that **no kings** "
        "appear, **re-check against this file**: `public/tree.json` is the same source as "
        "`rulers.json` heuristics, and includes **medieval** `y` values (e.g. **810** minimum birth year below) "
        "and **John Lackland / Henry II**-class names inside the **@P1@** ancestor cone when those lines exist in the GED.\n"
    )
    lines.append("## Source\n")
    lines.append(f"- **tree.json `source`**: `{md_cell(data.get('source'))}`\n")
    lines.append(f"- **rulers.json hint**: `{md_cell(rulers_payload.get('hint'))}`\n")

    lines.append("## Counts\n")
    lines.append(f"| Metric | Value |\n| --- | ---: |\n")
    lines.append(f"| Individuals | {len(ind)} |\n")
    lines.append(f"| Families | {len(fam)} |\n")
    lines.append(f"| Individuals with numeric `y` | {len(ys)} |\n")
    lines.append(f"| Ancestors of `{root}` (bipartite closure) | {len(anc)} |\n")
    lines.append(f"| Ruler-flagged people (heuristic) | {len(ruler_people)} |\n")
    lines.append(f"| …in ancestor cone of `{root}` | {len(ruler_in)} |\n")
    lines.append(f"| …not in cone | {ruler_out_ct} |\n")

    lines.append("## Date range (numeric `y` / `dy` only)\n")
    lines.append(f"- **Earliest `y` in file**: {min(ys) if ys else '—'}\n")
    lines.append(f"- **Latest `y` in file**: {max(ys) if ys else '—'}\n")
    if dys:
        lines.append(f"- **Earliest `dy`**: {min(dys)}\n")
        lines.append(f"- **Latest `dy`**: {max(dys)}\n")

    lines.append(f"## Patriline from `{root}` (father chain)\n")
    lines.append(f"- **Length**: {len(pat)} (generation index 0 = root)\n")
    if len(pat) > 59:
        lines.append(f"- **Person at generation index 59** (60th in 1-based wording): `{pat[59]}` — {md_cell(ind.get(pat[59], {}).get('n'))}\n")
    else:
        lines.append(
            f"- **There is no 60th patriline generation** in this export: the father chain stops at **{len(pat)}** people "
            f"(last xref **`{pat[-1]}`**).\n"
        )
    lines.append("\n| gen | xref | name | y |\n| ---: | --- | --- | ---: |\n")
    for i, pid in enumerate(pat):
        v = ind.get(pid, {})
        lines.append(f"| {i} | `{pid}` | {md_cell(v.get('n'))} | {md_cell(v.get('y'))} |\n")

    lines.append(f"\n## Matriline from `{root}` (mother chain)\n")
    lines.append(f"- **Length**: {len(mat)}\n")
    lines.append("\n| gen | xref | name | y |\n| ---: | --- | --- | ---: |\n")
    for i, pid in enumerate(mat):
        v = ind.get(pid, {})
        lines.append(f"| {i} | `{pid}` | {md_cell(v.get('n'))} | {md_cell(v.get('y'))} |\n")

    lines.append("\n## Freya Noir Fortner\n")
    if freya_ids:
        lines.append(f"- Matched name search: {', '.join(f'`{x}`' for x in freya_ids)}\n")
    else:
        lines.append(
            "- **No individual** matched `Freya` / `Noir` in `n` (compact name field).\n"
            "- `@F1353@` (Erika & Tad) **`k` list** in this export: "
            f"`{f1353.get('k', [])!r}` — if Freya should appear, **re-run** `tools/ged_export.py` after adding her in the GED.\n"
        )

    lines.append(f"\n## Ruler-heuristic people inside ancestor cone of `{root}`\n")
    lines.append("_Heuristic only — not proof of descent; see `rulers.json` hint._\n")
    lines.append("\n| xref | birth y | name (compact) |\n| --- | ---: | --- |\n")
    for p in sorted(ruler_in, key=lambda x: (x.get("y") is None, x.get("y") or 0, x.get("n") or "")):
        lines.append(f"| `{p.get('id')}` | {md_cell(p.get('y'))} | {md_cell(p.get('n'))} |\n")

    (out_dir / "TREE_INGESTION.md").write_text("".join(lines), encoding="utf-8")

    # Full individuals: TSV for tools; compact MD table optional second file
    tsv_path = out_dir / "individuals_all.tsv"
    with tsv_path.open("w", encoding="utf-8") as fp:
        fp.write("id\tn\ts\ty\tdy\tc\tm\tbp\tdp\n")
        for pid in sorted(ind.keys()):
            v = ind[pid]
            m = v.get("m") or []
            fp.write(
                "\t".join(
                    [
                        pid,
                        str(v.get("n") or "").replace("\t", " "),
                        str(v.get("s") or ""),
                        str(v.get("y") if v.get("y") is not None else ""),
                        str(v.get("dy") if v.get("dy") is not None else ""),
                        str(v.get("c") or ""),
                        " ".join(m),
                        str(v.get("bp") or "").replace("\t", " "),
                        str(v.get("dp") or "").replace("\t", " "),
                    ]
                )
                + "\n"
            )

    fam_lines = ["# Families (all)\n", f"_Count: {len(fam)}._\n\n", "| fid | husband | wife | children |\n| --- | --- | --- | --- |\n"]
    for fid in sorted(fam.keys()):
        f = fam[fid]
        kids = f.get("k") or []
        fam_lines.append(
            f"| `{fid}` | `{md_cell(f.get('h'))}` | `{md_cell(f.get('w'))}` | "
            f"{md_cell(', '.join(kids) if kids else '—')} |\n"
        )
    (out_dir / "families_all.md").write_text("".join(fam_lines), encoding="utf-8")

    readme = f"""# Tree export folder

Regenerate:

```bash
python3 tools/tree_to_markdown.py --tree public/tree.json --rulers public/rulers.json --out-dir docs/tree-export
```

- `TREE_INGESTION.md` — stats, pat/mat from `--root`, ruler overlap, Freya note
- `individuals_all.tsv` — all individuals (tab-separated for Sheets / DuckDB)
- `families_all.md` — all families table
"""
    (out_dir / "README.md").write_text(readme, encoding="utf-8")

    print(f"Wrote {out_dir / 'TREE_INGESTION.md'}, {tsv_path}, {out_dir / 'families_all.md'}, {out_dir / 'README.md'}")


if __name__ == "__main__":
    main()
