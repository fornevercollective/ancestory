import type { ABO, BloodStored, Rh } from "./bloodStorage";
import type { FaceShape } from "./faceShapeStorage";

type Props = {
  id: string;
  blood: BloodStored;
  face: FaceShape;
  setBlood: (id: string, patch: Partial<BloodStored>) => void;
  setFace: (id: string, shape: FaceShape) => void;
  /** Tighter layout for dual table cells */
  compact?: boolean;
};

export function PhenotypeSelects({ id, blood, face, setBlood, setFace, compact }: Props) {
  const wrap = compact ? "dual-pheno dual-pheno--compact" : "blood-row-picks";
  const pickCls = compact ? "dual-pheno-lbl" : "blood-pick";
  const sel = compact ? "sel blood-sel dual-pheno-sel" : "sel blood-sel";
  const selWide = compact ? "sel blood-sel blood-sel-wide dual-pheno-sel" : "sel blood-sel blood-sel-wide";
  return (
    <div className={wrap}>
      <label className={pickCls}>
        {!compact && <span className="blood-field-lbl">ABO</span>}
        <select
          className={sel}
          value={blood.abo}
          onChange={(e) => setBlood(id, { abo: e.target.value as ABO })}
          aria-label={`ABO for ${id}`}
        >
          <option value="">{compact ? "—" : "ABO —"}</option>
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="AB">AB</option>
          <option value="O">O</option>
        </select>
      </label>
      <label className={pickCls}>
        {!compact && <span className="blood-field-lbl">Rh</span>}
        <select
          className={sel}
          value={blood.rh}
          onChange={(e) => setBlood(id, { rh: e.target.value as Rh })}
          aria-label={`Rh for ${id}`}
        >
          <option value="">{compact ? "—" : "Rh —"}</option>
          <option value="+">+</option>
          <option value="-">−</option>
        </select>
      </label>
      <label className={pickCls}>
        {!compact && <span className="blood-field-lbl">Face</span>}
        <select
          className={selWide}
          value={face}
          onChange={(e) => setFace(id, e.target.value as FaceShape)}
          aria-label={`Face shape for ${id}`}
        >
          <option value="">{compact ? "—" : "Shape —"}</option>
          <option value="oval">Oval</option>
          <option value="round">Round</option>
          <option value="square">Square</option>
          <option value="heart">Heart</option>
          <option value="diamond">Diamond</option>
          <option value="rectangle">Rectangle / oblong</option>
          <option value="triangle">Triangle / pear</option>
        </select>
      </label>
    </div>
  );
}
