"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import InlineImage from "@/components/InlineImage";
import StarOfDavid from "@/components/StarOfDavid";
import AnalysisForm, { FormData } from "@/components/AnalysisForm";
import AnalysisResult from "@/components/AnalysisResult";

// ── Types ─────────────────────────────────────────────────────────────────────
type Mode = "chat" | "form";
type FormPhase = "form" | "loading" | "result";
type Message = { role: "user" | "assistant"; content: string };
type Session = { id: string; title: string; created: string; messages: Message[] };

// Converts FormData into a plain-text user message for the API.
// Mirrors what the old form-based route used to build server-side.
function formDataToMessage(data: FormData): string {
  function fmt(dateStr: string) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-MX", {
      timeZone: "UTC", year: "numeric", month: "long", day: "numeric",
    });
  }

  let msg = `Realiza el análisis cabalístico completo para:\n\n`;
  msg += `**Nombre:** ${data.name.trim()}\n`;
  msg += `**Fecha de nacimiento:** ${fmt(data.birthDate)}\n`;
  if (data.birthTime)  msg += `**Hora de nacimiento:** ${data.birthTime}\n`;
  if (data.birthCity)  msg += `**Ciudad/País:** ${data.birthCity.trim()}\n`;
  if (data.gender)     msg += `**Género:** ${data.gender}\n`;
  if (data.fatherName) msg += `**Nombre del padre:** ${data.fatherName.trim()}\n`;
  if (data.context?.trim()) msg += `**Contexto / pregunta:** ${data.context.trim()}\n`;

  if (data.secondName?.trim() && data.secondBirthDate) {
    msg += `\n---\n\n**Segunda persona:**\n`;
    msg += `**Nombre:** ${data.secondName.trim()}\n`;
    msg += `**Fecha de nacimiento:** ${fmt(data.secondBirthDate)}\n`;
    if (data.secondBirthTime) msg += `**Hora:** ${data.secondBirthTime}\n`;
    if (data.secondBirthCity) msg += `**Ciudad/País:** ${data.secondBirthCity.trim()}\n`;
    if (data.secondGender)    msg += `**Género:** ${data.secondGender}\n`;
    msg += `\nIncluye análisis completo de ambas personas y la sección de Análisis de Interacción.`;
  }

  return msg;
}

// ── Storage keys ──────────────────────────────────────────────────────────────
const KEY_USER = "kabbalah_current_user";
const KEY_SESSIONS = "kabbalah_sessions";

// ── Helpers ───────────────────────────────────────────────────────────────────
function genId() {
  return "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

function deriveTitle(text: string) {
  const words = text.trim().split(/\s+/).slice(0, 6).join(" ");
  return words.length > 2 ? words : "Lectura cabalista";
}

// Normalise Claude's various pexels marker formats into standard markdown image syntax.
// Claude sometimes writes "pexels: query" as plain text or code-wrapped — this catches all variants.
function normalisePexels(text: string): string {
  text = text.replace(/`pexels:\s*([^`\n]+)`/gi, (_, q) =>
    `![img](pexels://${q.trim().replace(/\s+/g, "+")})`
  );
  text = text.replace(/(?<!\]\()pexels:\s*([^\n)]+)/gi, (_, q) =>
    `![img](pexels://${q.trim().replace(/\s+/g, "+")})`
  );
  return text;
}

// ── MessageContent ─────────────────────────────────────────────────────────────
// Renders assistant text with full markdown + inline Pexels images.
// During streaming we skip image parsing (pexels:// URL may still be incomplete).
function MessageContent({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  const processed = normalisePexels(content);

  return (
    <div className="assistant-content">
      <ReactMarkdown
        components={{
          img({ src, alt }) {
            const s = typeof src === "string" ? src : "";
            if (s.startsWith("pexels://") && !isStreaming) {
              const query = decodeURIComponent(s.replace("pexels://", "").replace(/\+/g, " "));
              return <InlineImage query={query} />;
            }
            // During streaming or non-pexels images: render nothing / placeholder
            if (s.startsWith("pexels://")) return null;
            return <img src={s} alt={alt ?? ""} style={{ width: "100%", borderRadius: 3 }} />;
          },
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}

// ── LoginScreen ────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (name: string, email: string) => void }) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Completa todos los campos.");
      return;
    }
    if (tab === "register" && !name.trim()) {
      setError("Ingresa tu nombre.");
      return;
    }
    const displayName = tab === "register" ? name.trim() : email.split("@")[0];
    onLogin(displayName, email.trim().toLowerCase());
  }

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-logo">
          <StarOfDavid size={36} />
          <h1 className="login-title">Analista Cabalista</h1>
        </div>
        <div className="gold-divider" />
        <p className="login-subtitle">Identidad · Tikún · Propósito</p>

        <div className="login-tabs">
          <button
            className={`login-tab${tab === "login" ? " active" : ""}`}
            onClick={() => { setTab("login"); setError(""); }}
          >
            Entrar
          </button>
          <button
            className={`login-tab${tab === "register" ? " active" : ""}`}
            onClick={() => { setTab("register"); setError(""); }}
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {tab === "register" && (
            <div className="form-field">
              <label className="field-label">Nombre</label>
              <input
                className="field-input"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Tu nombre completo"
              />
            </div>
          )}
          <div className="form-field">
            <label className="field-label">Correo electrónico</label>
            <input
              className="field-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div className="form-field">
            <label className="field-label">Contraseña</label>
            <input
              className="field-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-submit">
            {tab === "login" ? "Entrar" : "Crear cuenta"}
          </button>
          <button
            type="button"
            className="login-guest"
            onClick={() => onLogin("Invitado", "invitado@kabbalah.app")}
          >
            Continuar sin cuenta
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [mode, setMode] = useState<Mode>("chat");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // ── Chat mode state ──
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamText, setStreamText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [input, setInput] = useState("");

  // ── Form mode state ──
  const [formPhase, setFormPhase] = useState<FormPhase>("form");
  const [formAnalysis, setFormAnalysis] = useState("");
  const [formStreaming, setFormStreaming] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(KEY_USER);
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setUserName(u.name);
        setUserEmail(u.email);
        setLoggedIn(true);
      } catch { /* ignore */ }
    }
  }, []);

  // Load sessions once user is identified
  useEffect(() => {
    if (!loggedIn || !userEmail) return;
    const list = readSessions(userEmail);
    setSessions(list);
    if (list.length === 0) {
      doCreateSession(userEmail, []);
    } else {
      selectSession(list[0].id, list);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn, userEmail]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, streamText]);

  // ── Storage helpers ──────────────────────────────────────────────────────────
  function readSessions(email: string): Session[] {
    try {
      const all = JSON.parse(localStorage.getItem(KEY_SESSIONS) || "{}");
      return (all[email] || []) as Session[];
    } catch { return []; }
  }

  function writeSessions(email: string, list: Session[]) {
    const all = JSON.parse(localStorage.getItem(KEY_SESSIONS) || "{}");
    all[email] = list;
    localStorage.setItem(KEY_SESSIONS, JSON.stringify(all));
  }

  // ── Session management ───────────────────────────────────────────────────────
  function doCreateSession(email: string, existing: Session[]) {
    const s: Session = { id: genId(), title: "Nueva lectura", created: new Date().toISOString(), messages: [] };
    const updated = [s, ...existing];
    setSessions(updated);
    writeSessions(email, updated);
    setCurrentId(s.id);
    setMessages([]);
  }

  function selectSession(id: string, list?: Session[]) {
    const source = list ?? sessions;
    const s = source.find(x => x.id === id);
    if (!s) return;
    setCurrentId(id);
    setMessages(s.messages);
  }

  function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    writeSessions(userEmail, updated);
    if (id === currentId) {
      if (updated.length > 0) selectSession(updated[0].id, updated);
      else doCreateSession(userEmail, []);
    }
  }

  // Persist messages + optional new title for the current session
  function persistSession(msgs: Message[], title?: string) {
    setSessions(prev => {
      const updated = prev.map(s =>
        s.id !== currentId ? s : { ...s, messages: msgs, ...(title ? { title } : {}) }
      );
      writeSessions(userEmail, updated);
      return updated;
    });
  }

  // ── Auth ─────────────────────────────────────────────────────────────────────
  function handleLogin(name: string, email: string) {
    localStorage.setItem(KEY_USER, JSON.stringify({ name, email }));
    setUserName(name);
    setUserEmail(email);
    setLoggedIn(true);
  }

  function handleLogout() {
    localStorage.removeItem(KEY_USER);
    setLoggedIn(false);
    setUserName("");
    setUserEmail("");
    setSessions([]);
    setMessages([]);
    setCurrentId(null);
  }

  // ── Form mode submit ──────────────────────────────────────────────────────────
  async function handleFormSubmit(data: FormData) {
    setFormPhase("loading");
    setFormAnalysis("");
    setFormError(null);
    setFormStreaming(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: formDataToMessage(data) }] }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(err.error);
      }

      setFormPhase("result");
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setFormAnalysis(full);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error desconocido");
      setFormPhase("form");
    } finally {
      setFormStreaming(false);
    }
  }

  // ── Chat ─────────────────────────────────────────────────────────────────────
  async function sendMessage() {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";

    const isFirst = messages.length === 0;
    const userMsg: Message = { role: "user", content: text };
    const history: Message[] = [...messages, userMsg];

    setMessages(history);
    setIsStreaming(true);
    setStreamText("");

    if (isFirst) persistSession(history, deriveTitle(text));

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(err.error);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value, { stream: true });
        setStreamText(full);
      }

      const assistantMsg: Message = { role: "assistant", content: full };
      const final: Message[] = [...history, assistantMsg];
      setMessages(final);
      setStreamText("");
      persistSession(final);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      const errMsg: Message = { role: "assistant", content: `**Error:** ${msg}` };
      const final = [...history, errMsg];
      setMessages(final);
      setStreamText("");
      persistSession(final);
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 130) + "px";
  }

  // ── Render: login ────────────────────────────────────────────────────────────
  if (!loggedIn) return <LoginScreen onLogin={handleLogin} />;

  const currentSession = sessions.find(s => s.id === currentId);

  // ── Render: app ──────────────────────────────────────────────────────────────
  return (
    <div className="app-layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <StarOfDavid size={24} />
            <span className="sidebar-logo-text">Analista Cabalista</span>
          </div>
        </div>

        <div className="user-info">
          <div className="user-avatar">{userName.charAt(0).toUpperCase()}</div>
          <span className="user-name">{userName}</span>
          <button className="logout-btn" onClick={handleLogout}>Salir</button>
        </div>

        <button className="new-session-btn" onClick={() => doCreateSession(userEmail, sessions)}>
          + Nueva lectura
        </button>

        <p className="sessions-label">Lecturas guardadas</p>

        <div className="sessions-list">
          {sessions.length === 0 ? (
            <p className="empty-sessions">Sin lecturas guardadas</p>
          ) : (
            sessions.map(s => (
              <div
                key={s.id}
                className={`session-item${s.id === currentId ? " active" : ""}`}
                onClick={() => selectSession(s.id)}
              >
                <p className="session-item-title">{s.title}</p>
                <p className="session-item-date">{fmtDate(s.created)}</p>
                <button
                  className="session-delete"
                  onClick={e => deleteSession(s.id, e)}
                  title="Eliminar"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        <div className="sidebar-footer">
          <p className="sidebar-footer-text">Basado en Kabbalah y tradición judía</p>
        </div>
      </aside>

      {/* ── Main area ── */}
      <main className="main-area">
        {/* Header */}
        <div className="main-header">
          <div className="main-header-left">
            {mode === "chat" ? (
              <span className="session-title-display">
                {currentSession?.title ?? "Nueva lectura"}
              </span>
            ) : (
              <span className="session-title-display">Análisis por Formulario</span>
            )}
          </div>
          <div className="header-actions">
            {/* Mode toggle */}
            <div className="mode-toggle">
              <button
                className={`mode-btn${mode === "chat" ? " active" : ""}`}
                onClick={() => setMode("chat")}
              >
                💬 Chat
              </button>
              <button
                className={`mode-btn${mode === "form" ? " active" : ""}`}
                onClick={() => { setMode("form"); setFormPhase("form"); setFormAnalysis(""); setFormError(null); }}
              >
                📋 Formulario
              </button>
            </div>
            {mode === "chat" && (
              <button className="header-btn" onClick={() => doCreateSession(userEmail, sessions)}>
                + Nueva
              </button>
            )}
            <button
              className="header-btn pdf-btn"
              onClick={() => window.print()}
              disabled={mode === "chat" ? messages.length === 0 : formPhase !== "result"}
            >
              Imprimir
            </button>
          </div>
        </div>

        {/* ── Form mode ── */}
        {mode === "form" && (
          <div className="form-mode-body">
            {formError && (
              <div className="form-error-banner">{formError}</div>
            )}
            {formPhase === "form" && (
              <AnalysisForm onSubmit={handleFormSubmit} />
            )}
            {formPhase === "loading" && (
              <div className="form-loading">
                <div style={{ animation: "spin 8s linear infinite", display: "inline-block" }}>
                  <StarOfDavid size={44} />
                </div>
                <p className="form-loading-text">Consultando las letras...</p>
              </div>
            )}
            {formPhase === "result" && (
              <AnalysisResult
                analysis={formAnalysis}
                isStreaming={formStreaming}
                onReset={() => { setFormPhase("form"); setFormAnalysis(""); }}
              />
            )}
          </div>
        )}

        {/* Chat body + input */}
        {mode === "chat" && (
        <>
        <div className="chat-body" ref={chatRef}>
          {messages.length === 0 && !isStreaming && (
            <div className="welcome-screen">
              <div className="welcome-star">✦</div>
              <h2 className="welcome-title">El conocimiento espera ser revelado</h2>
              <div className="welcome-divider" />
              <p className="welcome-desc">
                Para comenzar una lectura, escribe tu nombre completo, fecha de
                nacimiento y hora si la conoces.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <p className="message-label">
                {msg.role === "user" ? "Tú" : "Analista Cabalista"}
              </p>
              <div className="message-bubble">
                {msg.role === "user" ? (
                  msg.content
                ) : (
                  <MessageContent content={msg.content} />
                )}
              </div>
            </div>
          ))}

          {/* Live streaming bubble */}
          {isStreaming && (
            <div className="message assistant">
              <p className="message-label">Analista Cabalista</p>
              <div className="message-bubble">
                {streamText ? (
                  <MessageContent content={streamText} isStreaming />
                ) : (
                  <div className="loading-dots">
                    <span /><span /><span />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="input-footer">
          <div className="input-row">
            <textarea
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={onInputChange}
              onKeyDown={onKeyDown}
              placeholder="Escribe tu nombre, fecha y hora de nacimiento..."
              rows={1}
              disabled={isStreaming}
            />
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={isStreaming || !input.trim()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className="input-hint">Ctrl + Enter para enviar</p>
        </div>
        </>
        )}
      </main>
    </div>
  );
}
