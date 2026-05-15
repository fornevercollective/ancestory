/**
 * In-app guide: mapping consumer DNA / tree product ideas to local-only Ancestory workflows.
 * Does not integrate proprietary vendor APIs — users paste or re-type findings.
 */
export function ExternalDnaToolsPanel() {
  return (
    <details className="blood-panel-card ext-dna-panel">
      <summary className="blood-panel-card-summary">
        External DNA &amp; tree tools — using other apps&apos; data here
      </summary>
      <div className="blood-panel-card-pane ext-dna-body">
        <p className="ext-dna-lead">
          Ancestory loads <strong>your GEDCOM export</strong> as <span className="mono">tree.json</span>. It does{" "}
          <strong>not</strong> sign in to AncestryDNA, 23andMe, MyHeritage, or similar services. You can still{" "}
          <strong>reuse their conclusions</strong> by pasting summaries, cM figures, cluster notes, and ethnicity
          percentages into the fields below — everything stays in your browser unless you share the file.
        </p>

        <table className="ext-dna-table">
          <thead>
            <tr>
              <th scope="col">Typical product feature</th>
              <th scope="col">In Ancestory</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Ethnicity / &quot;DNA Story&quot; regions</td>
              <td>
                <strong>DNA &amp; ethnicity notes</strong> (dual strip) + optional narrative in your own words.
              </td>
            </tr>
            <tr>
              <td>DNA matches, shared cM, relationship guesses</td>
              <td>
                Paste match lists, <span className="mono">cM</span> ranges, and hypotheses into{" "}
                <strong>DNA notes</strong>; use <strong>Search / set root</strong> to jump to suggested common
                ancestors (manual ThruLines-style workflow).
              </td>
            </tr>
            <tr>
              <td>Maternal vs paternal buckets (e.g. SideView)</td>
              <td>
                <strong>Dual lines</strong> (patriline vs matriline) + <strong>mix %</strong> slider as a rough
                illustration — not computed from raw genotype data.
              </td>
            </tr>
            <tr>
              <td>Shared matches / clusters / genetic networks</td>
              <td>
                Describe clusters in <strong>DNA notes</strong>; keep your GED as the structural tree; use{" "}
                <strong>Rulers</strong> for text-heavy historical heuristics if relevant.
              </td>
            </tr>
            <tr>
              <td>Tree errors (impossible dates, duplicates)</td>
              <td>
                Fix in your desktop genealogy app, then <strong>re-export GED → ged_export</strong>. Ancestory does
                not run a full tree checker yet.
              </td>
            </tr>
            <tr>
              <td>Geographic tree / ethnicity maps</td>
              <td>
                <strong>Map / path</strong> tab and dual embed: birth, death, residence, marriage places from the
                GED — not vendor ethnicity polygons.
              </td>
            </tr>
            <tr>
              <td>Reports (ahnentafel, descendancy, group sheets)</td>
              <td>
                Generate those in your main genealogy program; use Ancestory for <strong>dual-line alignment</strong>,{" "}
                <strong>map scrub</strong>, and <strong>rulers</strong> views on the same export.
              </td>
            </tr>
            <tr>
              <td>DNA Journeys / timelines / parent-specific ethnicity</td>
              <td>
                Narrative in <strong>DNA notes</strong>; <strong>blood type</strong> block for optional serology
                labels (not genotype); map + year filters for historical context.
              </td>
            </tr>
          </tbody>
        </table>

        <h4 className="ext-dna-h">Core public &amp; research tools (open web)</h4>
        <ul className="ext-dna-links">
          <li>
            <a href="https://alphafold.ebi.ac.uk" target="_blank" rel="noreferrer">
              AlphaFold Protein Structure Database
            </a>{" "}
            — predicted 3D structures from protein sequences (DeepMind / EMBL-EBI). Useful for{" "}
            <strong>molecular biology</strong> and variant interpretation research, not the same as autosomal ethnicity
            charts, but a flagship open resource when you follow disease-associated genes.
          </li>
          <li>
            <a href="https://isogg.org/wiki/Welcome_to_ISOGG_Wiki" target="_blank" rel="noreferrer">
              ISOGG Wiki
            </a>{" "}
            — genetic-genealogy concepts (Y-DNA, mtDNA, autosomal), often cited by hobbyists and researchers.
          </li>
          <li>
            <a href="https://www.ncbi.nlm.nih.gov/snp/" target="_blank" rel="noreferrer">
              dbSNP
            </a>{" "}
            — reference for SNP rs IDs if you cross-link medical or population literature (expert use).
          </li>
        </ul>

        <p className="ext-dna-foot">
          Third-party <strong>segment</strong> / <strong>match</strong> sites exist (e.g. upload-based calculators).
          Read each site&apos;s terms and privacy policy before uploading anyone&apos;s DNA data.
        </p>
      </div>
    </details>
  );
}
