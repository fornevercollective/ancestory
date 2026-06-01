import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import type { IndiRec } from "./types";
import type { ResearchProposal } from "./researchEnrichmentsStorage";
import { birthYear } from "./timeBands";

type Props = {
  individuals: Record<string, IndiRec>;
  patIds: string[];
  matIds: string[];
  proposals?: ResearchProposal[];
  height?: number;
};

/**
 * Life events timeline (Slice 3 of the plan).
 * Shows birth/death + key events from the tree + accepted research proposals.
 * Uses ECharts (already in deps) for rich interactive charting.
 */
export function EventTimeline({
  individuals,
  patIds,
  matIds,
  proposals = [],
  height = 320,
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

    // Build events from pat + mat lines + accepted research proposals
    const events: any[] = [];

    const addPersonEvents = (id: string, stream: "pat" | "mat") => {
      const rec = individuals[id];
      if (!rec) return;

      const name = (rec.n || id).replace(/\//g, "").trim();
      const y = birthYear(rec);
      const dy = rec.dy;

      if (y) {
        events.push({
          name: `${name} born`,
          value: [y, stream === "pat" ? 1 : 0],
          itemStyle: { color: stream === "pat" ? "#81c784" : "#f06292" },
        });
      }
      if (dy) {
        events.push({
          name: `${name} died`,
          value: [dy, stream === "pat" ? 1 : 0],
          itemStyle: { color: "#ffb74d" },
        });
      }
    };

    // Sample the main lines (not every single person for performance)
    patIds.slice(0, 25).forEach((id) => addPersonEvents(id, "pat"));
    matIds.slice(0, 25).forEach((id) => addPersonEvents(id, "mat"));

    // Add accepted research proposals as events
    proposals
      .filter((p) => p.status === "accepted")
      .forEach((p) => {
        const e = p.extracted;
        const label = p.linkedPerson || "Historical figure";
        if (e.y) {
          events.push({
            name: `${label} (research)`,
            value: [Number(e.y) || 0, 2],
            itemStyle: { color: "#ba68c8" },
          });
        }
        if (e.dy) {
          events.push({
            name: `${label} (research)`,
            value: [Number(e.dy) || 0, 2],
            itemStyle: { color: "#ba68c8" },
          });
        }
      });

    const option: echarts.EChartsOption = {
      backgroundColor: "transparent",
      tooltip: { trigger: "item" },
      legend: { data: ["Patriline", "Matriline", "Research"], textStyle: { color: "#ccc" } },
      xAxis: {
        type: "value",
        name: "Year",
        nameTextStyle: { color: "#888" },
        axisLabel: { color: "#888" },
      },
      yAxis: {
        type: "category",
        data: ["Matriline", "Patriline", "Research"],
        axisLabel: { color: "#ccc" },
      },
      series: [
        {
          name: "Events",
          type: "scatter",
          symbolSize: 12,
          data: events.map((ev) => ({
            name: ev.name,
            value: ev.value,
            itemStyle: ev.itemStyle,
          })),
          emphasis: { scale: 1.4 },
        },
      ],
      grid: { left: 90, right: 20, top: 30, bottom: 40 },
    };

    chart.setOption(option, true);

    const resize = () => chart.resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
    };
  }, [individuals, patIds, matIds, proposals]);

  return (
    <div className="event-timeline panel">
      <div style={{ marginBottom: 8, fontWeight: 600 }}>Life Events Timeline (ECharts)</div>
      <div ref={containerRef} style={{ width: "100%", height }} />
      <div className="muted" style={{ fontSize: "0.75rem", marginTop: 4 }}>
        Green = Patriline births • Pink = Matriline • Purple = Accepted research proposals
      </div>
    </div>
  );
}
