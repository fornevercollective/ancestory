# Ancestory – Continuation Plan (for next session)

**Created:** After long deep work session on 2026-05-31 / 2026-06-01  
**Goal:** Turn Ancestory into the cool, 2026+ "robots + science + AI + narrative" answer to traditional genealogy apps (Ancestry.com style), while keeping the core "boring but deep" genealogy experience.

---

## Current Vision (User's Intent)

- Make genealogy feel alive, deep, and futuristic instead of dusty/family-tree database.
- Rich personal storytelling: sexual partners, life travel, major life events.
- Strong connection to real history + science + tribal knowledge.
- Horizontal timeline as a first-class narrative tool (inspired by https://mueee.qbitos.ai/history.html).
- First-class support for **forward / space / multi-planetary** speculative branches.
- Preservation of **fading elder & tribal stories**.
- Smart "ancestral resonance" / deeper matching based on story overlaps, language, tribal data (the "dating the past" layer).
- All of the above visible and manageable on **maps** (not just side panels and timeline).
- Overall tone: sci-fi + rigorous + slightly playful ("the robot historian has opinions").

---

## What Was Delivered in This Session (High Level)

### Core Infrastructure
- Place Ledger (`placeLedgerStorage.ts`) – persistent, fast coordinate memory across sessions.
- Research Proposals system (`researchEnrichmentsStorage.ts` + `ResearchProposalsPanel.tsx`).
- Full structured extraction from Wikidata, Wikipedia, Find a Grave (and hooks for Grokipedia).

### Narrative & Story Layer
- **Deep Narrative Timeline** (`EventTimeline.tsx`) – significantly upgraded horizontal timeline with:
  - Partners + travel waypoints
  - Major historical / science / space / tribal events
  - Era visual bands
  - Click interactions (`onEventClick`)
- **Forward / Space Layer** (`forwardLineageStorage.ts` + `ForwardLineagePanel.tsx`) – first-class support for speculative off-world and future branches. Integrated into timeline + Oracle.
- **Tribal Elder Stories** (`tribalElderStorage.ts` + `TribalElderStoriesPanel.tsx`) – dedicated system for preserving fading elder knowledge. Integrated into timeline, Oracle, and Resonance.
- **Ancestory Oracle** (`AncestoryOracle.tsx`) – the "AI synthesis / robot historian" brain. Generates smart, slightly sci-fi insights from tree + proposals + phenotypes + new story layers.
- **Ancestral Resonance** (`AncestralResonance.tsx`) – deeper matching engine using story overlaps, language/etymology, tribal data.

### Maps & "All Stories" Integration
- Place Curation Panel now explicitly surfaces story provenance (tree, proposals, elders, forward, historical events, partners).
- Maps updated with clearer messaging that the full story layer powers them.
- Timeline ↔ Map loose coupling started (`lastTimelineEvent` feedback + `onEventClick` hook).

### Experience & Polish
- Strong mobile parity for all new panels.
- PWA improvements (manifest, install prompt, basic service worker).
- Consistent "2026+ cool but respectful" tone across new features.

---

## Remaining Priorities (in suggested order)

1. **Make the maps the true spatial home of "all stories"** (highest priority right now)
   - Visual markers for historical events, elder stories, forward branches directly on the map.
   - Better / richer partner + travel visualization.
   - Two-way linking between Timeline events and Map (click timeline event → highlight on map, and vice versa).
   - "Story Layers" toggle or legend in the map UI.
   - Ability to add/curate story-derived places more fluidly.

2. **Polish & Hardening (Slice 4 items)**
   - Export research proposals + elder stories + forward branches as useful GED notes / supplemental JSON.
   - Living persons guard (respect for recent people).
   - Better mobile UX for the new big panels (especially Place Curation table on phones).
   - Performance work on very large trees with lots of proposals/stories.
   - Error handling and loading states in extraction and synthesis.

3. **Grokipedia Special Treatment**
   - Deeper / more opinionated extraction from Grokipedia.
   - "Grokipedia vs mainstream" divergence views.
   - Special Oracle insights when Grokipedia data is present.

4. **Deeper "Robots + AI" Feel**
   - More agentic research flows (the existing contrail search is a good base).
   - Stronger synthesis in the Oracle (more creative but grounded narrative generation).
   - Optional hooks for real LLM / Grok API usage in the future.

5. **Documentation & Onboarding**
   - Update README with the new vision and major features.
   - Add a `VISION.md` or expand this continuation doc.
   - Better in-app guidance for the new story systems.

6. **Nice-to-haves / Future**
   - Voice notes or richer media attachment for elder stories.
   - Visual "migration wave" or sankey views using the new story data.
   - More playful but serious "Lineage Dating / Compatibility" modes.

---

## Specific Next Tasks (Recommended Order for Tomorrow)

### High Priority (Maps + Story Integration)
- [ ] Implement visual story markers on `MapView.tsx` (historical events, elder stories, forward locations).
- [ ] Add a "Story Layers" control or legend in the map toolbar.
- [ ] Make `onEventClick` from the timeline actually highlight or filter places on the map when possible.
- [ ] Improve partner visualization (already supported in some scopes – make it more prominent and consistent).
- [ ] Enhance `PlaceCurationPanel` to show/filter places by story source (elder, forward, historical, etc.).

### Medium Priority (Polish)
- [ ] Implement export of proposals + elder stories + forward branches (as text notes or structured JSON).
- [ ] Add living persons guard logic in extraction and display.
- [ ] Mobile responsiveness pass on the biggest new panels (especially tables and long lists).
- [ ] Add basic loading / error states to the new panels.

### Nice-to-have / Vision
- [ ] Give Grokipedia noticeably special treatment in the Oracle and extraction UI.
- [ ] Improve the "sci-fi + rigorous" tone and copy across the Oracle and Resonance components.
- [ ] Start a `VISION.md` or `NARRATIVE_SYSTEMS.md` that clearly explains the philosophy of the story layer.

---

## Key Files (Current Architecture)

**Story & Narrative Layer**
- `src/EventTimeline.tsx` – The star horizontal timeline
- `src/AncestoryOracle.tsx` – AI-style synthesis brain
- `src/AncestralResonance.tsx` – Deep matching engine
- `src/ForwardLineagePanel.tsx` + `forwardLineageStorage.ts`
- `src/TribalElderStoriesPanel.tsx` + `tribalElderStorage.ts`
- `src/ResearchProposalsPanel.tsx` + `researchEnrichmentsStorage.ts`

**Mapping**
- `src/MapView.tsx` + `src/placeLedgerStorage.ts`
- `src/PlaceCurationPanel.tsx`
- `src/storyMapUtils.ts` (new utility stub)

**Supporting**
- `src/majorHistoricalEvents.ts`
- `src/worldDirectoryData.ts` (tribal + language data)

---

## Open Questions / Decisions for Next Session

1. How "visual" do we want story markers on the map to be right away? (Simple colored markers vs rich popups with full story text?)
2. Should elder stories have special privacy / sensitivity handling in the UI?
3. How much do we want the Oracle to "speculate" vs stay grounded in the data the user has explicitly added?
4. Do we want a dedicated "Story Dashboard" tab, or keep everything flowing through the existing tabs + side panels?
5. Any specific visual or interaction patterns from https://mueee.qbitos.ai/history.html that you want ported or referenced more directly?

---

## Tone Reminder

Keep the balance the user likes:
- Cool, 2026+, slightly sci-fi ("the robot historian", "branches beyond Earth")
- But respectful and grounded when dealing with real elder knowledge and tribal stories.
- "Boring subject made deeply interesting" rather than flashy for the sake of it.

---

**Status:** The big architectural and vision pieces are in. The next phase is making the **maps** feel like the natural spatial home of all these story threads, plus solid polish.

You're in a very strong position to continue tomorrow. The foundation is real and coherent.

---

*Document created so you can pick up momentum quickly.*