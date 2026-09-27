import { useState } from "react";
import { cellOps, renderCells } from "../notebook/projections/cells.js";
import { NODE_TAGS } from "../notebook/vocabulary.js";

/**
 * The interactive view. Nothing here mutates the structure directly — every
 * intent goes through cellOps -> surface.propose, which re-validates. A rejected
 * edit leaves the structure untouched and the reason shows up in the banner.
 */
export function CellsView({ surface, onEdit }) {
  const ops = cellOps(surface);
  const cells = renderCells(surface);
  const [errors, setErrors] = useState([]);

  const run = (result) => {
    setErrors(result.applied ? [] : result.errors);
    onEdit();
  };

  const [newId, setNewId] = useState("");
  const [newText, setNewText] = useState("");
  const [newTag, setNewTag] = useState("FACT");

  return (
    <div className="cells">
      {errors.length > 0 && (
        <div className="banner error">
          <b>the boundary refused this edit</b>
          <ul>
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {cells.map((cell) => (
        <CellRow key={cell.id} cell={cell} ops={ops} run={run} />
      ))}

      <div className="add-cell">
        <span className="section-label">add a sentence</span>
        <div className="row">
          <input
            placeholder="id"
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
          />
          <input
            className="grow"
            placeholder="sentence…"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
          />
          <select value={newTag} onChange={(e) => setNewTag(e.target.value)}>
            {NODE_TAGS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              run(ops.addCell(newId.trim(), newText, newTag));
              setNewId("");
              setNewText("");
            }}
          >
            add
          </button>
        </div>
      </div>
    </div>
  );
}

function CellRow({ cell, ops, run }) {
  const [text, setText] = useState(cell.text);
  const [connectTo, setConnectTo] = useState("");
  const [relation, setRelation] = useState("implies");

  return (
    <div className="cell">
      <div className="cell-head">
        <select
          className="tag-select"
          value={cell.tag}
          onChange={(e) => run(ops.setTag(cell.id, e.target.value))}
        >
          {NODE_TAGS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <span className="node-id">{cell.id}</span>
        <button
          className="ghost"
          title="remove this sentence"
          onClick={() => run(ops.removeCell(cell.id))}
        >
          ✕
        </button>
      </div>

      <textarea
        className="cell-text"
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => text !== cell.text && run(ops.setText(cell.id, text))}
      />

      <div className="cell-meta">
        <span>
          leads → {cell.leads.length ? cell.leads.join(", ") : "—"}
        </span>
        <span>
          follows ← {cell.follows.length ? cell.follows.join(", ") : "—"}
        </span>
      </div>

      <div className="connect">
        <input
          placeholder="relation"
          value={relation}
          onChange={(e) => setRelation(e.target.value)}
        />
        <input
          placeholder="wire to id"
          value={connectTo}
          onChange={(e) => setConnectTo(e.target.value)}
        />
        <button
          onClick={() => {
            if (connectTo.trim()) run(ops.connect(cell.id, relation, connectTo.trim()));
          }}
        >
          connect
        </button>
      </div>
    </div>
  );
}
