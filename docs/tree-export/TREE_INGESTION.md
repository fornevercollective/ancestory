# Fortner–Clements compact tree — ingestion export
_Generated 2026-04-28 22:37 UTC by `tools/tree_to_markdown.py`._
## Verification vs. chat summaries
If an LLM claimed the **oldest** person in this GED export was **1882** or that **no kings** appear, **re-check against this file**: `public/tree.json` is the same source as `rulers.json` heuristics, and includes **medieval** `y` values (e.g. **810** minimum birth year below) and **John Lackland / Henry II**-class names inside the **@P1@** ancestor cone when those lines exist in the GED.
## Source
- **tree.json `source`**: `/Users/tref/Desktop/Fortner_ Clements Family Tree.ged`
- **rulers.json hint**: `Heuristic ruler/title detection + keyword counts in GED text (not verified history).`
## Counts
| Metric | Value |
| --- | ---: |
| Individuals | 7454 |
| Families | 1725 |
| Individuals with numeric `y` | 6518 |
| Ancestors of `@P1@` (bipartite closure) | 1556 |
| Ruler-flagged people (heuristic) | 96 |
| …in ancestor cone of `@P1@` | 40 |
| …not in cone | 56 |
## Date range (numeric `y` / `dy` only)
- **Earliest `y` in file**: 810
- **Latest `y` in file**: 2007
- **Earliest `dy`**: 465
- **Latest `dy`**: 2014
## Patriline from `@P1@` (father chain)
- **Length**: 14 (generation index 0 = root)
- **There is no 60th patriline generation** in this export: the father chain stops at **14** people (last xref **`@P1859@`**).

| gen | xref | name | y |
| ---: | --- | --- | ---: |
| 0 | `@P1@` | Erika Lynn /Fortner/ | 1980 |
| 1 | `@P4@` | James Blair /Fortner/ | 1949 |
| 2 | `@P5@` | Theodore Charles /Fortner/ | 1924 |
| 3 | `@P115@` | Clarence James /Fortner/ | 1897 |
| 4 | `@P1040@` | James Buchanan /Fortner/ | 1857 |
| 5 | `@P1041@` | George /Fortner/ | 1818 |
| 6 | `@P1326@` | Richard John /Fortner/ | 1793 |
| 7 | `@P1348@` | Peter /Pfort/ | 1758 |
| 8 | `@P1364@` | Johann Nicholas /Pfort/ | 1679 |
| 9 | `@P1833@` | Hans Nickel /Pfort/ | 1648 |
| 10 | `@P1835@` | Johannes /Pfort/ | 1630 |
| 11 | `@P1839@` | Martin /Pfortner/ | 1603 |
| 12 | `@P1847@` | Heinz /Pfortner/ | 1576 |
| 13 | `@P1859@` | Melchiar /Pfortner/ | 1545 |

## Matriline from `@P1@` (mother chain)
- **Length**: 6

| gen | xref | name | y |
| ---: | --- | --- | ---: |
| 0 | `@P1@` | Erika Lynn /Fortner/ | 1980 |
| 1 | `@P3@` | Geri Lynn /Clements/ | 1952 |
| 2 | `@P10@` | Marlyn Mavis /McLaughlin/ | 1932 |
| 3 | `@P16@` | LaRena Vilate /Pfost/ | 1908 |
| 4 | `@P22@` | Chloe M /Bales/ | 1888 |
| 5 | `@P6892@` | Mary Ann /Pounds/ | 1839 |

## Freya Noir Fortner
- **No individual** matched `Freya` / `Noir` in `n` (compact name field).
- `@F1353@` (Erika & Tad) **`k` list** in this export: `[]` — if Freya should appear, **re-run** `tools/ged_export.py` after adding her in the GED.

## Ruler-heuristic people inside ancestor cone of `@P1@`
_Heuristic only — not proof of descent; see `rulers.json` hint._

| xref | birth y | name (compact) |
| --- | ---: | --- |
| `@P6560@` | 1000 | Geoffrey II Count /De Gastinois/ |
| `@P6531@` | 1007 | Duncan I MacCrinan King of /Scotland/ |
| `@P6488@` | 1031 | Malcolm III "Big Head, Long Neck", King of Scotland /Canmore/ |
| `@P4766@` | 1035 | Lord Guillaume D /Arques/ |
| `@P6458@` | 1040 | Guilaume Count De /Toulouse/ |
| `@P4467@` | 1047 | Maredydd (Prince of Powys) /Ap Bleddyn/ |
| `@P5802@` | 1048 | Domnall "High King of Aileach" /MacLochlainn/ |
| `@P6461@` | 1050 | Boson Viscount /Chatellerault/ |
| `@P4748@` | 1084 | William FitzRichard /Lord Cardinand/ |
| `@P4473@` | 1102 | Matilda Empress /Germany/ |
| `@P4456@` | 1133 | Henry II /King of England/ |
| `@P632@` | 1154 | Gruffydd Ap Rhys /Lord South Wales/ |
| `@P4415@` | 1167 | John Lackland "King of England" /Plantagenet/ |
| `@P4392@` | 1188 | Princess Joan /Plantagenet of England/ |
| `@P3963@` | 1280 | Sir Ralph /De Otteby/ |
| `@P3955@` | 1335 | Sir Ralph VI /De Cromwell/ |
| `@P1707@` | 1360 | Edmund sir /Noone/ |
| `@P3914@` | 1374 | Lady wife of Robert /De Cromwell/ |
| `@P2380@` | 1512 | Lord Mayor Andrew /Judde/ |
| `@P2345@` | 1522 | Sir Thomas /Smythe Sr/ |
| `@P2342@` | 1535 | Dame Alice /Judde/ |
| `@P1583@` | 1543 | Sir Thomas Duke of Leeds /Osborne/ |
| `@P2017@` | 1685 | Sir Tom /Forster/ |
| `@P6627@` | — | Alfgifu (Aelflaed) Queen of /England/ |
| `@P6669@` | — | Conn Monarch /Ceadcatha/ |
| `@P6633@` | — | Constantín mac Cináeda, King of the Picts /mac Cináeda/ |
| `@P6652@` | — | Cormac Ulfhota Monarch /mac Airt/ |
| `@P5794@` | — | Domnall "King Aileach, Lord of Cinel Eoghainn" /MacLochlainn/ |
| `@P6632@` | — | Donald II, Domnall mac Causantín, "The Madman", King of the Picts or King of Scotland /Scotland/ |
| `@P6623@` | — | Duncan, Lord Of /Mormaer/ |
| `@P6616@` | — | Ealdgyth (Algitha), Queen Of /England/ |
| `@P6647@` | — | Eochaid, "slave-lord" /Mugmedon/ |
| `@P6628@` | — | Ethelred II, 'The_Unready' England, King of /England/ |
| `@P6649@` | — | Fiacha, High King, /Sraibhtine/ |
| `@P4797@` | — | Geoffroy Count /Brionne/ |
| `@P6631@` | — | Malcolm I, Máel Coluim mac Domnaill, An Bodhbhdercc, "The Dangerous Red", King of /Scotland/ |
| `@P4796@` | — | Mrs Geoffroy Countess /Brionne/ |
| `@P6624@` | — | Mrs-Malcolm Queen Of /Scotland/ |
| `@P6648@` | — | Muiredach, High King, /Tirech/ |
| `@P6625@` | — | Máel Coluim mac Cináeda, Malcolm II, Máel Coluim Forranach, "The Destroyer", King of /Scotland/ |
