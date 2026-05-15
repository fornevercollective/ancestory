export type IndiRec = {
  n: string;
  s: string;
  c: string;
  m: string[];
  /** Birth year from first BIRT.DATE in GEDCOM, when parsed */
  y?: number;
  /** First OBJE/FILE image URL from GEDCOM (compact key `p`) */
  p?: string;
  /** Birth place (first BIRT.PLAC) */
  bp?: string;
  /** Death place (first DEAT.PLAC) */
  dp?: string;
  /** Ordered life waypoints: birth, residences, death */
  lw?: string[];
  /** Death year from first DEAT.DATE */
  dy?: number;
  /** First DEAT.CAUSE in GEDCOM (free text; varies by program) */
  dc?: string;
  /** BIRT.TYPE (e.g. stillborn) — not hospital unless your GED encodes it there */
  btyp?: string;
  /** BURI.PLAC */
  burp?: string;
  /** OCCU lines (job titles; usually no place) */
  occu?: string[];
  /** Family events from FAM (MARR/DIV with place when present) */
  ev?: { k: "marr" | "div"; pl: string; y?: number }[];
  /** Extra sexual/genetic partners from GED NOTE lines (see ged_export.py); not FAMS spouses */
  gp?: string[];
};
export type FamRec = { h: string; w: string; k: string[] };

export type TreePayload = {
  source: string;
  individuals: Record<string, IndiRec>;
  families: Record<string, FamRec>;
};
