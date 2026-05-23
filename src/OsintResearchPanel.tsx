import { OsintWorkbench } from "./OsintWorkbench";

type Props = {
  defaultOpen?: boolean;
};

/**
 * Desktop / non-home OSINT strip — deep search hub with rolling launcher cycle.
 */
export function OsintResearchPanel({ defaultOpen = false }: Props) {
  return (
    <details className="osint-research panel" open={defaultOpen}>
      <summary>Open research — deep search / OSINT (browser only)</summary>
      <div className="osint-research-body">
        <OsintWorkbench autoCycle />
      </div>
    </details>
  );
}
