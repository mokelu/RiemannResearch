import React, { useEffect, useState } from "react";
import { Surface } from "../notebook/render/surface.js";
import { renderDocumentTree } from "../notebook/projections/document.js";
import { renderStructure } from "../notebook/projections/structure.js";
import { renderTable } from "../notebook/projections/table.js";
import { renderGraph } from "../notebook/projections/graph.js";
import { CellsView } from "./CellsView.jsx";
import { ChatPanel } from "./ChatPanel.jsx";
import { LeftPanel } from "./LeftPanel.jsx";
import { SEEDS } from "./seed.js";
import { loadWorkspace, saveWorkspace } from "./persistence.js";
import {
  createNode,
  duplicateFile,
  findNode,
  firstFileId,
  moveNode,
  nextId,
  removeNode,
  renameNode,
  seedWorkspace,
  setFileStructure,
} from "./workspace.js";

const VIEWS = ["Document", "Graph", "Table", "Cells", "Structure"];

/** Open the structure a file holds. Anything the boundary refuses opens as
 *  an empty document — half-true work is never shown as if it were whole. */
function openSurface(node) {
  if (!node || node.type !== "file" || !node.structure) return Surface.empty();
  try {
    return Surface.open(node.structure);
  } catch {
    return Surface.empty();
  }
}

export default function App() {
  // The workspace is the left panel's tree; the surface is the open file's
  // live structure. One file is always open, so there is always a place for
  // work to land.
  const [ws, setWs] = useState(() => {
    const root = loadWorkspace() ?? seedWorkspace();
    return { root, activeId: firstFileId(root) };
  });
  const [surface, setSurface] = useState(() =>
    openSurface(findNode(ws.root, ws.activeId)),
  );

  const [view, setView] = useState("Document");
  const [tick, setTick] = useState(0);
  const [chatOpen, setChatOpen] = useState(true);
  const [docksOpen, setDocksOpen] = useState(true);

  // `tick` only exists to force a re-render after an in-place edit — the
  // Surface changes underneath us without a new object identity.
  const rerender = () => setTick((t) => t + 1);
  const adopt = (structure) => setSurface(Surface.open(structure));
  const loadExample = () => adopt(structuredClone(SEEDS.Reasoning));

  // Every change to the canonical structure — adopted from chat, loaded, or
  // edited in place — is written into the open file. `tick` is in the list
  // because an in-place edit changes the surface without changing identity.
  useEffect(() => {
    const structure = surface.toJSON();
    setWs((prev) => {
      const file = findNode(prev.root, prev.activeId);
      if (!file || file.type !== "file") return prev;
      const stored = JSON.stringify(file.structure ?? null);
      if (stored === JSON.stringify(structure)) return prev;
      return { ...prev, root: setFileStructure(prev.root, prev.activeId, structure) };
    });
  }, [surface, tick]);

  // And the tree — names, folders, contents — goes to browser storage, so a
  // refresh brings the whole workspace back.
  useEffect(() => {
    saveWorkspace(ws.root);
  }, [ws.root]);

  /* ------------------------------------------------------------ panel ops */

  function openFile(id) {
    const node = findNode(ws.root, id);
    if (!node || node.type !== "file") return;
    setWs((prev) => ({ ...prev, activeId: id }));
    setSurface(openSurface(node));
  }

  function createEntry(parentId, type, id) {
    setWs((prev) => {
      const root = createNode(prev.root, parentId, type, id);
      // A new file opens straight away: creating a file means starting work.
      return type === "file" ? { root, activeId: id } : { ...prev, root };
    });
    if (type === "file") setSurface(Surface.empty());
  }

  function renameEntry(id, name) {
    setWs((prev) => ({ ...prev, root: renameNode(prev.root, id, name) }));
  }

  function deleteEntry(id) {
    const root = removeNode(ws.root, id);
    let activeId = ws.activeId;

    if (id === activeId || !findNode(root, activeId)) {
      activeId = firstFileId(root);
      if (!activeId) {
        // Never leave the workspace without a file to work in.
        const fresh = nextId();
        setWs({
          root: createNode(root, root.id, "file", fresh, "Untitled"),
          activeId: fresh,
        });
        setSurface(Surface.empty());
        return;
      }
    }

    setWs({ root, activeId });
    if (activeId !== ws.activeId) {
      setSurface(openSurface(findNode(root, activeId)));
    }
  }

  function duplicateEntry(id) {
    setWs((prev) => ({ ...prev, root: duplicateFile(prev.root, id, nextId()) }));
  }

  function moveEntry(sourceId, targetId) {
    setWs((prev) => ({ ...prev, root: moveNode(prev.root, sourceId, targetId) }));
  }

  const activeFile = findNode(ws.root, ws.activeId);

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">Riemann Notebook</span>

        <span className="count topbar-file" title="open file">
          {activeFile?.name ?? "no file"}
        </span>

        <button className="chat-toggle" onClick={loadExample}>
          Load example
        </button>

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
        {docksOpen && (
          <aside className="left-dock">
            <LeftPanel
              root={ws.root}
              activeId={ws.activeId}
              onOpen={openFile}
              onCreate={createEntry}
              onRename={renameEntry}
              onDelete={deleteEntry}
              onDuplicate={duplicateEntry}
              onMove={moveEntry}
            />
          </aside>
        )}

        <main className="center">
          {/* How the open file is looked at belongs with the file, not with
              the app chrome: a toolbar row of its own, above the content,
              taking its space rather than covering it. */}
          <div className="viewbar">
            <nav className="view-tabs">
              {VIEWS.map((v) => (
                <button
                  key={v}
                  className={v === view ? "view-tab active" : "view-tab"}
                  onClick={() => setView(v)}
                >
                  {v}
                </button>
              ))}
            </nav>
          </div>

          <div className="body" key={tick}>
            {view === "Document" && <DocumentView surface={surface} />}
            {view === "Structure" && (
              <pre className="code">{renderStructure(surface)}</pre>
            )}
            {view === "Table" && <TableView surface={surface} />}
            {view === "Graph" && <GraphView surface={surface} />}
            {view === "Cells" && <CellsView surface={surface} onEdit={rerender} />}
          </div>
        </main>

        {docksOpen && chatOpen && <ChatPanel onAdopt={adopt} />}
      </div>
    </div>
  );
}

/**
 * Mounts the Document projection's described elements as real React nodes.
 * The projection decides tag, props, and children; this only turns that
 * description into elements — it adds no wording and no layout of its own.
 */
function mountDoc(node) {
  if (typeof node === "string") return node;
  const { tag, props = {}, children = [], key } = node;
  return React.createElement(
    tag,
    { ...props, key },
    ...children.map((child, i) =>
      typeof child === "string" ? child : mountDoc({ ...child, key: child.key ?? i }),
    ),
  );
}

function DocumentView({ surface }) {
  const blocks = renderDocumentTree(surface);
  if (blocks.length === 0)
    return (
      <p className="empty">
        Nothing here yet. Add sentences in the Cells view, or press
        “Load example” above.
      </p>
    );

  return <article className="prose">{blocks.map((block, i) => mountDoc({ ...block, key: block.key ?? i }))}</article>;
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
