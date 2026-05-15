import { useMemo } from "react";
import type { FamRec, IndiRec } from "./types";
import {
  BLOOD_DIET_EVIDENCE_DISCLAIMER,
  BLOOD_HEALTH_DISCLAIMER,
  dietLoreLines,
  uniqueAbosFromMap,
} from "./bloodDietLore";
import { formatBloodLabel, type ABO, type BloodStored, type Rh } from "./bloodStorage";
import {
  deathAgeBucketPercentages,
  formatBucketLine,
  lineageMortalityProfilePct,
  mergeRollups,
  precursorHintsFromRollup,
  rollupLineageDeaths,
} from "./lineageDeathStats";
import { MorphologyEducation } from "./MorphologyEducation";
import { faceShapeShort, type FaceShape } from "./faceShapeStorage";
import { IdentityEditor } from "./IdentityEditor";
import { StagedTraitsEditor } from "./StagedTraitsEditor";
import { countAdultHair, countBloodByAdultEye, countPronouns, lineagePhenotypeRows } from "./stagedTraitStats";
import {
  eyeLabel,
  genderLabel,
  hairLabel,
  latestStagedEye,
  latestStagedGender,
  latestStagedHair,
  orientationLabels,
  pronounsLabel,
  type EyeTrait,
  type GenderIdentity,
  type HairTrait,
  type LifeStage,
  type PronounsOption,
  type StagedPhenotype,
} from "./stagedTraitStorage";
import { PhenotypeSelects } from "./PhenotypeSelects";
import { fatherId, formatName, matriline, motherId, patriline } from "./trace";

type Props = {
  jsonUrl: string;
  rootId: string;
  maxGenerations: number;
  individuals: Record<string, IndiRec>;
  families: Record<string, FamRec>;
  bloodMap: Record<string, BloodStored>;
  faceMap: Record<string, FaceShape>;
  traitMap: Record<string, StagedPhenotype>;
  setBlood: (id: string, patch: Partial<BloodStored>) => void;
  setFace: (id: string, shape: FaceShape) => void;
  setStageEye: (id: string, stage: LifeStage, v: EyeTrait) => void;
  setStageHair: (id: string, stage: LifeStage, v: HairTrait) => void;
  setPronouns: (id: string, v: PronounsOption) => void;
  setStageGender: (id: string, stage: LifeStage, v: GenderIdentity) => void;
  toggleOrientation: (id: string, slug: string) => void;
};

type Row = { id: string; role: string };

export function BloodMigrationPanel({
  jsonUrl,
  rootId,
  maxGenerations,
  individuals,
  families,
  bloodMap,
  faceMap,
  traitMap,
  setBlood,
  setFace,
  setStageEye,
  setStageHair,
  setPronouns,
  setStageGender,
  toggleOrientation,
}: Props) {
  const rows = useMemo((): Row[] => {
    const fid = fatherId(rootId, individuals, families);
    const mid = motherId(rootId, individuals, families);
    const out: Row[] = [{ id: rootId, role: "Root / child (focus)" }];
    if (fid) out.push({ id: fid, role: "Father (FAMC patriline anchor)" });
    if (mid) out.push({ id: mid, role: "Mother (FAMC matriline anchor)" });
    return out;
  }, [rootId, individuals, families]);

  const patIds = useMemo(
    () => patriline(rootId, individuals, families, maxGenerations),
    [rootId, individuals, families, maxGenerations]
  );
  const matIds = useMemo(
    () => matriline(rootId, individuals, families, maxGenerations),
    [rootId, individuals, families, maxGenerations]
  );

  const patDeath = useMemo(() => rollupLineageDeaths(patIds, individuals), [patIds, individuals]);
  const matDeath = useMemo(() => rollupLineageDeaths(matIds, individuals), [matIds, individuals]);
  const combinedDeath = useMemo(() => mergeRollups(patDeath, matDeath), [patDeath, matDeath]);

  const patProfile = useMemo(() => lineageMortalityProfilePct(patDeath), [patDeath]);
  const matProfile = useMemo(() => lineageMortalityProfilePct(matDeath), [matDeath]);
  const combinedProfile = useMemo(() => lineageMortalityProfilePct(combinedDeath), [combinedDeath]);

  const combinedBucketsPct = useMemo(() => deathAgeBucketPercentages(combinedDeath), [combinedDeath]);
  const precursorHints = useMemo(() => precursorHintsFromRollup(combinedDeath), [combinedDeath]);

  const abosForDiet = useMemo(
    () => uniqueAbosFromMap(
      rows.map((r) => r.id),
      bloodMap
    ),
    [rows, bloodMap]
  );

  const lineageUnion = useMemo(() => {
    const s = new Set<string>();
    for (const id of patIds) s.add(id);
    for (const id of matIds) s.add(id);
    return [...s];
  }, [patIds, matIds]);

  const phenoRows = useMemo(
    () => lineagePhenotypeRows(lineageUnion, individuals, bloodMap, traitMap),
    [lineageUnion, individuals, bloodMap, traitMap]
  );

  const bloodEyeCounts = useMemo(() => countBloodByAdultEye(phenoRows), [phenoRows]);
  const hairCounts = useMemo(() => countAdultHair(phenoRows), [phenoRows]);
  const pronounCounts = useMemo(() => countPronouns(phenoRows), [phenoRows]);

  return (
    <div className="blood-panel" aria-label="Blood type tracking and migration context">
      <details className="blood-panel-card" open>
        <summary className="blood-panel-card-summary blood-panel-h">
          Blood type, face shape &amp; lineage patterns
        </summary>
        <div className="blood-panel-card-pane">
          <p className="blood-panel-lead">
            Blood, face shape, staged eye/hair, pronouns, gender journey, and multi-select orientation are{" "}
            <strong>not</strong> from GEDCOM. Stored in your browser per <span className="mono">tree.json</span> URL.
            Death-age percentages use exported birth/death years only — not medical genetics. Statistics summarize pat
            ∪ mat lineage from these manual fields; partner list + relation tags support an inclusive sexual/genetic
            network map overlay.
          </p>
          <div className="blood-rows">
            {rows.map(({ id, role }) => {
              const b = bloodMap[id] ?? { abo: "" as ABO, rh: "" as Rh };
              const fs = faceMap[id] ?? ("" as FaceShape);
              const tr = traitMap[id];
              const parts = [formatBloodLabel(b), faceShapeShort(fs)].filter(Boolean);
              const le = latestStagedEye(tr);
              const lh = latestStagedHair(tr);
              if (le) parts.push(`${eyeLabel(le)} eyes`);
              if (lh) parts.push(`${hairLabel(lh)} hair`);
              const pr = tr?.pronouns;
              if (pr) parts.push(pronounsLabel(pr));
              const lg = latestStagedGender(tr);
              if (lg) parts.push(genderLabel(lg));
              const or = tr?.orientations;
              if (or?.length) {
                const o = orientationLabels(or);
                parts.push(o.length > 56 ? `${o.slice(0, 53)}…` : o);
              }
              const tag = parts.join(" · ");
              return (
                <div key={id} className="blood-row">
                  <div className="blood-row-id">
                    <span className="blood-role">{role}</span>
                    <span className="mono blood-xref">{id}</span>
                    <span className="blood-name">{formatName(id, individuals)}</span>
                    <span className="blood-display mono">{tag || "—"}</span>
                  </div>
                  <PhenotypeSelects id={id} blood={b} face={fs} setBlood={setBlood} setFace={setFace} />
                  <details className="staged-trait-details">
                    <summary>Eye &amp; hair by life stage (baby → adult)</summary>
                    <StagedTraitsEditor
                      id={id}
                      individuals={individuals}
                      trait={traitMap[id]}
                      setStageEye={setStageEye}
                      setStageHair={setStageHair}
                    />
                  </details>
                  <details className="identity-trait-details">
                    <summary>Pronouns, gender journey &amp; orientation</summary>
                    <IdentityEditor
                      id={id}
                      individuals={individuals}
                      trait={traitMap[id]}
                      setPronouns={setPronouns}
                      setStageGender={setStageGender}
                      toggleOrientation={toggleOrientation}
                    />
                  </details>
                </div>
              );
            })}
          </div>
        </div>
      </details>

      <details className="blood-panel-card blood-pheno-stats">
        <summary className="blood-panel-card-summary">
          Phenotype statistics (pat ∪ mat lineage, browser-entered only)
        </summary>
        <div className="blood-panel-card-pane blood-pheno-stats-body">
          <p className="muted blood-pheno-stats-lead">
            Uses ABO/Rh, staged eyes/hair, pronouns, gender journey, and orientation checkboxes for anyone on pat ∪ mat
            (max gen {maxGenerations}) with at least one field set. “Adult” snapshot uses the latest filled life stage.
            Not genetics — inclusive family notes for charts and storytelling.
          </p>
          {phenoRows.length === 0 ? (
            <p className="muted">No blood, identity, or staged trait data on this lineage yet.</p>
          ) : (
            <>
              <h4 className="blood-lineage-h">Lineage roster</h4>
              <div className="blood-pheno-table-wrap">
                <table className="blood-pheno-table blood-pheno-table--wide">
                  <thead>
                    <tr>
                      <th scope="col">Person</th>
                      <th scope="col">Blood</th>
                      <th scope="col">Pronouns</th>
                      <th scope="col">Gender journey</th>
                      <th scope="col">Orientation</th>
                      <th scope="col">Eyes</th>
                      <th scope="col">Hair</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phenoRows.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <span className="mono">{r.id}</span>
                          <br />
                          {r.name}
                        </td>
                        <td className="mono">{r.blood}</td>
                        <td>{r.pronouns}</td>
                        <td className="blood-pheno-chain">{r.genderChain}</td>
                        <td className="blood-pheno-chain">{r.orientSummary}</td>
                        <td className="blood-pheno-chain">{r.eyeChain}</td>
                        <td className="blood-pheno-chain">{r.hairChain}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="blood-pheno-counts blood-pheno-counts--3">
                <div className="blood-pheno-count-col">
                  <h4 className="blood-lineage-h">Counts: blood × adult eye</h4>
                  <ul className="blood-pheno-count-list">
                    {[...bloodEyeCounts.entries()]
                      .sort((a, b) => b[1] - a[1])
                      .map(([k, n]) => (
                        <li key={k}>
                          <span className="mono">{n}×</span> {k}
                        </li>
                      ))}
                  </ul>
                </div>
                <div className="blood-pheno-count-col">
                  <h4 className="blood-lineage-h">Counts: adult hair</h4>
                  <ul className="blood-pheno-count-list">
                    {[...hairCounts.entries()]
                      .sort((a, b) => b[1] - a[1])
                      .map(([k, n]) => (
                        <li key={k}>
                          <span className="mono">{n}×</span> {k}
                        </li>
                      ))}
                  </ul>
                </div>
                <div className="blood-pheno-count-col">
                  <h4 className="blood-lineage-h">Counts: pronouns</h4>
                  <ul className="blood-pheno-count-list">
                    {[...pronounCounts.entries()]
                      .sort((a, b) => b[1] - a[1])
                      .map(([k, n]) => (
                        <li key={k}>
                          <span className="mono">{n}×</span> {k}
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </details>

      {abosForDiet.length > 0 && (
        <details className="blood-panel-card blood-diet-details">
          <summary className="blood-panel-card-summary">Blood-type diet leaning (popular book lore)</summary>
          <div className="blood-panel-card-pane blood-diet-body">
            <p className="blood-warn">{BLOOD_DIET_EVIDENCE_DISCLAIMER}</p>
            <p className="blood-warn">
              Overview of the idea (not prescriptions):{" "}
              <a href="https://en.wikipedia.org/wiki/Blood_type_diet" target="_blank" rel="noreferrer">
                Blood type diet
              </a>{" "}
              (Wikipedia).
            </p>
            <ul className="blood-diet-list">
              {abosForDiet.map((abo) => {
                const line = dietLoreLines(abo);
                if (!line) return null;
                return (
                  <li key={abo}>
                    <strong className="mono">{abo}</strong>: {line}
                  </li>
                );
              })}
            </ul>
            <p className="blood-diet-keys">
              <strong>Key aspects often quoted:</strong> Type O — high protein, lean meat, fish, poultry; limit dairy
              and grains. Types B &amp; AB — meat allowed, less central than O. Type A — often described as leaning
              vegetarian, limiting red meat. Same caveats as above.
            </p>
          </div>
        </details>
      )}

      <details className="blood-panel-card blood-health-details">
        <summary className="blood-panel-card-summary">
          Health &amp; “proclivity” (population science vs. you)
        </summary>
        <div className="blood-panel-card-pane blood-health-body">
          <p>{BLOOD_HEALTH_DISCLAIMER}</p>
          <p>
            For background on weak statistical links (not personal risk):{" "}
            <a href="https://en.wikipedia.org/wiki/Blood_type#Association_with_diseases" target="_blank" rel="noreferrer">
              Blood type — association with diseases
            </a>{" "}
            (Wikipedia survey). Your tree’s <strong>death ages and causes</strong> below are descriptive genealogy
            only.
          </p>
        </div>
      </details>

      <details className="blood-panel-card blood-lineage-death">
        <summary className="blood-panel-card-summary">
          Lineage death patterns (patriline / matriline, max gen {maxGenerations})
        </summary>
        <div className="blood-panel-card-pane blood-lineage-death-pane">
        <div className="blood-lineage-grid">
          <div className="blood-lineage-col">
            <h4 className="blood-lineage-h">Patriline ({patDeath.nIds} people)</h4>
            <p className="blood-lineage-meta mono">
              With birth+death years: {patDeath.withBothYears} · Unknown age bucket: {patDeath.unknownAge}
            </p>
            <ul className="blood-lineage-buckets">
              {formatBucketLine(patDeath).map((line, i) => (
                <li key={`p-${i}`}>{line}</li>
              ))}
              {formatBucketLine(patDeath).length === 0 && <li className="muted">No dated lifespans in this line.</li>}
            </ul>
            {patDeath.sampleCauses.length > 0 ? (
              <p className="blood-causes">
                <strong>Recorded causes (DEAT.CAUSE, top text):</strong> {patDeath.sampleCauses.join(" · ")}
              </p>
            ) : (
              <p className="blood-causes muted">
                No <span className="mono">DEAT.CAUSE</span> in export — re-run{" "}
                <span className="mono">ged_export.py</span> after adding causes in your GED.
              </p>
            )}
          </div>
          <div className="blood-lineage-col">
            <h4 className="blood-lineage-h">Matriline ({matDeath.nIds} people)</h4>
            <p className="blood-lineage-meta mono">
              With birth+death years: {matDeath.withBothYears} · Unknown age bucket: {matDeath.unknownAge}
            </p>
            <ul className="blood-lineage-buckets">
              {formatBucketLine(matDeath).map((line, i) => (
                <li key={`m-${i}`}>{line}</li>
              ))}
              {formatBucketLine(matDeath).length === 0 && <li className="muted">No dated lifespans in this line.</li>}
            </ul>
            {matDeath.sampleCauses.length > 0 ? (
              <p className="blood-causes">
                <strong>Recorded causes (DEAT.CAUSE, top text):</strong> {matDeath.sampleCauses.join(" · ")}
              </p>
            ) : (
              <p className="blood-causes muted">
                No <span className="mono">DEAT.CAUSE</span> in export — re-run{" "}
                <span className="mono">ged_export.py</span> after adding causes in your GED.
              </p>
            )}
          </div>
        </div>

        <div className="blood-death-pct">
          <h4 className="blood-lineage-h">Death-age “ancestry” profile % (pat + mat, known lifespans only)</h4>
          <p className="blood-pct-lead muted">
            Three coarse shares among people with both <span className="mono">y</span> and{" "}
            <span className="mono">dy</span> on either line (n={combinedProfile.denom}). Not ethnicity and not disease
            heritability.
          </p>
          <div className="blood-pct-grid">
            <div className="blood-pct-card">
              <span className="blood-pct-label">Patriline</span>
              <div className="blood-pct-tri mono">
                Early (&lt;40): {patProfile.earlyLoss}% · Mid (40–64): {patProfile.midLife}% · Late (65+):{" "}
                {patProfile.lateLife}%
              </div>
            </div>
            <div className="blood-pct-card">
              <span className="blood-pct-label">Matriline</span>
              <div className="blood-pct-tri mono">
                Early (&lt;40): {matProfile.earlyLoss}% · Mid (40–64): {matProfile.midLife}% · Late (65+):{" "}
                {matProfile.lateLife}%
              </div>
            </div>
            <div className="blood-pct-card blood-pct-card--combined">
              <span className="blood-pct-label">Combined lines</span>
              <div className="blood-pct-tri mono">
                Early (&lt;40): {combinedProfile.earlyLoss}% · Mid (40–64): {combinedProfile.midLife}% · Late (65+):{" "}
                {combinedProfile.lateLife}%
              </div>
            </div>
          </div>
          {combinedBucketsPct.length > 0 && (
            <div className="blood-bucket-bars">
              <span className="blood-bucket-bars-title">Finer buckets (combined)</span>
              {combinedBucketsPct.map((row) => (
                <div key={row.bucket} className="death-pct-row">
                  <span className="death-pct-lbl mono">
                    {row.shortLabel} ({row.count})
                  </span>
                  <div className="death-pct-track">
                    <span className="death-pct-fill" style={{ width: `${row.pct}%` }} />
                  </div>
                  <span className="death-pct-val mono">{row.pct}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {precursorHints.length > 0 && (
          <div className="blood-precursor">
            <h4 className="blood-lineage-h">Cause-text “precursors” (read the past, not the future)</h4>
            <p className="muted blood-precursor-lead">
              Keyword scan on exported <span className="mono">DEAT.CAUSE</span> strings. For historical storytelling
              only — not a risk score for you or descendants.
            </p>
            <ul className="blood-precursor-list">
              {precursorHints.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </div>
        )}

        <p className="blood-lineage-foot">
          Buckets use exported <span className="mono">y</span> and <span className="mono">dy</span> only. They describe
          the record (era, infant mortality, longevity), not inherited medical fate.
        </p>
        </div>
      </details>

      <MorphologyEducation />

      <details className="blood-panel-card blood-migration-details">
        <summary className="blood-panel-card-summary">Hominins, migrations, and blood types (education)</summary>
        <div className="blood-panel-card-pane blood-migration-body">
          <p>
            <strong>Homo sapiens dispersal.</strong> Our species expanded out of Africa in multiple waves
            over tens of thousands of years; later mixing with Neanderthals and Denisovans left small
            traces in many living people’s genomes — separate from the ABO blood group, but part of the
            same deep story of movement and contact. Overview:{" "}
            <a href="https://en.wikipedia.org/wiki/Early_human_migrations" target="_blank" rel="noreferrer">
              Early human migrations
            </a>
            ; introgression:{" "}
            <a
              href="https://en.wikipedia.org/wiki/Interbreeding_between_archaic_and_modern_humans"
              target="_blank"
              rel="noreferrer"
            >
              Archaic–modern interbreeding
            </a>
            .
          </p>
          <p>
            <strong>ABO / Rh in populations.</strong> The{" "}
            <a href="https://en.wikipedia.org/wiki/ABO_blood_group_system" target="_blank" rel="noreferrer">
              ABO system
            </a>{" "}
            is classic genetics, but allele frequencies still only describe populations — not your
            pedigree route. Regional tables:{" "}
            <a href="https://en.wikipedia.org/wiki/Blood_type_distribution_by_country" target="_blank" rel="noreferrer">
              Blood type distribution by country
            </a>
            . Rh is often taught separately from ABO; clinical typing belongs in a lab.
          </p>
          <p>
            <strong>Why this does not “prove” a migration path.</strong> A blood type label does not
            reconstruct your ancestors’ routes. It can sit beside genealogy and geography as a coarse
            population-genetics curiosity — useful for storytelling, not for diagnosis or tribal identity
            claims.
          </p>
        </div>
      </details>
    </div>
  );
}
