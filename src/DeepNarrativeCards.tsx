import React from "react";

type Card = {
  id: string;
  title: string;
  subtitle?: string;
  year?: number;
  type: "birth" | "death" | "event" | "ruler" | "partner" | "legendary";
  description?: string;
  onClick?: () => void;
};

type Props = {
  cards: Card[];
  title?: string;
};

/**
 * Deep Narrative Timeline Cards
 * These cards represent key beats in the evolving story.
 * Updated dynamically by search + global time slider.
 */
export function DeepNarrativeCards({ cards, title = "Deep Narrative Beats" }: Props) {
  if (!cards.length) {
    return (
      <div style={{ padding: 16, opacity: 0.6, fontSize: 13 }}>
        Search or adjust the history slider above to surface story cards.
      </div>
    );
  }

  return (
    <div style={{ padding: "12px 16px" }}>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: "#9aa0a6" }}>
        {title} <span style={{ opacity: 0.5 }}>({cards.length})</span>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: 10,
      }}>
        {cards.map((card) => (
          <div
            key={card.id}
            onClick={card.onClick}
            style={{
              background: "#171a20",
              border: "1px solid #2d323c",
              borderRadius: 8,
              padding: 12,
              cursor: card.onClick ? "pointer" : "default",
              transition: "transform 120ms ease, border-color 120ms ease",
            }}
            onMouseEnter={(e) => {
              if (card.onClick) e.currentTarget.style.borderColor = "#5ab0ff";
            }}
            onMouseLeave={(e) => {
              if (card.onClick) e.currentTarget.style.borderColor = "#2d323c";
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{card.title}</div>
                {card.subtitle && (
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{card.subtitle}</div>
                )}
              </div>
              {card.year !== undefined && (
                <div style={{
                  fontSize: 11,
                  background: "#222a38",
                  padding: "1px 6px",
                  borderRadius: 4,
                  whiteSpace: "nowrap",
                  marginLeft: 8,
                }}>
                  {card.year < 0 ? `${Math.abs(card.year)} BCE` : card.year}
                </div>
              )}
            </div>

            {card.description && (
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6, lineHeight: 1.35 }}>
                {card.description}
              </div>
            )}

            <div style={{ marginTop: 8, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.5 }}>
              {card.type}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
