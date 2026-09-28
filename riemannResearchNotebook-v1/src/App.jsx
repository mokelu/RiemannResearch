import { useState } from "react";
import { Surface } from "../notebook/render/surface.js";
import { renderDocument } from "../notebook/projections/document.js";
import { renderStructure } from "../notebook/projections/structure.js";
import { renderTable } from "../notebook/projections/table.js";
import { renderGraph } from "../notebook/projections/graph.js";
import { CellsView } from "./CellsView.jsx";
import { ChatPanel } from "./ChatPanel.jsx";
import { SEEDS } from "./seed.js";

const VIEWS = ["Document", "Graph", "Table", "Cells", "Structure"];

export default function App() {
  const [view, setView] = useState("Document");
  const [tick, setTick] = useState(0);
  const [chatOpen, setChatOpen] = useState(true);
  const [docksOpen, setDocksOpen] = useState(true);

  // The Space is the live structure. It starts empty and becomes real only when
  // a validated AI reply is adopted, or an example is loaded to try the views.
  const [surface, setSurface] = useState(() => Surface.empty());

  // `tick` only exists to force a re-render after an in-place edit — the
  // Surface changes underneath us without a new object identity.
  const rerender = () => setTick((t) => t + 1);
  const adopt = (structure) => setSurface(Surface.open(structure));
  const loadExample = () => adopt(structuredClone(SEEDS.Reasoning));

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">Riemann Notebook</span>

        <button className="chat-toggle" onClick={loadExample}>
          Load example
        </button>

        <nav className="tabs">
          {VIEWS.map((v) => (
            <button
              key={v}
              className={v === view ? "tab active" : "tab"}
              onClick={() => setView(v)}
            >
              {v}
            </button>
          ))}
        </nav>

        <span className="count">
          {surface.graph.size} sentence{surface.graph.size === 1 ? "" : "s"}
        </span>

        <button
          className="dock-toggle"
          onClick={() => setDocksOpen((o) => !o)}
          aria-pressed={docksOpen}
        >
          {docksOpen ? "Minimize panels" : "Show panels"}
        </button>

        <button
          className="chat-toggle"
          onClick={() => setChatOpen((o) => !o)}
          aria-pressed={chatOpen}
        >
          {chatOpen ? "Hide chat" : "Chat"}
        </button>
      </header>

      <div className="workspace">
        {/* left dock hidden for now */}

        <main className="body" key={tick}>
          {view === "Document" && (
            <pre className="prose">{renderDocument(surface)}</pre>
          )}
          {view === "Structure" && (
            <pre className="code">{renderStructure(surface)}</pre>
          )}
          {view === "Table" && <TableView surface={surface} />}
          {view === "Graph" && <GraphView surface={surface} />}
          {view === "Cells" && <CellsView surface={surface} onEdit={rerender} />}
        </main>

        {docksOpen && chatOpen && <ChatPanel onAdopt={adopt} />}
      </div>
    </div>
  );
}

/** Rows and columns, straight from renderTable. */
function TableView({ surface }) {
  const { columns, rows } = renderTable(surface);
  if (rows.length === 0) return <p className="empty">(empty)</p>;

  return (
    <table className="grid">
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.id}</td>
            <td>
              <span className="chip">{row.tag}</span>
            </td>
            <td>{row.text}</td>
            <td>{row.leads.join("; ") || "—"}</td>
            <td>{row.follows.join("; ") || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Nodes as cards, wires as a labelled list. Positions stay a canvas concern. */
function GraphView({ surface }) {
  const { nodes, edges } = renderGraph(surface);

  return (
    <div className="graph">
      <div className="graph-nodes">
        {nodes.map((n) => (
          <div className="node" key={n.id}>
            <span className="chip">{n.label}</span>
            <span className="node-id">{n.id}</span>
            <p>{n.text}</p>
          </div>
        ))}
      </div>
      <ul className="edges">
        {edges.length === 0 && <li className="empty">no wires yet</li>}
        {edges.map((e) => (
          <li key={e.id}>
            <b>{e.from}</b> <span className="rel">{e.relation}</span>{" "}
            <b>{e.to}</b>
            <em> — reads as “{e.phrase}”</em>
          </li>
        ))}
      </ul>
    </div>
  );
}
