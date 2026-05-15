/**
 * Educational copy: hominin skull evolution + common face-shape categories (self-assessment).
 * Not computer vision — users pick a category manually elsewhere.
 */
export function MorphologyEducation() {
  return (
    <>
      <details className="blood-panel-card morph-details">
        <summary className="blood-panel-card-summary">Hominin skull types &amp; trends (education)</summary>
        <div className="blood-panel-card-pane morph-body">
          <p className="morph-lead">
            Over millions of years hominin skulls changed from small-brained, more prognathic (projecting-jaw)
            forms toward larger braincases, flatter faces, and a more forward foramen magnum suited to habitual
            bipedalism. Below is a compact reference table (approximate cranial capacities vary by specimen).
          </p>
          <table className="morph-table">
            <thead>
              <tr>
                <th scope="col">Type / taxon</th>
                <th scope="col">Era (approx.)</th>
                <th scope="col">Notable features</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <em>Australopithecus afarensis</em> (e.g. “Lucy”)
                </td>
                <td>~3.2 mya</td>
                <td>Small cranium (~400–500 cc class), strong prognathism, prominent brow ridges.</td>
              </tr>
              <tr>
                <td>
                  <em>A. africanus</em>
                </td>
                <td>3–2.4 mya</td>
                <td>Similar to <em>A. afarensis</em>; somewhat larger brain; teeth somewhat more human-like.</td>
              </tr>
              <tr>
                <td>
                  <em>Paranthropus</em> (robust forms)
                </td>
                <td>~2.3–1.2 mya</td>
                <td>Very robust skull, large postcanine teeth; sagittal crest in some males for jaw muscles.</td>
              </tr>
              <tr>
                <td>
                  <em>Homo habilis</em>
                </td>
                <td>~2.4 mya</td>
                <td>Larger brain than australopiths (~600–700 cc class); less projecting face; early <em>Homo</em>.</td>
              </tr>
              <tr>
                <td>
                  <em>H. erectus</em>
                </td>
                <td>~1.9 mya–110 kya</td>
                <td>Long, low vault; strong brow ridge; larger brain (~900–1100 cc class).</td>
              </tr>
              <tr>
                <td>
                  <em>H. neanderthalensis</em>
                </td>
                <td>~400–40 kya</td>
                <td>Large brain (often comparable to or larger than recent <em>H. sapiens</em>); occipital bun; large nasal aperture.</td>
              </tr>
              <tr>
                <td>
                  <em>Homo sapiens</em>
                </td>
                <td>~300 kya–present</td>
                <td>High, rounded vault (~1300–1500 cc class); reduced brow ridges; flatter face; chin.</td>
              </tr>
            </tbody>
          </table>
          <p className="morph-trends">
            <strong>Trends:</strong> cranial capacity increases overall; prognathism decreases; foramen magnum shifts
            forward with bipedalism; brow ridges and jaws generally reduce in <em>H. sapiens</em> compared to earlier
            hominins.
          </p>
          <p className="morph-links">
            Further reading:{" "}
            <a href="https://en.wikipedia.org/wiki/Human_evolution" target="_blank" rel="noreferrer">
              Human evolution
            </a>{" "}
            (Wikipedia);{" "}
            <a href="https://australian.museum/learn/science/human-evolution/" target="_blank" rel="noreferrer">
              Australian Museum — human evolution
            </a>
            .
          </p>
        </div>
      </details>

      <details className="blood-panel-card morph-details">
        <summary className="blood-panel-card-summary">
          Common face shapes (self-assessment — not facial recognition)
        </summary>
        <div className="blood-panel-card-pane morph-body">
          <p>
            These categories describe <strong>soft-tissue outline</strong> for styling or art — not skull type, and
            not computed from your photos in this app. Pick a closest match in the dropdown above using a mirror or
            simple width/length checks.
          </p>
          <p className="morph-face-art-note">
            Reference art below uses corner brackets as a <strong>visual motif only</strong> — this app does not scan
            your camera or images for face shape.
          </p>
          <div className="morph-face-figures" aria-label="Face shape reference illustrations">
            <figure className="morph-face-figure">
              <img
                className="morph-face-img"
                src="/morph/face-shapes-overview.png"
                alt="Stylized overview of seven common face-shape silhouettes with labels: oval, round, square, heart, diamond, rectangle, triangle."
                width={578}
                height={1024}
                loading="lazy"
                decoding="async"
              />
              <figcaption>Overview of categories (stylized — compare to your outline in a mirror).</figcaption>
            </figure>
            <figure className="morph-face-figure">
              <img
                className="morph-face-img"
                src="/morph/face-shapes-grid.png"
                alt="Grid of nine stylized face-shape bust cards with category labels."
                width={578}
                height={1024}
                loading="lazy"
                decoding="async"
              />
              <figcaption>Grid of labeled examples for a quick visual pass.</figcaption>
            </figure>
            <div className="morph-face-oval-pair">
              <figure className="morph-face-figure">
                <img
                  className="morph-face-img"
                  src="/morph/face-shape-oval.png"
                  alt="Stylized oval face shape bust with rainbow layers and decorative corner brackets."
                  width={578}
                  height={1024}
                  loading="lazy"
                  decoding="async"
                />
                <figcaption>Oval — length slightly greater than width.</figcaption>
              </figure>
              <figure className="morph-face-figure">
                <img
                  className="morph-face-img"
                  src="/morph/face-shape-oval-alt.png"
                  alt="Alternate stylized oval face shape illustration with similar art style."
                  width={1024}
                  height={632}
                  loading="lazy"
                  decoding="async"
                />
                <figcaption>Same category, alternate pose — use whichever matches your outline better.</figcaption>
              </figure>
            </div>
          </div>
          <ul className="morph-face-list">
            <li>
              <strong>Oval</strong> — length slightly greater than width; forehead often wider than jawline.
            </li>
            <li>
              <strong>Round</strong> — length and width similar; soft curves, rounded jaw.
            </li>
            <li>
              <strong>Square</strong> — angular jaw; forehead, cheek, and jaw widths fairly even.
            </li>
            <li>
              <strong>Heart</strong> — wider forehead/cheekbones tapering to a relatively narrow or pointed chin.
            </li>
            <li>
              <strong>Diamond</strong> — narrow forehead and jaw with wide, high cheekbones.
            </li>
            <li>
              <strong>Rectangle / oblong</strong> — like square but noticeably longer in the vertical dimension.
            </li>
            <li>
              <strong>Triangle / pear</strong> — narrower forehead, wider or stronger jawline.
            </li>
          </ul>
          <p className="morph-links">
            How people often measure: compare forehead, cheekbone, and jaw widths; hairline-to-chin length; note whether
            the jaw is angular or soft. Example walkthrough:{" "}
            <a href="https://www.wikihow.com/Determine-Your-Face-Shape" target="_blank" rel="noreferrer">
              wikiHow — determine your face shape
            </a>
            .
          </p>
        </div>
      </details>
    </>
  );
}
