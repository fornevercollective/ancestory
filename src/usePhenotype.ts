import { useCallback, useEffect, useState } from "react";
import { loadBloodMap, saveBloodMap, type ABO, type BloodStored, type Rh } from "./bloodStorage";
import { loadFaceMap, saveFaceMap, type FaceShape } from "./faceShapeStorage";
import {
  loadTraitMap,
  saveTraitMap,
  traitRecordIsEmpty,
  type EyeTrait,
  type GenderIdentity,
  type HairTrait,
  type LifeStage,
  type PronounsOption,
  type StagedPhenotype,
} from "./stagedTraitStorage";

function emptyTrait(): StagedPhenotype {
  return { eyes: {}, hair: {} };
}

export function usePhenotype(jsonUrl: string) {
  const [bloodMap, setBloodMap] = useState<Record<string, BloodStored>>({});
  const [faceMap, setFaceMap] = useState<Record<string, FaceShape>>({});
  const [traitMap, setTraitMap] = useState<Record<string, StagedPhenotype>>({});

  useEffect(() => {
    if (!jsonUrl) {
      setBloodMap({});
      setFaceMap({});
      setTraitMap({});
      return;
    }
    setBloodMap(loadBloodMap(jsonUrl));
    setFaceMap(loadFaceMap(jsonUrl));
    setTraitMap(loadTraitMap(jsonUrl));
  }, [jsonUrl]);

  useEffect(() => {
    if (!jsonUrl) return;
    const t = window.setTimeout(() => saveBloodMap(jsonUrl, bloodMap), 400);
    return () => window.clearTimeout(t);
  }, [jsonUrl, bloodMap]);

  useEffect(() => {
    if (!jsonUrl) return;
    const t = window.setTimeout(() => saveFaceMap(jsonUrl, faceMap), 400);
    return () => window.clearTimeout(t);
  }, [jsonUrl, faceMap]);

  useEffect(() => {
    if (!jsonUrl) return;
    const t = window.setTimeout(() => saveTraitMap(jsonUrl, traitMap), 400);
    return () => window.clearTimeout(t);
  }, [jsonUrl, traitMap]);

  const setBlood = useCallback((id: string, patch: Partial<BloodStored>) => {
    setBloodMap((prev) => {
      const cur = prev[id] ?? { abo: "" as ABO, rh: "" as Rh };
      return { ...prev, [id]: { ...cur, ...patch } };
    });
  }, []);

  const setFace = useCallback((id: string, shape: FaceShape) => {
    setFaceMap((prev) => {
      const next = { ...prev };
      if (!shape) delete next[id];
      else next[id] = shape;
      return next;
    });
  }, []);

  const setStageEye = useCallback(
    (id: string, stage: LifeStage, v: EyeTrait) => {
      setTraitMap((prev) => {
        const cur = { ...(prev[id] ?? emptyTrait()) };
        const eyes = { ...cur.eyes };
        if (!v) delete eyes[stage];
        else eyes[stage] = v;
        const rec: StagedPhenotype = { ...cur, eyes };
        const next = { ...prev };
        if (traitRecordIsEmpty(rec)) delete next[id];
        else next[id] = rec;
        return next;
      });
    },
    []
  );

  const setStageHair = useCallback(
    (id: string, stage: LifeStage, v: HairTrait) => {
      setTraitMap((prev) => {
        const cur = { ...(prev[id] ?? emptyTrait()) };
        const hair = { ...cur.hair };
        if (!v) delete hair[stage];
        else hair[stage] = v;
        const rec: StagedPhenotype = { ...cur, hair };
        const next = { ...prev };
        if (traitRecordIsEmpty(rec)) delete next[id];
        else next[id] = rec;
        return next;
      });
    },
    []
  );

  const setPronouns = useCallback(
    (id: string, v: PronounsOption) => {
      setTraitMap((prev) => {
        const cur = { ...(prev[id] ?? emptyTrait()) };
        const rec: StagedPhenotype = { ...cur };
        if (!v) delete rec.pronouns;
        else rec.pronouns = v;
        const next = { ...prev };
        if (traitRecordIsEmpty(rec)) delete next[id];
        else next[id] = rec;
        return next;
      });
    },
    []
  );

  const setStageGender = useCallback(
    (id: string, stage: LifeStage, v: GenderIdentity) => {
      setTraitMap((prev) => {
        const cur = { ...(prev[id] ?? emptyTrait()) };
        const gender = { ...(cur.gender ?? {}) };
        if (!v) delete gender[stage];
        else gender[stage] = v;
        const rec: StagedPhenotype = { ...cur, gender };
        if (Object.keys(gender).length === 0) delete rec.gender;
        const next = { ...prev };
        if (traitRecordIsEmpty(rec)) delete next[id];
        else next[id] = rec;
        return next;
      });
    },
    []
  );

  const toggleOrientation = useCallback((id: string, slug: string) => {
    setTraitMap((prev) => {
      const cur = { ...(prev[id] ?? emptyTrait()) };
      const list = [...(cur.orientations ?? [])];
      const i = list.indexOf(slug);
      if (i >= 0) list.splice(i, 1);
      else list.push(slug);
      const rec: StagedPhenotype = { ...cur };
      if (list.length === 0) delete rec.orientations;
      else rec.orientations = list;
      const next = { ...prev };
      if (traitRecordIsEmpty(rec)) delete next[id];
      else next[id] = rec;
      return next;
    });
  }, []);

  return {
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
  };
}
