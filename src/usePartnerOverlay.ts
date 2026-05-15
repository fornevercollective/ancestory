import { useCallback, useEffect, useState } from "react";
import {
  loadPartnerOverlay,
  normalizePartnerEntry,
  savePartnerOverlay,
  type PartnerEntry,
  type PartnerOverlayMap,
} from "./partnerOverlayStorage";

export function usePartnerOverlay(jsonUrl: string) {
  const [partnerOverlay, setPartnerOverlay] = useState<PartnerOverlayMap>({});

  useEffect(() => {
    if (!jsonUrl) {
      setPartnerOverlay({});
      return;
    }
    setPartnerOverlay(loadPartnerOverlay(jsonUrl));
  }, [jsonUrl]);

  useEffect(() => {
    if (!jsonUrl) return;
    const t = window.setTimeout(() => savePartnerOverlay(jsonUrl, partnerOverlay), 400);
    return () => window.clearTimeout(t);
  }, [jsonUrl, partnerOverlay]);

  const removePartner = useCallback((personId: string, index: number) => {
    setPartnerOverlay((prev) => {
      const cur = [...(prev[personId] ?? [])];
      cur.splice(index, 1);
      const next = { ...prev };
      if (cur.length === 0) delete next[personId];
      else next[personId] = cur;
      return next;
    });
  }, []);

  const addPartner = useCallback((personId: string, partnerXref: string) => {
    const id = partnerXref.trim();
    if (!id.startsWith("@") || id === personId) return;
    setPartnerOverlay((prev) => {
      const cur = (prev[personId] ?? [])
        .map((x) => normalizePartnerEntry(x))
        .filter((x): x is PartnerEntry => Boolean(x));
      if (cur.some((e) => e.id === id)) return prev;
      return { ...prev, [personId]: [...cur, { id }] };
    });
  }, []);

  const updatePartnerEntry = useCallback(
    (personId: string, index: number, patch: Partial<Pick<PartnerEntry, "relation" | "notes">>) => {
      setPartnerOverlay((prev) => {
        const cur = [...(prev[personId] ?? [])];
        const row = normalizePartnerEntry(cur[index]);
        if (!row) return prev;
        cur[index] = {
          ...row,
          ...patch,
          id: row.id,
          relation: patch.relation !== undefined ? patch.relation || undefined : row.relation,
          notes: patch.notes !== undefined ? patch.notes || undefined : row.notes,
        };
        return { ...prev, [personId]: cur };
      });
    },
    []
  );

  return { partnerOverlay, setPartnerOverlay, addPartner, removePartner, updatePartnerEntry };
}
