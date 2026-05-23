import { MapView, MapScopeSelect, mapScopeSupportsConnectLine, mapScopeSupportsPartnersToggle, type MapScope } from "./MapView";
import type { FamRec, IndiRec } from "./types";
import type { PartnerOverlayMap } from "./partnerOverlayStorage";

type Props = {
  rootId: string;
  rootLabel: string;
  compareLabel: string;
  individuals: Record<string, IndiRec>;
  families: Record<string, FamRec>;
  patIds: string[];
  matIds: string[];
  mapScope: MapScope;
  onMapScopeChange: (s: MapScope) => void;
  mapConnectLine: boolean;
  onMapConnectLineChange: (v: boolean) => void;
  mapIncludePartners: boolean;
  onMapIncludePartnersChange: (v: boolean) => void;
  partnerOverlay?: PartnerOverlayMap;
};

export function MobileMapPage({
  rootId,
  rootLabel,
  compareLabel,
  individuals,
  families,
  patIds,
  matIds,
  mapScope,
  onMapScopeChange,
  mapConnectLine,
  onMapConnectLineChange,
  mapIncludePartners,
  onMapIncludePartnersChange,
  partnerOverlay,
}: Props) {
  return (
    <div className="mobile-map-page" role="main" aria-label="Life path map">
      <div className="mobile-map-page-toolbar">
        <div className="mobile-root-bar mono mobile-map-page-roots">
          <span>
            Root <strong>{rootLabel}</strong>
          </span>
          <span>
            Compare <strong>{compareLabel}</strong>
          </span>
        </div>
        <label className="mobile-map-scope mobile-map-scope--page">
          <span>Plot</span>
          <MapScopeSelect value={mapScope} onChange={onMapScopeChange} />
        </label>
        {mapScopeSupportsConnectLine(mapScope) && (
          <label className="mobile-map-chk">
            <input
              type="checkbox"
              checked={mapConnectLine}
              onChange={(e) => onMapConnectLineChange(e.target.checked)}
            />
            <span>Connect line</span>
          </label>
        )}
        {mapScopeSupportsPartnersToggle(mapScope) && (
          <label className="mobile-map-chk">
            <input
              type="checkbox"
              checked={mapIncludePartners}
              onChange={(e) => onMapIncludePartnersChange(e.target.checked)}
            />
            <span>Partners</span>
          </label>
        )}
      </div>
      <MapView
        individuals={individuals}
        families={families}
        rootId={rootId}
        patIds={patIds}
        matIds={matIds}
        scope={mapScope}
        connectLine={mapConnectLine}
        includePartners={mapIncludePartners}
        partnerOverlay={partnerOverlay}
        embed={false}
        fullPage
        showFoot={false}
      />
    </div>
  );
}

