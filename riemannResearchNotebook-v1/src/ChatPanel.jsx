import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * A modern AI chat dock. It is a self-contained UI — no network calls. The
 * "assistant" replies are simulated locally (see `fakeAssistantReply`) so the
 * panel feels alive without a backend. Wire `send()` to a real model later by
 * swapping that one function.
 */

const SUGGESTIONS = [
  "Explain this dataset",
  "What tag fits this sentence?",
  "Find weak reasoning",
  "What connects these sentences?",
];

let counter = 0;
const nextId = () => `m${(counter += 1)}`;

function greeting() {
  return {
    id: nextId(),
    role: "assistant",
    text:
      "I'm Laya, your notebook assistant. Ask me to tag sentences, stress-test a chain of reasoning, or trace how two sentences connect. This is a UI preview — replies here are simulated.",
    ts: Date.now(),
  };
}

export function ChatPanel() {
  const [messages, setMessages] = useState([greeting]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);
  const timerRef = useRef(null);

  // Keep the newest message in view whenever the thread or typing state changes.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  function send(text) {
    const content = (text ?? draft).trim();
    if (!content || typing) return;

    const userMsg = { id: nextId(), role: "user", text: content, ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setDraft("");
    setTyping(true);

    timerRef.current = setTimeout(() => {
      const reply = {
        id: nextId(),
        role: "assistant",
        text: fakeAssistantReply(content),
        ts: Date.now(),
      };
      setMessages((m) => [...m, reply]);
      setTyping(false);
    }, 700 + Math.random() * 700);
  }

  function newChat() {
    clearTimeout(timerRef.current);
    setTyping(false);
    setMessages([greeting()]);
  }

  return (
    <aside className="chat-dock">
      <header className="chat-head">
        <span className="chat-dot" aria-hidden="true" />
        <span className="chat-title">Assistant</span>
        <span className="chat-model">Riemann · local preview</span>
        <button className="chat-new" onClick={newChat} title="Start a new chat">
          New chat
        </button>
      </header>

      <div className="chat-log" ref={scrollRef}>
        {messages.map((m) => (
          <Message key={m.id} msg={m} />
        ))}
        {typing && <TypingRow />}
      </div>

      {messages.length <= 1 && !typing && (
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
          placeholder="Message the assistant…"
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
          disabled={!draft.trim() || typing}
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
        Replies here are simulated. The assistant can be wrong — check the structure.
      </div>
    </aside>
  );
}

function Message({ msg }) {
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
      <div className="bubble typing" aria-label="assistant is typing">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

// A stand-in for a real model: keyword-pick a plausible, on-topic reply so the
// panel demonstrates its full range (empty answer, long answer, list, code).
function fakeAssistantReply(prompt) {
  const p = prompt.toLowerCase();

  if (p.includes("tag")) {
    return "Give me the sentence and I'll pick a registered tag. For a statement you're treating as established, FACT or EVIDENCE fit; for something you're betting on, HYPOTHESIS or PREDICTION.";
  }
  if (p.includes("connect") || p.includes("relation") || p.includes("wire")) {
    return "Connections are the AI's own writing: a relation names how one sentence joins another — implies, supports, leans on. The names are free text on purpose; the structure only asks that both ends exist.";
  }
  if (p.includes("weak") || p.includes("reason") || p.includes("chain")) {
    return "Reading the chain top to bottom: a few premises feed the conclusion, but one hop looks like an assumption doing the work of evidence. I'd pin that node and ask what it rests on.";
  }
  if (p.includes("dataset") || p.includes("explain")) {
    return "This dataset is a small reasoning graph: nodes are tagged sentences, wires are named relations. Flip to the Document tab for the prose read, or Cells to edit them.";
  }
  if (p.includes("json")) {
    return "Here's the shape the AI returns and the validator checks:\n\n{\n  \"nodes\": [ { \"id\": \"n1\", \"text\": \"…\", \"tag\": \"CLAIM\" } ],\n  \"relations\": [ { \"from\": \"n1\", \"relation\": \"implies\", \"to\": \"n2\" } ]\n}";
  }

  return "Noted. In the real build I'd answer from your live structure — for now this preview only simulates the assistant. Try asking me about tags, connections, or the reasoning chain.";
}
