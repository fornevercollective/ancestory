import { useCallback, useEffect, useState } from "react";
import { MobileFooterMenu, type FooterActiveId, type MobileSectionId } from "./MobileFooterMenu";
import { MobileMapPage } from "./MobileMapPage";
import { MobileOnePage, type LinesTab } from "./MobileOnePage";
import type { StreamFanRow } from "./DualFanChart";
import type { FamRec, IndiRec } from "./types";
import type { PartnerOverlayMap } from "./partnerOverlayStorage";
import type { BloodStored } from "./bloodStorage";
import type { FaceShape } from "./faceShapeStorage";
import type { MapScope } from "./MapView";
import type { StagedPhenotype } from "./stagedTraitStorage";
import type { IdentityGenre } from "./identityFilter";

export type MobileHomeView = "lines" | "map";

type Props = {
  rootId: string;
  rootLabel: string;
  compareLabel: string;
  dualMode: "pat-mat" | "pat-pat" | "quad";
  dualRows: StreamFanRow[];
  vizColumnTitles: string[];
  individuals: Record<string, IndiRec>;
  families: Record<string, FamRec>;
  nameQuery: string;
  onNameQueryChange: (q: string) => void;
  partnerOverlay?: PartnerOverlayMap;
  patIds: string[];
  matIds: string[];
  mapScope: MapScope;
  onMapScopeChange: (s: MapScope) => void;
  mapConnectLine: boolean;
  onMapConnectLineChange: (v: boolean) => void;
  mapIncludePartners: boolean;
  onMapIncludePartnersChange: (v: boolean) => void;
  onSetRoot: (id: string) => void;
  onSetCompare: (id: string) => void;
  onDualModeChange: (m: "pat-mat" | "pat-pat" | "quad") => void;
  sourceLine?: string;
  searchHits: { id: string; name: string }[];
  onTreeText: (text: string) => void;
  onRulersText: (text: string) => void;
  onClearIngest: () => void;
  onIngestError: (msg: string) => void;
  treeFromFile: boolean;
  rulersFromFile: boolean;
  ingestMessage: string | null;
  bloodMap: Record<string, BloodStored>;
  faceMap: Record<string, FaceShape>;
  traitMap: Record<string, StagedPhenotype>;
  identityGenre: IdentityGenre;
  onIdentityGenreChange: (g: IdentityGenre) => void;
};

export function MobileHomeShell(props: Props) {
  const [homeView, setHomeView] = useState<MobileHomeView>("lines");
  const [activeFooter, setActiveFooter] = useState<FooterActiveId>("mobile-layers");
  const [linesTab, setLinesTab] = useState<LinesTab>("dual");

  const openMap = useCallback(() => {
    setHomeView("map");
    setActiveFooter("mobile-map");
  }, []);

  const openLines = useCallback(() => {
    setHomeView("lines");
  }, []);

  const scrollToSection = useCallback((sectionId: string, footer: FooterActiveId) => {
    setHomeView("lines");
    setActiveFooter(footer);
    requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const onSelectSection = useCallback(
    (id: MobileSectionId) => {
      if (id === "mobile-map") {
        openMap();
        return;
      }
      if (id === "mobile-layers") {
        setLinesTab("layers");
        scrollToSection("mobile-lines", "mobile-layers");
        return;
      }
      scrollToSection(id, id);
    },
    [openMap, scrollToSection]
  );

  const onOpenDual = useCallback(() => {
    setLinesTab("dual");
    scrollToSection("mobile-lines", "dual");
  }, [scrollToSection]);

  const onLinesTabChange = useCallback(
    (tab: LinesTab) => {
      setLinesTab(tab);
      setActiveFooter(tab === "dual" ? "dual" : "mobile-layers");
    },
    []
  );

  const onFooterActiveChange = useCallback((id: FooterActiveId) => {
    setActiveFooter(id);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("mobile-map-active", homeView === "map");
    return () => document.documentElement.classList.remove("mobile-map-active");
  }, [homeView]);

  useEffect(() => {
    document.documentElement.dataset.identityGenre = props.identityGenre;
    return () => {
      delete document.documentElement.dataset.identityGenre;
    };
  }, [props.identityGenre]);

  return (
    <>
      {homeView === "map" ? (
        <MobileMapPage
          rootId={props.rootId}
          rootLabel={props.rootLabel}
          compareLabel={props.compareLabel}
          individuals={props.individuals}
          families={props.families}
          patIds={props.patIds}
          matIds={props.matIds}
          mapScope={props.mapScope}
          onMapScopeChange={props.onMapScopeChange}
          mapConnectLine={props.mapConnectLine}
          onMapConnectLineChange={props.onMapConnectLineChange}
          mapIncludePartners={props.mapIncludePartners}
          onMapIncludePartnersChange={props.onMapIncludePartnersChange}
          partnerOverlay={props.partnerOverlay}
        />
      ) : (
        <MobileOnePage
          rootLabel={props.rootLabel}
          compareLabel={props.compareLabel}
          dualMode={props.dualMode}
          dualRows={props.dualRows}
          vizColumnTitles={props.vizColumnTitles}
          individuals={props.individuals}
          families={props.families}
          nameQuery={props.nameQuery}
          partnerOverlay={props.partnerOverlay}
          onSetRoot={props.onSetRoot}
          onSetCompare={props.onSetCompare}
          onDualModeChange={props.onDualModeChange}
          onFooterActiveChange={onFooterActiveChange}
          linesTab={linesTab}
          onLinesTabChange={onLinesTabChange}
          identityGenre={props.identityGenre}
          onIdentityGenreChange={props.onIdentityGenreChange}
        />
      )}

      <MobileFooterMenu
        activeId={homeView === "map" ? "mobile-map" : activeFooter}
        homeView={homeView}
        onSelect={onSelectSection}
        onOpenMap={openMap}
        onOpenLines={openLines}
        nameQuery={props.nameQuery}
        onNameQueryChange={props.onNameQueryChange}
        searchHits={props.searchHits}
        onPickRoot={props.onSetRoot}
        onPickCompare={props.onSetCompare}
        sourceLine={props.sourceLine}
        onTreeText={props.onTreeText}
        onRulersText={props.onRulersText}
        onClearIngest={props.onClearIngest}
        onIngestError={props.onIngestError}
        treeFromFile={props.treeFromFile}
        rulersFromFile={props.rulersFromFile}
        ingestMessage={props.ingestMessage}
        onOpenDual={onOpenDual}
        identityGenre={props.identityGenre}
        onIdentityGenreChange={props.onIdentityGenreChange}
      />
    </>
  );
}
