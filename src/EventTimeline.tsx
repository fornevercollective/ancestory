import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { IndiRec } from "./types";
import type { ResearchProposal } from "./researchEnrichmentsStorage";
import { birthYear } from "./timeBands";
import type { PartnerOverlayMap } from "./partnerOverlayStorage";

type Props = {
  individuals: Record<string, IndiRec>;
  patIds: string[];
  matIds: string[];
  proposals?: ResearchProposal[];
  partnerOverlay?: PartnerOverlayMap;
  height?: number;
  /** Major historical / scientific / space / tribal events */
  majorEvents?: Array<{ year: number; label: string; category: "history" | "science" | "space" | "tribal" | "migration" }>;
  /** Callback when user clicks an event (for map highlighting, details, etc.) */
  onEventClick?: (event: { year: number; label: string; type: string; relatedIds?: string[] }) => void;
};

/**
 * Enhanced Horizontal Life + History Timeline (inspired by mueee.qbitos.ai/history.html style).
 * 
 * Supports:
 * - Personal life events (birth, death, partners, travel waypoints)
 * - Sexual / genetic partners (from GED gp + browser overlay)
 * - Connection to major historical, scientific, and space events
 * - Science / history / tribal story overlap
 * - Forward / speculative "out of this planet" connections (via proposals or majorEvents with category "space")
 *
 * This is the deep narrative + sci-fi layer for Ancestory as the 2026+ answer to traditional genealogy.
 */
export function EventTimeline({
  individuals,
  patIds,
  matIds,
  proposals = [],
  partnerOverlay,
  height = 380,
  majorEvents = [],
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!chartRef.current) {
      chartRef.current = echarts.init(containerRef.current, "dark", {
        renderer: "canvas",
      });
    }

    const chart = chartRef.current;
    const events: any[] = [];
    const lines: any[] = [];

    // --- Personal life events + partners + travel ---
    const addPersonStory = (id: string, stream: "pat" | "mat" | "research") => {
      const rec = individuals[id];
      if (!rec) return;

      const name = (rec.n || id).replace(/\//g, "").trim();
      const y = birthYear(rec);
      const dy = rec.dy;

      const baseY = stream === "pat" ? 0 : stream === "mat" ? 1 : 2;

      if (y) {
        events.push({
          name: `${name} — born`,
          value: [y, baseY],
          itemStyle: { color: stream === "pat" ? "#81c784" : stream === "mat" ? "#f06292" : "#ba68c8" },
        });
      }
      if (dy) {
        events.push({
          name: `${name} — died`,
          value: [dy, baseY],
          itemStyle: { color: "#ffb74d" },
        });
      }

      // Life waypoints / travel (lw)
      if (Array.isArray(rec.lw)) {
        rec.lw.forEach((place, idx) => {
          // Rough year estimation from position in life
          const approxYear = y ? y + Math.floor(((dy || y + 80) - y) * (idx / Math.max(1, rec.lw!.length))) : null;
          if (approxYear && place) {
            events.push({
              name: `${name} — ${place}`,
              value: [approxYear, baseY + 0.3],
              itemStyle: { color: "#64b5f6", borderColor: "#64b5f6" },
              symbol: "diamond",
            });
          }
        });
      }

      // Sexual / genetic partners
      const partners: string[] = [];
      if (rec.gp) partners.push(...rec.gp);
      if (partnerOverlay?.[id]) {
        partners.push(...partnerOverlay[id].map((p) => p.id));
      }

      partners.forEach((pid) => {
        const pRec = individuals[pid];
        const pYear = pRec ? birthYear(pRec) : null;
        if (pYear) {
          events.push({
            name: `${name} ↔ ${formatNameShort(pid, individuals)} (partner)`,
            value: [pYear, baseY + 0.6],
            itemStyle: { color: "#ce93d8" },
            symbol: "triangle",
          });
        }
      });
    };

    patIds.slice(0, 20).forEach((id) => addPersonStory(id, "pat"));
    matIds.slice(0, 20).forEach((id) => addPersonStory(id, "mat"));

    // Research proposals as rich events
    proposals
      .filter((p) => p.status === "accepted")
      .forEach((p) => {
        const e = p.extracted;
        const label = p.linkedPerson || "Recovered figure";
        const year = Number(e.y) || Number(e.dy);
        if (year) {
          events.push({
            name: `${label} — ${p.source} record`,
            value: [year, 2.5],
            itemStyle: { color: "#7e57c2" },
          });
        }
        // If proposal mentions space / forward events
        if (e.notes && /space|mars|exoplanet|starship|colony/i.test(e.notes)) {
          events.push({
            name: `${label} — off-world connection`,
            value: [year + 50, 3.2],
            itemStyle: { color: "#00e5ff" },
            symbol: "arrow",
          });
        }
      });

    // Major historical / science / space events (horizontal timeline backbone)
    majorEvents.forEach((evt) => {
      const yPos = evt.category === "space" ? 3.5 : evt.category === "science" ? 3.2 : 2.8;
      events.push({
        name: evt.label,
        value: [evt.year, yPos],
        itemStyle: {
          color: evt.category === "space" ? "#00e5ff" : evt.category === "science" ? "#4fc3f7" : "#ffd54f",
        },
        symbolSize: 10,
      });
    });

    const option: echarts.EChartsOption = {
      backgroundColor: "transparent",
      tooltip: { trigger: "item", confine: true },
      legend: {
        data: ["Patriline", "Matriline", "Partners & Travel", "Research / History", "Science & Space"],
        textStyle: { color: "#aaa", fontSize: 11 },
      },
      xAxis: {
        type: "value",
        name: "Year (deep time → future)",
        nameTextStyle: { color: "#888" },
        axisLabel: { color: "#888", formatter: (v: number) => v.toString() },
        splitLine: { lineStyle: { color: "#333" } },
      },
      yAxis: {
        type: "value",
        min: -0.5,
        max: 4,
        interval: 1,
        axisLabel: {
          color: "#ccc",
          formatter: (val: number) => {
            if (val === 0) return "Patriline";
            if (val === 1) return "Matriline";
            if (val === 2) return "Research";
            if (val === 3) return "History/Science";
            if (val === 3.5) return "Space / Forward";
            return "";
          },
        },
        splitLine: { lineStyle: { color: "#222" } },
      },
      series: [
        {
          name: "Life & Partners",
          type: "scatter",
          symbolSize: (val: any) => (val[1] > 2.5 ? 8 : 11),
          data: events,
          emphasis: { scale: 1.6 },
        },
      ],
      grid: { left: 110, right: 30, top: 40, bottom: 50 },
      dataZoom: [
        { type: "slider", xAxisIndex: 0, bottom: 10 },
        { type: "inside", xAxisIndex: 0 },
      ],
      // Visual era bands — makes the horizontal timeline feel rich and narrative (inspired by mueee-style history tools)
      markArea: {
        silent: true,
        data: [
          [{ name: "Ancient / Pre-History", xAxis: -3000 }, { xAxis: 500 }],
          [{ name: "Medieval", xAxis: 500 }, { xAxis: 1500 }],
          [{ name: "Early Modern", xAxis: 1500 }, { xAxis: 1800 }],
          [{ name: "Industrial + Modern", xAxis: 1800 }, { xAxis: 2000 }],
          [{ name: "Space Age → Future", xAxis: 2000 }, { xAxis: 2100 }],
        ].map((band: any, i) => ({
          name: band[0].name,
          itemStyle: {
            color: i % 2 === 0 ? "rgba(100,181,246,0.06)" : "rgba(186,104,200,0.05)",
          },
          label: {
            show: true,
            position: "insideTop",
            color: "#666",
            fontSize: 10,
          },
        })),
      },
    };

    chart.setOption(option, true);

    // Add click interaction for "make the timeline the star"
    chart.on("click", (params: any) => {
      if (params.data && params.data.name) {
        const year = params.data.value?.[0];
        const label = params.data.name;
        const type = params.seriesName || "event";

        onEventClick?.({
          year,
          label,
          type,
          relatedIds: [], // Future: could resolve related people
        });
      }
    });

    const resize = () => chart.resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chart.off("click");
    };
  }, [individuals, patIds, matIds, proposals, partnerOverlay, majorEvents, onEventClick]);

  return (
    <div className="event-timeline panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ fontWeight: 600 }}>Deep Narrative Timeline — Lives, Partners, History &amp; Beyond</div>
        <div style={{ fontSize: "0.7rem", opacity: 0.6 }}>Horizontal timeline • zoom + pan</div>
      </div>
      <div ref={containerRef} style={{ width: "100%", height }} />
      <div className="muted" style={{ fontSize: "0.72rem", marginTop: 6, lineHeight: 1.3 }}>
        Birth/Death • Genetic &amp; sexual partners • Life travel (lw) • Research proposals • Major historical, scientific &amp; space events.<br />
        This is where personal stories meet deep history and forward possibility.
      </div>
    </div>
  );
}

function formatNameShort(id: string, individuals: Record<string, IndiRec>) {
  const rec = individuals[id];
  if (!rec) return id;
  return (rec.n || id).replace(/\//g, "").split(" ").slice(0, 2).join(" ");
}
