import { RulersView } from "./RulersView";

type Props = {
  rulersJsonUrl: string;
  onOpenInDual?: (id: string) => void;
};

/** Same rulers UI as the main tab, with a visible QA banner (used from `/rulers-test`). */
export function RulersPageTest({ rulersJsonUrl, onOpenInDual }: Props) {
  return (
    <div className="rulers-test-root">
      <div className="rulers-test-banner" role="status">
        TEST — same view as &ldquo;Rulers &amp; realms&rdquo;; use the full app link above to exit.
      </div>
      <RulersView rulersJsonUrl={rulersJsonUrl} onOpenInDual={onOpenInDual} />
    </div>
  );
}
