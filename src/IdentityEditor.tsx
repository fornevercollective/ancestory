import type { IndiRec } from "./types";
import {
  GENDER_OPTIONS,
  LIFE_STAGES,
  ORIENTATION_OPTIONS,
  PRONOUN_OPTIONS,
  type GenderIdentity,
  type LifeStage,
  type PronounsOption,
  type StagedPhenotype,
} from "./stagedTraitStorage";
import { formatName } from "./trace";

type Props = {
  id: string;
  individuals: Record<string, IndiRec>;
  trait: StagedPhenotype | undefined;
  setPronouns: (id: string, v: PronounsOption) => void;
  setStageGender: (id: string, stage: LifeStage, v: GenderIdentity) => void;
  toggleOrientation: (id: string, slug: string) => void;
};

export function IdentityEditor({ id, individuals, trait, setPronouns, setStageGender, toggleOrientation }: Props) {
  const gender = trait?.gender ?? {};
  const ori = new Set(trait?.orientations ?? []);

  return (
    <div className="identity-editor" aria-label={`Identity and orientation for ${id}`}>
      <p className="identity-editor-lead muted">
        Self-defined labels only — not from GEDCOM. Two-Spirit (2S) appears here as a{" "}
        <strong>gender / community</strong> option; attraction patterns are separate checkboxes. Use partner list +
        relation tags to map a <strong>sexual / genetic network</strong> for narrative (not automatic DNA inference).
      </p>
      <div className="identity-editor-head">
        <span className="mono">{id}</span>
        <span>{formatName(id, individuals)}</span>
      </div>
      <label className="identity-field">
        <span>Pronouns</span>
        <select
          className="sel identity-pronoun-sel"
          value={trait?.pronouns ?? ""}
          onChange={(e) => setPronouns(id, e.target.value as PronounsOption)}
          aria-label="Pronouns"
        >
          {PRONOUN_OPTIONS.map((o) => (
            <option key={o.value || "p"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <h4 className="identity-subh">Gender journey (by life stage)</h4>
      <table className="staged-trait-grid identity-gender-grid">
        <thead>
          <tr>
            <th scope="col">Life stage</th>
            <th scope="col">Gender identity</th>
          </tr>
        </thead>
        <tbody>
          {LIFE_STAGES.map(({ key, label }) => (
            <tr key={key}>
              <th scope="row" className="staged-trait-stage">
                {label}
              </th>
              <td>
                <select
                  className="sel staged-trait-sel"
                  value={gender[key] ?? ""}
                  onChange={(e) => setStageGender(id, key, e.target.value as GenderIdentity)}
                  aria-label={`Gender ${label}`}
                >
                  {GENDER_OPTIONS.map((o) => (
                    <option key={o.value || "g"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4 className="identity-subh">Attraction / orientation (multi-select)</h4>
      <div className="identity-orient-grid" role="group" aria-label="Orientation checkboxes">
        {ORIENTATION_OPTIONS.map(({ slug, label }) => (
          <label key={slug} className="identity-orient-opt">
            <input type="checkbox" checked={ori.has(slug)} onChange={() => toggleOrientation(id, slug)} />
            <span>{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
