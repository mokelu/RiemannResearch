import { useEffect, useRef, useState } from "react";
import {
  countWorkspace,
  findNode,
  findParent,
  isDescendant,
  nextId,
  pathOf,
} from "./workspace.js";

/**
 * The left panel — the explorer, assimilated from `mockups/leftpanel/leftpanel_v4.html`.
 *
 * The mockup is the specification: same rows, same chevrons, same context
 * menu, same rename flow, same drag rules. What changed is that every
 * operation now leaves this component and goes through the callbacks into the
 * workspace model, and the tree it renders is the real one — the file that is
 * open here is the file the center panel is showing.
 *
 * Local state is only what the panel alone owns: what is selected, expanded,
 * being renamed, searched, dragged, or asked about. The tree itself is not
 * ours to keep.
 */

const CHEV = (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
    <path
      d="M6 3.5 10.5 8 6 12.5"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const FILE = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinejoin="round"
  >
    <path d="M9 1.5H4.5a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V5z" />
    <path d="M9 1.5V5h3.5" />
  </svg>
);

const FOLDER = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinejoin="round"
  >
    <path d="M1.5 4.2a1 1 0 0 1 1-1h3l1.4 1.5h5.6a1 1 0 0 1 1 1v6.1a1 1 0 0 1-1 1H2.5a1 1 0 0 1-1-1z" />
  </svg>
);

const DOTS = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <circle cx="3.5" cy="8" r="1.2" />
    <circle cx="8" cy="8" r="1.2" />
    <circle cx="12.5" cy="8" r="1.2" />
  </svg>
);

const ICONS = {
  file: FILE,
  folder: FOLDER,
  edit: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11.2 2.3 13.7 4.8 5.9 12.6 2.8 13.2 3.4 10.1z" />
    </svg>
  ),
  trash: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.5 4h11M6 4V2.8a.8.8 0 0 1 .8-.8h2.4a.8.8 0 0 1 .8.8V4M4 4l.6 9a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9L12 4" />
    </svg>
  ),
  copy: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    >
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.2" />
      <path d="M10.5 5.5v-3a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h3" />
    </svg>
  ),
  expand: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3.5 10.5 8 6 12.5" />
      <path d="M2.5 3.5v9" />
    </svg>
  ),
};

function extOf(name) {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(i + 1).toLowerCase() : "";
}

export function LeftPanel({
  root,
  activeId,
  onOpen,
  onCreate,
  onRename,
  onDelete,
  onDuplicate,
  onMove,
}) {
  const panelRef = useRef(null);
  const [selected, setSelected] = useState(activeId ?? null);
  const [expanded, setExpanded] = useState(() => new Set(["root"]));
  const [editing, setEditing] = useState(null); // { id, isNew }
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState(null); // { x, y, node | null }
  const [confirm, setConfirm] = useState(null); // node to delete
  const [dragId, setDragId] = useState(null);
  const [dropOn, setDropOn] = useState(null);

  // The app decides which file is open; the panel only reflects it.
  useEffect(() => {
    if (activeId) setSelected(activeId);
  }, [activeId]);

  // A menu lives outside the flow: any click or right-click away dismisses it.
  useEffect(() => {
    if (!menu) return undefined;
    const close = (event) => {
      if (!event.target.closest?.(".lp-ctx")) setMenu(null);
    };
    document.addEventListener("click", close);
    document.addEventListener("contextmenu", close);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("contextmenu", close);
    };
  }, [menu]);

  const trimmed = query.trim().toLowerCase();
  const matches = (node) =>
    !trimmed ||
    node.name.toLowerCase().includes(trimmed) ||
    (node.children ?? []).some(matches);

  const toggle = (id) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const expand = (id) =>
    setExpanded((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });

  /** Where a new node should land: the selected folder, the selected
   *  file's folder, or the root — the mockup's `currentTarget`. */
  function currentTarget() {
    const node = selected ? findNode(root, selected) : null;
    if (!node) return root.id;
    if (node.type === "folder") return node.id;
    const parent = findParent(root, node.id);
    return parent ? parent.id : root.id;
  }

  function create(type, parentId = currentTarget()) {
    const id = nextId();
    onCreate(parentId, type, id);
    if (parentId) expand(parentId);
    setSelected(id);
    setEditing({ id, isNew: true });
    panelRef.current?.focus();
  }

  function startRename(id) {
    setSelected(id);
    setEditing({ id, isNew: false });
    panelRef.current?.focus();
  }

  function commitRename(id, value, isNew) {
    setEditing(null);
    const node = findNode(root, id);
    if (!node) return;

    const name = value.trim();
    if (!name) {
      // A brand-new entry given no name still becomes something — an entry
      // a stranger just created is never thrown away under them.
      if (isNew) {
        onRename(id, node.type === "folder" ? "Untitled folder" : "Untitled");
      }
      return;
    }
    onRename(id, name);
  }

  function cancelRename(id, isNew) {
    setEditing(null);
    // Escape on a brand-new entry means "I didn't want this after all".
    if (isNew) onDelete(id);
  }

  function copyPath(id) {
    const path = pathOf(root, id)
      ?.map((node) => node.name)
      .join("/");
    if (path) navigator.clipboard?.writeText(path).catch(() => {});
  }

  function requestDelete(node) {
    setMenu(null);
    setConfirm(node);
  }

  function confirmDelete() {
    const node = confirm;
    setConfirm(null);
    if (node) onDelete(node.id);
  }

  function onKeyDown(event) {
    if (editing || !selected || event.target.tagName === "INPUT") return;
    const node = findNode(root, selected);
    if (!node) return;

    if (event.key === "F2") {
      event.preventDefault();
      startRename(node.id);
    } else if (event.key === "Delete") {
      event.preventDefault();
      requestDelete(node);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (node.type === "folder") toggle(node.id);
      else onOpen(node.id);
    }
  }

  function menuFor(node, x, y) {
    const isFolder = node.type === "folder";
    const items = isFolder
      ? [
          { label: "New File", icon: ICONS.file, action: () => create("file", node.id) },
          { label: "New Folder", icon: ICONS.folder, action: () => create("folder", node.id) },
          { sep: true },
          { label: "Rename", icon: ICONS.edit, short: "F2", action: () => startRename(node.id) },
          { label: "Delete", icon: ICONS.trash, short: "Del", danger: true, action: () => requestDelete(node) },
          { sep: true },
          { label: "Copy Path", icon: ICONS.copy, action: () => copyPath(node.id) },
          {
            label: "Expand All",
            icon: ICONS.expand,
            action: () =>
              setExpanded((prev) => {
                const next = new Set(prev);
                (function walk(n) {
                  if (n.type === "folder") next.add(n.id);
                  n.children?.forEach(walk);
                })(node);
                return next;
              }),
          },
        ]
      : [
          { label: "Open", icon: ICONS.file, action: () => onOpen(node.id) },
          { sep: true },
          { label: "Rename", icon: ICONS.edit, short: "F2", action: () => startRename(node.id) },
          { label: "Duplicate", icon: ICONS.copy, action: () => onDuplicate(node.id) },
          { label: "Delete", icon: ICONS.trash, short: "Del", danger: true, action: () => requestDelete(node) },
          { sep: true },
          { label: "Copy Path", icon: ICONS.copy, action: () => copyPath(node.id) },
        ];

    setMenu({ x, y, items });
  }

  function rootMenu(x, y) {
    setMenu({
      x,
      y,
      items: [
        { label: "New File", icon: ICONS.file, action: () => create("file", root.id) },
        { label: "New Folder", icon: ICONS.folder, action: () => create("folder", root.id) },
        { sep: true },
        {
          label: "Expand All",
          icon: ICONS.expand,
          action: () =>
            setExpanded((prev) => {
              const next = new Set(prev);
              (function walk(n) {
                if (n.type === "folder") next.add(n.id);
                n.children?.forEach(walk);
              })(root);
              return next;
            }),
        },
        {
          label: "Collapse All",
          icon: ICONS.expand,
          action: () => setExpanded(new Set()),
        },
      ],
    });
  }

  function rowFor(node) {
    if (!matches(node)) return null;

    const isFolder = node.type === "folder";
    const isOpen = expanded.has(node.id) || Boolean(trimmed);
    const isEditing = editing?.id === node.id;

    const dropAllowed =
      dragId &&
      isFolder &&
      dragId !== node.id &&
      !isDescendant(root, node.id, dragId);

    const row = (
      <div
        key={node.id}
        className={
          "lp-row" +
          (selected === node.id ? " selected" : "") +
          (dropOn === node.id ? " drop-target" : "") +
          (!isFolder && activeId === node.id ? " active" : "")
        }
        draggable={!isEditing}
        onClick={(event) => {
          if (event.target.tagName === "INPUT") return;
          setSelected(node.id);
          panelRef.current?.focus();
          if (isFolder) toggle(node.id);
          else onOpen(node.id);
        }}
        onDoubleClick={(event) => {
          event.stopPropagation();
          if (!isFolder) startRename(node.id);
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setSelected(node.id);
          menuFor(node, event.clientX, event.clientY);
        }}
        onDragStart={(event) => {
          event.stopPropagation();
          setDragId(node.id);
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", node.id);
        }}
        onDragEnd={() => {
          setDragId(null);
          setDropOn(null);
        }}
        onDragOver={(event) => {
          if (!dropAllowed) return;
          event.preventDefault();
          event.stopPropagation();
          if (dropOn !== node.id) setDropOn(node.id);
        }}
        onDragLeave={() => {
          if (dropOn === node.id) setDropOn(null);
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setDropOn(null);
          if (dragId) onMove(dragId, node.id);
          setDragId(null);
        }}
      >
        <span className={"lp-chev" + (isFolder ? "" : " leaf") + (isFolder && isOpen ? " open" : "")}>
          {isFolder ? CHEV : null}
        </span>
        <span className={"lp-ico " + (isFolder ? "lp-ico-folder" : `lp-ico-${extOf(node.name)}`)}>
          {isFolder ? FOLDER : FILE}
        </span>

        {isEditing ? (
          <RenameInput
            defaultValue={node.name}
            onCommit={(value) => commitRename(node.id, value, editing.isNew)}
            onCancel={() => cancelRename(node.id, editing.isNew)}
          />
        ) : (
          <>
            <span className="lp-name">{node.name || "untitled"}</span>
            <button
              className="lp-more"
              title="Actions"
              onClick={(event) => {
                event.stopPropagation();
                setSelected(node.id);
                const box = event.currentTarget.getBoundingClientRect();
                menuFor(node, box.left - 160, box.bottom + 4);
              }}
            >
              {DOTS}
            </button>
          </>
        )}
      </div>
    );

    const children =
      isFolder && isOpen ? (
        <div className="lp-children">
          {node.children?.map((child) => rowFor(child))}
        </div>
      ) : null;

    return (
      <div className="lp-node" key={node.id}>
        {row}
        {children}
      </div>
    );
  }

  const { files, folders } = countWorkspace(root);
  const visibleTopLevel = root.children?.filter(matches) ?? [];

  return (
    <div
      className="lp"
      ref={panelRef}
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      <div className="lp-head">
        <span className="lp-title">Explorer</span>
        <div className="lp-actions">
          <button className="lp-icon-btn" title="New File" onClick={() => create("file")}>
            {FILE}
          </button>
          <button className="lp-icon-btn" title="New Folder" onClick={() => create("folder")}>
            {FOLDER}
          </button>
          <button
            className="lp-icon-btn"
            title="Collapse All"
            onClick={() => setExpanded(new Set())}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            >
              <path d="M3 5.5h10M5.5 8.5h5M7.5 11.5h1" />
            </svg>
          </button>
        </div>
      </div>

      <div className="lp-search">
        <span className="lp-search-ico">
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <circle cx="7" cy="7" r="4.3" />
            <path d="M10.5 10.5 14 14" />
          </svg>
        </span>
        <input
          placeholder="Search files…"
          spellCheck={false}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => event.stopPropagation()}
        />
      </div>

      <div
        className="lp-tree"
        onContextMenu={(event) => {
          if (event.target.closest(".lp-row")) return;
          event.preventDefault();
          rootMenu(event.clientX, event.clientY);
        }}
        onDragOver={(event) => {
          if (dragId) event.preventDefault();
        }}
        onDrop={(event) => {
          if (dragId && !event.target.closest(".lp-row")) {
            event.preventDefault();
            onMove(dragId, root.id);
            setDragId(null);
          }
        }}
      >
        {visibleTopLevel.map((node) => rowFor(node))}
        {visibleTopLevel.length === 0 && (
          <div className="lp-tree-empty">
            {trimmed ? "No matching files" : "Nothing here yet — create a file"}
          </div>
        )}
      </div>

      <div className="lp-foot">
        <span className="lp-dot" />
        <span>
          {files} file{files === 1 ? "" : "s"} · {folders} folder
          {folders === 1 ? "" : "s"}
        </span>
      </div>

      {menu && (
        <div
          className="lp-ctx"
          style={{
            left: Math.max(6, Math.min(menu.x, window.innerWidth - 210)),
            top: Math.max(
              6,
              Math.min(
                menu.y,
                window.innerHeight -
                  (menu.items.filter((item) => !item.sep).length * 30 + 20),
              ),
            ),
          }}
        >
          {menu.items.map((item, i) =>
            item.sep ? (
              <div className="lp-ctx-sep" key={`sep${i}`} />
            ) : (
              <button
                key={item.label}
                className={"lp-ctx-item" + (item.danger ? " danger" : "")}
                onClick={() => {
                  setMenu(null);
                  item.action();
                }}
              >
                <span className="lp-ctx-ico">{item.icon}</span>
                <span>{item.label}</span>
                {item.short && <span className="lp-ctx-short">{item.short}</span>}
              </button>
            ),
          )}
        </div>
      )}

      {confirm && (
        <div
          className="lp-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) setConfirm(null);
          }}
        >
          <div className="lp-dialog">
            <h3>Delete “{confirm.name || "untitled"}”?</h3>
            <p>
              {confirm.type === "folder"
                ? "The folder and everything inside it will be removed. This cannot be undone."
                : "This file will be removed. This cannot be undone."}
            </p>
            <div className="lp-dialog-actions">
              <button className="lp-btn ghost" onClick={() => setConfirm(null)}>
                Cancel
              </button>
              <button className="lp-btn danger" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The inline rename field. Commits exactly once — Enter, Escape, or blur —
 * so a blur caused by pressing Enter never fires a second, stale commit.
 */
function RenameInput({ defaultValue, onCommit, onCancel }) {
  const done = useRef(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const input = inputRef.current;
    if (input) {
      input.focus();
      input.select();
    }
  }, []);

  const once = (fn, value) => {
    if (done.current) return;
    done.current = true;
    fn(value);
  };

  return (
    <input
      className="lp-rename"
      ref={inputRef}
      defaultValue={defaultValue}
      spellCheck={false}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Enter") {
          event.preventDefault();
          once(onCommit, event.currentTarget.value);
        } else if (event.key === "Escape") {
          event.preventDefault();
          once(onCancel);
        }
      }}
      onBlur={(event) => once(onCommit, event.currentTarget.value)}
    />
  );
}
