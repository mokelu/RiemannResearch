import { useEffect, useRef, useState } from "react";

import { graphs, loadedCount, loadErrors, programs, behaviors } from "./load.js";
import { current, exitsOf, startState, take } from "./runner.js";

const KNOWN = new Set(Object.keys(graphs));

/* --------------------------------------------------------------- surface */

/**
 * The unit as an ordered list of steps, in source order.
 *
 * A program opens with its sentence; every step carries the transitions that
 * can leave it. This is the whole machine — there is nothing to arrange,
 * drag, or fit.
 */
function buildRows(unit, known) {
  const stepId = new Map(unit.steps.map((s, i) => [s.term, `n${i}`]));

  const resolve = (c) => {
    if (c.isHalt) return { kind: "halt", id: "halt", label: "halt" };
    if (stepId.has(c.target)) return { kind: "step", id: stepId.get(c.target), label: c.target };
    if (known.has(c.target)) return { kind: "portal", id: c.target, label: `enter ${c.target}` };
    return { kind: "error", id: "halt", label: `?? ${c.target}` };
  };

  const rows = [];

  if (unit.kind === "program") {
    const first = unit.steps[0];
    rows.push({
      id: "entry",
      kind: "entry",
      tick: "",
      kicker: "sentence",
      label: unit.sentence ?? unit.name,
      outs: first
        ? [
            {
              edgeId: `${unit.name}::enter`,
              response: unit.enter || "enter",
              kind: "step",
              id: "n0",
              label: first.term,
            },
          ]
        : [],
    });
  }

  unit.steps.forEach((s, i) => {
    rows.push({
      id: `n${i}`,
      kind: "step",
      tick: String(i + 1),
      label: s.term,
      outs: s.catches.map((c, j) => ({
        edgeId: `${unit.name}::${i}:${j}`,
        response: c.response,
        ...resolve(c),
      })),
    });
  });

  return rows;
}

function Surface({ graph, run, pos, onRespond }) {
  const unit = graph.unit;
  const rows = buildRows(unit, KNOWN);
  const pathSet = new Set(run.path);

  const visited = new Set();
  for (const e of graph.edges) {
    if (pathSet.has(e.id)) {
      visited.add(e.source);
      visited.add(e.target);
    }
  }

  const spot = useRef({});
  const [flash, setFlash] = useState(null);

  // wherever the machine stands, bring it into view
  useEffect(() => {
    if (pos.unit !== unit.name) return;
    spot.current[`${unit.name}:${pos.node}`]?.scrollIntoView({ block: "nearest" });
  }, [pos.unit, pos.node, unit.name]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 900);
    return () => clearTimeout(t);
  }, [flash]);

  const show = (id) => {
    setFlash(id);
    spot.current[`${unit.name}:${id}`]?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  };

  return (
    <div className="surface">
      {rows.map((row) => {
        const isHere = pos.unit === unit.name && pos.node === row.id;

        const cls = [
          "row",
          row.kind,
          isHere ? "is-current" : "",
          visited.has(row.id) ? "is-visited" : "",
          flash === row.id ? "is-flash" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <section
            key={row.id}
            className={cls}
            ref={(el) => {
              spot.current[`${unit.name}:${row.id}`] = el;
            }}
          >
            <span className="tick">{row.tick}</span>

            <div className="row-line">
              <div className="body">
                {row.kicker && <span className="kicker">{row.kicker}</span>}
                <span className="term">{row.label}</span>
              </div>
              {isHere && <span className="now">here</span>}
            </div>

            {row.outs.length > 0 && (
              <div className="outs">
                {row.outs.map((o) => {
                  const live = o.kind === "portal" && isHere && !run.done;
                  const Tag = o.kind === "step" || live ? "button" : "span";

                  return (
                    <Tag
                      key={o.edgeId}
                      className={["out", `to-${o.kind}`, pathSet.has(o.edgeId) ? "on-path" : ""]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={
                        Tag === "button"
                          ? () => (live ? onRespond(o.edgeId) : show(o.id))
                          : undefined
                      }
                      title={
                        live
                          ? "step inside this behavior"
                          : o.kind === "step"
                            ? "show this step"
                            : o.label
                      }
                    >
                      <span className="r">{o.response}</span>
                      <span className="t">→ {o.label}</span>
                    </Tag>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------- app */

export default function App() {
  const first = programs[0] ?? behaviors[0] ?? null;

  const [side, setSide] = useState(true);
  const [view, setView] = useState(first);
  const [run, setRun] = useState(() => (first ? startState(graphs[first]) : null));
  const [playing, setPlaying] = useState(false);

  // wherever the machine moves, the view follows it
  useEffect(() => {
    if (run) setView(current(run).unit);
  }, [run]);

  // auto-advance
  useEffect(() => {
    if (!playing || !run) return;
    if (run.done) {
      setPlaying(false);
      return;
    }
    const graph = graphs[current(run).unit];
    const options = exitsOf(graph, run);
    if (!options.length) {
      setPlaying(false);
      return;
    }
    const next = options[0];
    const timer = setTimeout(() => {
      setRun((prev) => take(prev, graphs[current(prev).unit], next.id));
    }, 750);
    return () => clearTimeout(timer);
  }, [playing, run]);

  const load = (name) => {
    setPlaying(false);
    setRun(startState(graphs[name]));
  };

  const respond = (edgeId) => {
    setPlaying(false);
    setRun((prev) => take(prev, graphs[current(prev).unit], edgeId));
  };

  const reset = () => {
    setPlaying(false);
    if (run) setRun(startState(graphs[current(run).unit]));
  };

  const graph = view ? graphs[view] : null;
  const pos = run ? current(run) : null;
  const runGraph = pos ? graphs[pos.unit] : null;
  const options = runGraph && run && !run.done ? exitsOf(runGraph, run) : [];

  if (!first) {
    return (
      <div className="empty">
        <h1>abplay</h1>
        <p>No .ab files found under rewriteJS/.</p>
        {loadErrors.length > 0 && <pre>{loadErrors.join("\n")}</pre>}
      </div>
    );
  }

  return (
    <div className="app">
      <aside className={side ? "side" : "side hidden"}>
        <div className="brand">
          abplay
          <span>{loadedCount} units</span>
        </div>

        <div className="group">programs</div>
        <ul>
          {programs.map((name) => (
            <li key={name}>
              <button className={view === name ? "on" : ""} onClick={() => load(name)}>
                {name}
              </button>
            </li>
          ))}
        </ul>

        <div className="group">behaviors</div>
        <ul>
          {behaviors.map((name) => (
            <li key={name}>
              <button className={view === name ? "on" : ""} onClick={() => setView(name)}>
                {name}
              </button>
            </li>
          ))}
        </ul>

        {loadErrors.length > 0 && (
          <div className="errors">
            <div className="group">parse errors</div>
            <pre>{loadErrors.join("\n")}</pre>
          </div>
        )}
      </aside>

      <main className="stage">
        <header className="bar">
          <button
            className="ctl flip"
            onClick={() => setSide((s) => !s)}
            title={side ? "hide panel" : "show panel"}
          >
            {side ? "‹" : "≡"}
          </button>

          <nav className="crumbs">
            {run.stack.map((frame, i) => (
              <span key={`${frame.unit}:${i}`}>
                {i > 0 && <em>›</em>}
                <button
                  className={view === frame.unit ? "on" : ""}
                  onClick={() => setView(frame.unit)}
                >
                  {frame.unit}
                </button>
              </span>
            ))}
          </nav>

          {pos && view !== pos.unit && (
            <button className="jump" onClick={() => setView(pos.unit)}>
              viewing {view} — jump to {pos.unit}
            </button>
          )}

          <div className="spacer" />

          <button className="ctl" onClick={reset}>
            reset
          </button>
          <button
            className={`ctl ${playing ? "live" : ""}`}
            onClick={() => setPlaying((p) => !p)}
            disabled={!!run?.done}
          >
            {playing ? "pause" : "play"}
          </button>
        </header>

        <div className="well">
          {graph && run && pos && (
            <Surface
              key={graph.unit.name}
              graph={graph}
              run={run}
              pos={pos}
              onRespond={respond}
            />
          )}
        </div>

        <footer className="deck">
          <div className="where">
            <span className="kicker">standing on</span>
            <strong>{pos ? nodeLabel(graphs[pos.unit], pos.node) : "—"}</strong>
          </div>

          <div className="feed">
            {!run || run.done ? (
              <span className="stopped">halted — no more transitions</span>
            ) : options.length === 0 ? (
              <span className="stopped">no exits from this step</span>
            ) : (
              options.map((e) => (
                <button key={e.id} className="feed-btn" onClick={() => respond(e.id)}>
                  <span className="r">{e.label}</span>
                  <span className="t">→ {targetLabel(graphs[pos.unit], e)}</span>
                </button>
              ))
            )}
          </div>
        </footer>
      </main>
    </div>
  );
}

/* ---------------------------------------------------------------- helpers */

function nodeLabel(graph, id) {
  return graph?.nodeById.get(id)?.data?.label ?? id;
}

function targetLabel(graph, edge) {
  const target = graph?.nodeById.get(edge.target);
  if (!target) return edge.target;
  if (target.type === "halt") return "halt";
  if (target.type === "portal") return `enter ${target.data.behavior}`;
  return target.data.label;
}
