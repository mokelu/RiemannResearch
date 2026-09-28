import { useLayoutEffect, useRef, useState } from "react";
import { validateReasoning } from "../notebook/validate.js";
import { askRiemann } from "./aiClient.js";

/**
 * The chat that feeds the Space. A message goes to the model with the Riemann
 * contract prompt; the model's raw reply is parsed and pushed through the same
 * validation boundary every other edit faces. If it is valid, the structure is
 * handed up to become the Space. If it is not — prose, markdown, a bad tag, a
 * dangling relation — the reason is shown here, and nothing is adopted. The
 * model is never quietly repaired.
 */

const SUGGESTIONS = [
  "Break this claim into sentences and tag them",
  "What assumptions underlie this argument?",
  "Map how these points support or contradict each other",
];

let counter = 0;
const nextId = () => `m${(counter += 1)}`;

function greeting() {
  return {
    id: nextId(),
    role: "assistant",
    text:
      "Ask me to reason about something. I turn your request into tagged sentences and the connections between them, and that structure becomes what the center shows.",
    ts: Date.now(),
  };
}

export function ChatPanel({ onAdopt }) {
  const [messages, setMessages] = useState([greeting]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  const push = (msg) =>
    setMessages((m) => [...m, { id: nextId(), ts: Date.now(), ...msg }]);

  // Keep the newest message in view whenever the thread or busy state changes.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  async function send(text) {
    const content = (text ?? draft).trim();
    if (!content || busy) return;

    push({ role: "user", text: content });
    setDraft("");
    setBusy(true);

    try {
      const raw = await askRiemann(content);

      let candidate;
      try {
        candidate = JSON.parse(raw);
      } catch {
        push({
          role: "error",
          text:
            "The model did not return valid JSON, so nothing was adopted. It replied:\n\n" +
            raw,
        });
        return;
      }

      const result = validateReasoning(candidate);
      if (!result.valid) {
        push({
          role: "error",
          text:
            "The boundary rejected the model's structure:\n• " +
            result.errors.join("\n• "),
        });
        return;
      }

      onAdopt(candidate);
      push({
        role: "assistant",
        text: `Adopted: ${candidate.nodes.length} sentence${
          candidate.nodes.length === 1 ? "" : "s"
        } and ${candidate.relations.length} connection${
          candidate.relations.length === 1 ? "" : "s"
        }. The center now shows this structure.`,
      });
    } catch (error) {
      push({ role: "error", text: error.message });
    } finally {
      setBusy(false);
    }
  }

  function newChat() {
    setBusy(false);
    setMessages([greeting()]);
  }

  return (
    <aside className="chat-dock">
      <header className="chat-head">
        <span className="chat-dot" aria-hidden="true" />
        <span className="chat-title">Assistant</span>
        <span className="chat-model">Riemann · live boundary</span>
        <button className="chat-new" onClick={newChat} title="Start a new chat">
          New chat
        </button>
      </header>

      <div className="chat-log" ref={scrollRef}>
        {messages.map((m) => (
          <Message key={m.id} msg={m} />
        ))}
        {busy && <TypingRow />}
      </div>

      {messages.length <= 1 && !busy && (
        <div className="chat-suggest">
          {SUGGESTIONS.map((s) => (
            <button key={s} className="suggestion" onClick={() => send(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <footer className="chat-composer">
        <textarea
          className="chat-input"
          rows={1}
          placeholder="Ask the assistant to reason…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button
          className="chat-send"
          onClick={() => send()}
          disabled={!draft.trim() || busy}
          title="Send"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              fill="currentColor"
              d="M3.4 20.4l17.45-7.48a1 1 0 0 0 0-1.84L3.4 3.6a.993.993 0 0 0-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z"
            />
          </svg>
        </button>
      </footer>
      <div className="chat-foot">
        Replies become the Space only if they clear the validation boundary.
      </div>
    </aside>
  );
}

function Message({ msg }) {
  if (msg.role === "error") {
    return (
      <div className="msg bot">
        <div className="avatar error" aria-hidden="true">
          !
        </div>
        <div className="bubble-wrap">
          <div className="bubble error">{msg.text}</div>
        </div>
      </div>
    );
  }

  const isUser = msg.role === "user";
  return (
    <div className={isUser ? "msg user" : "msg bot"}>
      <div className="avatar" aria-hidden="true">
        {isUser ? "You" : "AI"}
      </div>
      <div className="bubble-wrap">
        <div className="bubble">{msg.text}</div>
        <time className="stamp">
          {new Date(msg.ts).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </div>
    </div>
  );
}

function TypingRow() {
  return (
    <div className="msg bot">
      <div className="avatar" aria-hidden="true">
        AI
      </div>
      <div className="bubble typing" aria-label="assistant is thinking">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
