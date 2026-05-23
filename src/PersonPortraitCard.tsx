import type { PersonCardView } from "./personCardModel";
import { PortraitHero } from "./PortraitHero";

type Props = {
  card: PersonCardView;
  dragX?: number;
  compact?: boolean;
  medium?: boolean;
  active?: boolean;
  onActivate?: () => void;
};

export function PersonPortraitCard({
  card,
  dragX = 0,
  compact = false,
  medium = false,
  active = true,
  onActivate,
}: Props) {
  const rot = Math.max(-12, Math.min(12, dragX * 0.04));
  const style =
    active && dragX !== 0
      ? { transform: `translate3d(${dragX}px, 0, 0) rotate(${rot}deg)` }
      : undefined;

  const portraitSize = compact ? "thumb" : medium ? "medium" : "hero";
  const showExtra = !compact && !medium;
  const cls = `person-card ${compact ? "person-card--compact" : ""} ${medium ? "person-card--medium" : ""} ${card.bandClass}`;

  const body = (
    <>
      <PortraitHero url={card.photoUrl} name={card.name} bandClass={card.bandClass} size={portraitSize} />
      <div className="person-card-body">
        <p className="person-card-tagline">{card.tagline}</p>
        <h3 className="person-card-name">{card.name}</h3>
        <p className="person-card-meta mono">
          {card.id}
          {card.sex ? ` · ${card.sex}` : ""}
        </p>
        {showExtra && card.lifePlaces.length > 0 && (
          <p className="person-card-places muted">{card.lifePlaces.join(" → ")}</p>
        )}
        {showExtra && card.occupations.length > 0 && (
          <p className="person-card-occu muted">{card.occupations.join(" · ")}</p>
        )}
        {showExtra && card.partners.length > 0 && (
          <ul className="person-card-partners">
            {card.partners.slice(0, 4).map((p) => (
              <li key={p.id}>
                <span className="person-card-partner-name">{p.name}</span>
                <span className="person-card-partner-via mono">{p.via}</span>
              </li>
            ))}
            {card.partners.length > 4 && <li className="muted">+{card.partners.length - 4} more</li>}
          </ul>
        )}
      </div>
    </>
  );

  if (onActivate) {
    return (
      <button type="button" className={cls} style={style} onClick={onActivate} aria-label={card.name}>
        {body}
      </button>
    );
  }

  return (
    <article className={cls} style={style} aria-label={card.name}>
      {body}
    </article>
  );
}
