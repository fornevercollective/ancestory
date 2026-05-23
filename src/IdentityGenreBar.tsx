import { IDENTITY_GENRES, type IdentityGenre } from "./identityFilter";

type Props = {
  value: IdentityGenre;
  onChange: (g: IdentityGenre) => void;
};

export function IdentityGenreBar({ value, onChange }: Props) {
  return (
    <div
      className="identity-genre-bar"
      role="radiogroup"
      aria-label="Filter people by self-identified 2SLGBTQI+ genre"
    >
      {IDENTITY_GENRES.map((g) => {
        const active = g.id === value;
        return (
          <button
            key={g.id}
            type="button"
            role="radio"
            aria-checked={active}
            className={`identity-genre-chip ${active ? "identity-genre-chip--active" : ""}`}
            data-genre={g.id}
            onClick={() => onChange(g.id)}
            title={g.label}
            style={
              active
                ? { borderColor: g.accent, color: g.accent, boxShadow: `0 0 0 1px ${g.accent}40` }
                : undefined
            }
          >
            <span className="identity-genre-chip-icon" aria-hidden="true">
              {g.icon}
            </span>
            <span className="identity-genre-chip-label">{g.short}</span>
          </button>
        );
      })}
    </div>
  );
}
