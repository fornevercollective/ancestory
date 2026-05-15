#!/usr/bin/env python3
"""
Parse GEDCOM 5.5 lineage-linked into compact JSON for the ancestory web viewer.

Usage (first argument must be your real .ged file — not the literal words "path/to"):
  python3 tools/ged_export.py "/Users/you/Desktop/My Family Tree.ged" public/tree.json

Writes tree.json and rulers.json next to each other (same directory as the output path).

Genetic / sexual partners not modeled as FAMS (unmarried, donor, etc.): add NOTE line(s) on the
person’s INDI record containing the token ANCESTORY_GENETIC_PARTNER (case-insensitive), optional
punctuation (: # -), then one or more individual xrefs on the same line. There is no limit on how
many xrefs you list or how many NOTE lines you use (each matching line contributes xrefs in order;
duplicates are deduped). Examples:
  1 NOTE ANCESTORY_GENETIC_PARTNER @I42@
  1 NOTE Partners (genetic): ANCESTORY_GENETIC_PARTNER: @I9@ @I10@
Re-export; tree.json stores them under the compact key "gp" for map partner overlays. The web app
can also merge a browser-only partner list (any count) without re-exporting the GED.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path


def split_records(lines: list[str]) -> list[list[str]]:
    blocks: list[list[str]] = []
    cur: list[str] = []
    for line in lines:
        if line.startswith("0 ") and cur:
            blocks.append(cur)
            cur = []
        cur.append(line.rstrip("\n\r"))
    if cur:
        blocks.append(cur)
    return blocks


xref_re = re.compile(r"^0 (@([^@]+)@) (INDI|FAM|SOUR|OBJE|NOTE|REPO|SUBM|SUBN)")
# First plausible year in a GEDCOM DATE payload (handles "1034", "Mar 1980", "879")
YEAR_IN_DATE = re.compile(r"\b([1-9][0-9]{2,3})\b")


def first_year_from_date_payload(text: str) -> int | None:
    m = YEAR_IN_DATE.search(text)
    if not m:
        return None
    y = int(m.group(1))
    if 400 <= y <= 2200:
        return y
    return None


def looks_like_image_file_url(url: str) -> bool:
    low = url.lower()
    if "f=image" in low or "image/" in low:
        return True
    return any(low.split("?", 1)[0].endswith(ext) for ext in (".jpg", ".jpeg", ".png", ".gif", ".webp"))


RULER_RE = re.compile(
    r"\b("
    r"king|queen|prince|princess|emperor|empress|czar|tsar|tsarina|tsarev|"
    r"khan|sultan|sultana|pharaoh|pasha|shah|shahbanu|maharaj|maharani|"
    r"chief|chieftain|tribal|dynasty|reign|coronation|crown|royal|regent|"
    r"archduke|grand\s*duke|duke|duchess|earl|countess|count\b|marquis|"
    r"margrave|burgrave|baron|baroness|viscount|lord\b|lady\b|sir\b|dame\b|"
    r"pope|cardinal|patriarch|caliph|emir|amir|begum|nawab|rajah|rani|"
    r"kaiser|kingdom|queen\s*consort|prince\s*of|princess\s*of|infante|"
    r"pretender|throne|sovereign|monarch|potentate|imperator"
    r")\b",
    re.I,
)
WAR_RE = re.compile(
    r"\b(war|wars|battle|battles|siege|sieges|campaign|army|armies|navy|naval|"
    r"treaty|invasion|invaded|conquest|rebellion|uprising|crusade|revolt|"
    r"military|slain|killed\s+in\s+action|wounded|sword|siege\s+of)\b",
    re.I,
)
LAND_RE = re.compile(
    r"\b(annex|annexed|territory|territories|province|provinces|colony|colonies|"
    r"ceded|cession|border|borders|realm|dominion|dominions|empire|"
    r"conquest|conquered|occupied|occupation|vassal|fief|demesne|grant\s+of\s+land)\b",
    re.I,
)
MONEY_RE = re.compile(
    r"\b(tax|taxes|treasury|treasuries|gold|silver|coin|coins|ducats?|livres?|"
    r"florin|pound\s*sterling|shilling|crown\s+revenue|wealth|riches|debt|"
    r"loan|loans|bank|banking|finance|financial|exchequer|subsidy|patronage|"
    r"inheritance|dowry|ransom|\$|£|€)\b",
    re.I,
)
AWARD_RE = re.compile(
    r"\b(award|awards|medal|medals|order\s+of|knight|knighthood|damehood|"
    r"legion|honou?r|honor|nobel|prize|laureate|decoration|ribbon|garter|"
    r"bath|golden\s+fleece|elephant|eagle|cross|star\s+of)\b",
    re.I,
)

_COUNTRY_TOKENS = (
    "United States",
    "USA",
    "U.S.A.",
    "America",
    "England",
    "Scotland",
    "Wales",
    "Ireland",
    "UK",
    "Great Britain",
    "Britain",
    "France",
    "Germany",
    "Italy",
    "Spain",
    "Portugal",
    "Netherlands",
    "Belgium",
    "Austria",
    "Hungary",
    "Poland",
    "Russia",
    "Norway",
    "Sweden",
    "Denmark",
    "Finland",
    "Switzerland",
    "Greece",
    "Turkey",
    "Ottoman",
    "Persia",
    "Iran",
    "India",
    "China",
    "Japan",
    "Korea",
    "Mexico",
    "Canada",
    "Brazil",
    "Argentina",
    "Egypt",
    "Morocco",
    "Ethiopia",
    "Nigeria",
    "South Africa",
    "Australia",
    "New Zealand",
    "Israel",
    "Palestine",
    "Syria",
    "Iraq",
    "Arabia",
    "Normandy",
    "Burgundy",
    "Anjou",
    "Sicily",
    "Naples",
    "Castile",
    "Aragon",
    "Bohemia",
    "Saxony",
    "Bavaria",
    "Prussia",
    "Byzantium",
    "Byzantine",
    "Holy Roman Empire",
    "Roman Empire",
    "Carolingian",
    "Frankish",
    "Francia",
    "Gaul",
    "Croatia",
    "Serbia",
    "Romania",
    "Bulgaria",
    "Ukraine",
    "Czech",
    "Slovakia",
    "Haiti",
    "Cuba",
    "Philippines",
    "Vietnam",
    "Thailand",
    "Siam",
    "Mongolia",
    "Tibet",
)


def guess_realm(plac: str) -> str:
    if not plac or not plac.strip():
        return "Unknown"
    s = plac.strip()
    low = s.lower()
    for tok in _COUNTRY_TOKENS:
        if tok.lower() in low:
            return tok
    segs = [x.strip() for x in s.split(",") if x.strip()]
    if not segs:
        return "Unknown"
    last = segs[-1]
    # Last segment is often a city/battle, not a country — step back when obvious
    if re.search(
        r"\b(battle|siege|church|cemetery|parish|township|hundred|barony|castle|"
        r"manor|abbey|forest|moor|field|bridge|cross|wood)\b",
        last,
        re.I,
    ):
        if len(segs) >= 2:
            return segs[-2][:80]
    return last[:80]


def stat_counts(blob: str) -> dict[str, int]:
    if not blob:
        return {"war": 0, "land": 0, "money": 0, "award": 0}
    return {
        "war": len(WAR_RE.findall(blob)),
        "land": len(LAND_RE.findall(blob)),
        "money": len(MONEY_RE.findall(blob)),
        "award": len(AWARD_RE.findall(blob)),
    }


def war_context_years(blob: str, max_years: int = 16) -> list[int]:
    """Years in the same sentence/fragment as war/battle language (heuristic, not verified)."""
    if not blob:
        return []
    parts = re.split(r"[\n;.]+", blob)
    seen: set[int] = set()
    out: list[int] = []
    for p in parts:
        if not WAR_RE.search(p):
            continue
        for m in YEAR_IN_DATE.finditer(p):
            y = int(m.group(1))
            if 600 <= y <= 2100 and y not in seen:
                seen.add(y)
                out.append(y)
                if len(out) >= max_years:
                    return sorted(out)
    return sorted(out)


def extract_snippets(blob: str, title_blob: str, max_snippets: int = 10) -> list[str]:
    combined = f"{title_blob}\n{blob}".strip()
    if not combined:
        return []
    parts = re.split(r"[\n;.]+", combined)
    out: list[str] = []
    for p in parts:
        s = p.strip()
        if len(s) < 24:
            continue
        if (
            RULER_RE.search(s)
            or WAR_RE.search(s)
            or LAND_RE.search(s)
            or MONEY_RE.search(s)
            or AWARD_RE.search(s)
        ):
            out.append(s[:280] + ("…" if len(s) > 280 else ""))
        if len(out) >= max_snippets:
            break
    return out


def build_life_waypoints(
    birth_place: str,
    death_place: str,
    resi_points: list[tuple[str, str]],
) -> list[str]:
    """Ordered place strings: birth, unique residences, death (dedupe consecutive)."""
    lw: list[str] = []
    bp = (birth_place or "").strip()
    dp = (death_place or "").strip()
    if bp:
        lw.append(bp)
    for _dt, pl in resi_points:
        pl = (pl or "").strip()
        if not pl or (lw and lw[-1] == pl):
            continue
        lw.append(pl)
    if dp and (not lw or lw[-1] != dp):
        lw.append(dp)
    return lw


def extract_genetic_partner_xrefs(note_parts: list[str]) -> list[str]:
    """Parse NOTE lines for extra partners (sexual/genetic tracing) not in FAMS.

    Any line (case-insensitive) containing ANCESTORY_GENETIC_PARTNER: after that token,
    collect every ``@...@`` xref on the same line, in order, deduped across all NOTE lines.
    Repeat the token on additional lines to record more partners; there is no hard cap.
    """
    if not note_parts:
        return []
    seen: set[str] = set()
    ordered: list[str] = []
    xref = re.compile(r"@[^@\s]+@")
    key = "ancestory_genetic_partner"
    for line in "\n".join(note_parts).splitlines():
        low = line.lower()
        pos = low.find(key)
        if pos < 0:
            continue
        tail = line[pos + len("ANCESTORY_GENETIC_PARTNER") :].lstrip(" \t:#-")
        for xm in xref.finditer(tail):
            x = xm.group(0)
            if x not in seen:
                seen.add(x)
                ordered.append(x)
    return ordered


def parse_indi(block: list[str]) -> dict | None:
    m = xref_re.match(block[0])
    if not m or m.group(3) != "INDI":
        return None
    pid = m.group(1)
    name = ""
    sex = ""
    famc: list[str] = []
    fams: list[str] = []
    birth_year: int | None = None
    death_year: int | None = None
    birth_place = ""
    death_place = ""
    death_cause = ""
    img_url: str | None = None
    in_birt = False
    in_deat = False
    in_buri = False
    in_obje = False
    in_resi = False
    resi_date = ""
    resi_plac = ""
    resi_points: list[tuple[str, str]] = []
    titl_parts: list[str] = []
    note_parts: list[str] = []
    occu_parts: list[str] = []
    birth_type = ""
    burial_place = ""
    text_ctx = ""  # TITL | NOTE for CONC/CONT
    sour_n = 0
    i = 1
    while i < len(block):
        line = block[i]
        if not line or line[0] not in "0123456789":
            i += 1
            continue
        parts = line.split(None, 2)
        if len(parts) < 2:
            i += 1
            continue
        try:
            level = int(parts[0])
        except ValueError:
            i += 1
            continue
        tag = parts[1]
        rest = parts[2] if len(parts) > 2 else ""
        if level == 1:
            if in_resi and resi_plac:
                resi_points.append((resi_date, resi_plac.strip()))
            in_birt = tag == "BIRT"
            in_deat = tag == "DEAT"
            in_buri = tag == "BURI"
            in_obje = tag == "OBJE"
            in_resi = tag == "RESI"
            if not in_resi:
                resi_date = ""
                resi_plac = ""
            text_ctx = ""
            if tag == "TITL":
                text_ctx = "TITL"
                titl_parts.append(rest.strip())
            elif tag == "NOTE":
                text_ctx = "NOTE"
                note_parts.append(rest.strip())
            elif tag == "SOUR":
                sour_n += 1
            elif tag == "OCCU":
                o = rest.strip()
                if o:
                    occu_parts.append(o)
        elif level >= 2 and text_ctx == "TITL" and tag in ("CONC", "CONT") and titl_parts:
            titl_parts[-1] += ("" if tag == "CONC" else " ") + rest.strip()
        elif level >= 2 and text_ctx == "NOTE" and tag in ("CONC", "CONT") and note_parts:
            note_parts[-1] += ("" if tag == "CONC" else " ") + rest.strip()
        if in_birt and level == 2 and tag == "DATE" and birth_year is None:
            y = first_year_from_date_payload(rest)
            if y is not None:
                birth_year = y
        if in_birt and level == 2 and tag == "PLAC" and not birth_place:
            birth_place = rest.strip()
        if in_deat and level == 2 and tag == "DATE" and death_year is None:
            dy = first_year_from_date_payload(rest)
            if dy is not None:
                death_year = dy
        if in_deat and level == 2 and tag == "PLAC" and not death_place:
            death_place = rest.strip()
        if in_deat and level == 2 and tag == "CAUSE" and not death_cause:
            death_cause = rest.strip()
        if in_birt and level == 2 and tag == "TYPE":
            birth_type = (birth_type + " " + rest.strip()).strip()
        if in_buri and level == 2 and tag == "PLAC" and not burial_place:
            burial_place = rest.strip()
        if in_resi and level == 2:
            if tag == "PLAC":
                resi_plac = rest.strip()
            elif tag == "DATE":
                resi_date = rest.strip()
        if in_obje and level == 2 and tag == "FILE" and img_url is None:
            u = rest.strip()
            if u.startswith(("http://", "https://")) and looks_like_image_file_url(u):
                img_url = u
        if tag == "NAME" and not name:
            name = rest.strip()
        elif tag == "SEX":
            sex = rest.strip()[:1] or "U"
        elif tag == "FAMC":
            if rest.strip().startswith("@"):
                famc.append(rest.strip())
        elif tag == "FAMS":
            if rest.strip().startswith("@"):
                fams.append(rest.strip())
        i += 1
    if in_resi and resi_plac:
        resi_points.append((resi_date, resi_plac.strip()))
    life_waypoints = build_life_waypoints(birth_place, death_place, resi_points)
    title_joined = " | ".join(t for t in titl_parts if t)
    note_blob = " ".join(n for n in note_parts if n)
    out: dict = {
        "id": pid,
        "name": name,
        "sex": sex or "U",
        "famc": famc,
        "fams": fams,
        "y": birth_year,
        "dy": death_year,
        "bp": birth_place.strip() or None,
        "dp": death_place.strip() or None,
        "lw": life_waypoints,
        "p": img_url,
        "titl": title_joined or None,
        "notes": note_blob or None,
        "sour_n": sour_n,
    }
    if occu_parts:
        out["occu"] = occu_parts
    if burial_place.strip():
        out["burp"] = burial_place.strip()
    if birth_type:
        out["btyp"] = birth_type
    if death_cause:
        out["dc"] = death_cause
    gp = extract_genetic_partner_xrefs(note_parts)
    if gp:
        out["genetic_partners"] = gp
    return out


def parse_fam(block: list[str]) -> dict | None:
    m = xref_re.match(block[0])
    if not m or m.group(3) != "FAM":
        return None
    fid = m.group(1)
    husb = wife = ""
    chil: list[str] = []
    i = 1
    while i < len(block):
        line = block[i]
        parts = line.split(None, 2)
        if len(parts) < 2:
            i += 1
            continue
        tag = parts[1]
        rest = parts[2].strip() if len(parts) > 2 else ""
        if tag == "HUSB" and rest.startswith("@"):
            husb = rest
        elif tag == "WIFE" and rest.startswith("@"):
            wife = rest
        elif tag == "CHIL" and rest.startswith("@"):
            chil.append(rest)
        i += 1
    return {"id": fid, "husb": husb, "wife": wife, "chil": chil}


def parse_fam_events(block: list[str]) -> dict | None:
    """MARR/DIV place + optional year for attaching to spouses."""
    m = xref_re.match(block[0])
    if not m or m.group(3) != "FAM":
        return None
    husb = wife = ""
    events: list[dict] = []
    cur: str | None = None  # "marr" | "div"
    plac = ""
    date_s = ""

    def flush() -> None:
        nonlocal cur, plac, date_s
        if not cur or not plac.strip():
            cur = None
            plac = date_s = ""
            return
        y = first_year_from_date_payload(date_s)
        ev: dict = {"k": cur, "pl": plac.strip()}
        if y is not None:
            ev["y"] = y
        events.append(ev)
        cur = None
        plac = date_s = ""

    i = 1
    while i < len(block):
        line = block[i]
        if not line or line[0] not in "0123456789":
            i += 1
            continue
        parts = line.split(None, 2)
        if len(parts) < 2:
            i += 1
            continue
        try:
            level = int(parts[0])
        except ValueError:
            i += 1
            continue
        tag = parts[1]
        rest = parts[2] if len(parts) > 2 else ""
        if level == 1:
            flush()
            if tag == "HUSB" and rest.strip().startswith("@"):
                husb = rest.strip()
            elif tag == "WIFE" and rest.strip().startswith("@"):
                wife = rest.strip()
            elif tag == "MARR":
                cur = "marr"
            elif tag == "DIV":
                cur = "div"
        elif level == 2 and cur:
            if tag == "PLAC":
                plac = rest.strip()
            elif tag == "DATE":
                date_s = rest.strip()
        i += 1
    flush()
    return {"husb": husb, "wife": wife, "events": events}


def attach_fam_events_to_individuals(individuals: dict[str, dict], fam_block: list[str]) -> None:
    row = parse_fam_events(fam_block)
    if not row or not row.get("events"):
        return
    for pid in (row.get("husb") or "", row.get("wife") or ""):
        if not pid.startswith("@") or pid not in individuals:
            continue
        for ev in row["events"]:
            individuals[pid].setdefault("ev", []).append(dict(ev))


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__, file=sys.stderr)
        return 1
    ged_path = Path(sys.argv[1]).expanduser()
    out_path = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("tree.json")
    if not ged_path.is_file():
        print(f"GED file not found: {ged_path}", file=sys.stderr)
        print("", file=sys.stderr)
        print(
            'Replace the first argument with the path to your .ged file, e.g.:',
            file=sys.stderr,
        )
        print(
            '  python3 tools/ged_export.py "/Users/tref/Desktop/Fortner_ Clements Family Tree.ged" public/tree.json',
            file=sys.stderr,
        )
        return 1
    text = ged_path.read_text(encoding="utf-8", errors="replace")
    lines = text.splitlines()
    blocks = split_records(lines)
    individuals: dict[str, dict] = {}
    families: dict[str, dict] = {}
    fam_blocks: list[list[str]] = []
    rulers_out: list[dict] = []
    for block in blocks:
        if not block:
            continue
        indi = parse_indi(block)
        if indi:
            rec = {
                "n": indi["name"],
                "s": indi["sex"],
                "c": indi["famc"][0] if indi["famc"] else "",
                "m": indi["fams"],
            }
            if indi.get("y") is not None:
                rec["y"] = indi["y"]
            if indi.get("p"):
                rec["p"] = indi["p"]
            if indi.get("dy") is not None:
                rec["dy"] = indi["dy"]
            if indi.get("bp"):
                rec["bp"] = indi["bp"]
            if indi.get("dp"):
                rec["dp"] = indi["dp"]
            lw = indi.get("lw") or []
            if lw:
                rec["lw"] = lw
            if indi.get("occu"):
                rec["occu"] = indi["occu"]
            if indi.get("burp"):
                rec["burp"] = indi["burp"]
            if indi.get("btyp"):
                rec["btyp"] = indi["btyp"]
            if indi.get("dc"):
                rec["dc"] = indi["dc"]
            if indi.get("genetic_partners"):
                rec["gp"] = indi["genetic_partners"]
            individuals[indi["id"]] = rec

            scan = f"{indi['name'] or ''} {indi.get('titl') or ''} {indi.get('notes') or ''}"
            if RULER_RE.search(scan):
                bp = indi.get("bp") or ""
                dp = indi.get("dp") or ""
                co = guess_realm(bp or dp)
                nb = indi.get("notes") or ""
                tb = indi.get("titl") or ""
                st = stat_counts(nb + " " + tb)
                cy = indi.get("y")
                century = (cy // 100) if isinstance(cy, int) else None
                scan_blob = f"{nb} {tb}".strip()
                wy = war_context_years(scan_blob)
                row: dict = {
                    "id": indi["id"],
                    "n": indi["name"],
                    "t": indi.get("titl"),
                    "co": co,
                    "bp": indi.get("bp"),
                    "dp": indi.get("dp"),
                    "y": indi.get("y"),
                    "dy": indi.get("dy"),
                    "st": st,
                    "src": indi.get("sour_n", 0),
                    "sn": extract_snippets(nb, tb),
                    "c": century,
                }
                if wy:
                    row["wy"] = wy
                rulers_out.append(row)
            continue
        fam = parse_fam(block)
        if fam:
            families[fam["id"]] = {
                "h": fam["husb"],
                "w": fam["wife"],
                "k": fam["chil"],
            }
            fam_blocks.append(block)
    for fb in fam_blocks:
        attach_fam_events_to_individuals(individuals, fb)

    # Enrich ruler rows with life path / civil events (after FAM events are attached).
    for row in rulers_out:
        pid = row.get("id")
        if not isinstance(pid, str) or pid not in individuals:
            continue
        ind = individuals[pid]
        lw = ind.get("lw")
        if isinstance(lw, list) and len(lw) > 1:
            row["lw"] = lw
        if ind.get("ev"):
            row["ev"] = ind["ev"]
        if ind.get("occu"):
            row["occu"] = ind["occu"]
        if ind.get("burp"):
            row["burp"] = ind["burp"]

    payload = {
        "source": str(ged_path),
        "individuals": individuals,
        "families": families,
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {out_path} ({len(individuals)} individuals, {len(families)} families)")

    rulers_path = out_path.with_name("rulers.json")
    rulers_payload = {
        "source": str(ged_path),
        "hint": "Heuristic ruler/title detection + keyword counts; wy = years near war/battle words in notes/titles (not verified). Each row may include lw (birth→residences→death), ev (MARR/DIV places from FAM), occu, burp when present in GED.",
        "count": len(rulers_out),
        "people": sorted(rulers_out, key=lambda r: (r["co"], (r["n"] or "").lower())),
    }
    rulers_path.write_text(json.dumps(rulers_payload, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {rulers_path} ({len(rulers_out)} ruler/title matches)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
