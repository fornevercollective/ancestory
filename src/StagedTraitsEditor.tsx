import type { IndiRec } from "./types";
import {
  EYE_OPTIONS,
  HAIR_OPTIONS,
  LIFE_STAGES,
  type EyeTrait,
  type HairTrait,
  type LifeStage,
  type StagedPhenotype,
} from "./stagedTraitStorage";
import { formatName } from "./trace";

type Props = {
  id: string;
  individuals: Record<string, IndiRec>;
  trait: StagedPhenotype | undefined;
  setStageEye: (id: string, stage: LifeStage, v: EyeTrait) => void;
  setStageHair: (id: string, stage: LifeStage, v: HairTrait) => void;
};

export function StagedTraitsEditor({ id, individuals, trait, setStageEye, setStageHair }: Props) {
  const eyes = trait?.eyes ?? {};
  const hair = trait?.hair ?? {};
  return (
    <div className="staged-trait-block" aria-label={`Eye and hair by life stage for ${id}`}>
      <div className="staged-trait-head">
        <span className="mono staged-trait-id">{id}</span>
        <span className="staged-trait-name">{formatName(id, individuals)}</span>
      </div>
      <table className="staged-trait-grid">
        <thead>
          <tr>
            <th scope="col">Life stage</th>
            <th scope="col">Eyes</th>
            <th scope="col">Hair</th>
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
                  value={eyes[key] ?? ""}
                  onChange={(e) => setStageEye(id, key, e.target.value as EyeTrait)}
                  aria-label={`Eye color ${label}`}
                >
                  {EYE_OPTIONS.map((o) => (
                    <option key={o.value || "empty"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </td>
              <td>
                <select
                  className="sel staged-trait-sel"
                  value={hair[key] ?? ""}
                  onChange={(e) => setStageHair(id, key, e.target.value as HairTrait)}
                  aria-label={`Hair color ${label}`}
                >
                  {HAIR_OPTIONS.map((o) => (
                    <option key={o.value || "empty-h"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
