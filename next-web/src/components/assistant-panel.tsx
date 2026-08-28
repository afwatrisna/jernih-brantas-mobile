"use client";

import { FormEvent, useMemo, useState } from "react";

import type { FieldModeAccess } from "@/hooks/useFieldModeAccess";
import type { ReadingSource } from "@/lib/jernih-data";
import { describeAssistantSource } from "@/lib/assistant/policy";
import { getSupabaseClient } from "@/lib/supabase-client";

type ChatMessage = { id: string; role: "user" | "assistant"; text: string; sourceLabel?: string; knowledgeBase?: { id: string; title: string; sourceCount: number } };

type AssistantPanelProps = {
  station: { id: string; name: string; ntu: number };
  source: ReadingSource;
  simulationEnabled: boolean;
  demoDisplayMode: boolean;
  access: FieldModeAccess | null;
  accessLoading: boolean;
  onOpenFieldMode: () => void;
};

const QUICK_QUESTIONS = [
  "Ringkas kondisi stasiun yang dipilih.",
  "Apa tren NTU dalam 24 jam terakhir?",
  "Apakah data yang ditampilkan simulasi, manual, atau sensor?",
];

export function AssistantPanel({ station, source, simulationEnabled, demoDisplayMode, access, accessLoading, onOpenFieldMode }: AssistantPanelProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const status = useMemo(() => describeAssistantSource(source), [source]);

  async function askAssistant(rawMessage: string) {
    const message = rawMessage.trim();
    if (!message || submitting) return;
    setError("");

    const supabase = getSupabaseClient();
    const { data: sessionData } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
    if (!sessionData.session) {
      setError("Masuk melalui Magic Link untuk menggunakan Asisten Jernih.");
      return;
    }

    const messageIndex = messages.length;
    const userMessage: ChatMessage = { id: `user-${messageIndex}`, role: "user", text: message };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          message,
          stationId: station.id,
          display: { ntu: station.ntu, source, simulationEnabled, demoDisplayMode },
        }),
      });
      const payload = await response.json() as { answer?: string; error?: string; dataStatus?: { label?: string }; knowledgeBase?: { id?: string; title?: string }; sourceCount?: number };
      const answer = payload.answer;
      if (!response.ok || !answer) throw new Error(payload.error ?? "Asisten belum dapat menjawab pertanyaan ini.");
      setMessages((current) => [...current, {
        id: `assistant-${messageIndex}`,
        role: "assistant",
        text: answer,
        sourceLabel: payload.dataStatus?.label ?? status.label,
        knowledgeBase: payload.knowledgeBase?.id && payload.knowledgeBase.title ? { id: payload.knowledgeBase.id, title: payload.knowledgeBase.title, sourceCount: payload.sourceCount ?? 1 } : undefined,
      }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Asisten belum dapat dihubungi.");
    } finally {
      setSubmitting(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void askAssistant(input);
  }

  return (
    <section className={`assistant-panel ${open ? "open" : ""}`} aria-label="AI Asisten Jernih">
      <div className="assistant-heading">
        <div><span>AI ASISTEN JERNIH</span><h2>Tanya tentang data, bukan penetapan resmi.</h2><p>Read-only · {status.label} · sumber selalu ditampilkan.</p></div>
        <button type="button" className="assistant-toggle" onClick={() => setOpen((value) => !value)} aria-expanded={open}>{open ? "Tutup" : "Buka chat"}</button>
      </div>
      {open && <div className="assistant-body">
        <div className="assistant-context"><b>{station.name}</b><span>{station.ntu.toFixed(1)} NTU · {status.label}</span><small>{status.notice}</small></div>
        {accessLoading ? <p className="assistant-info">Memeriksa akses akun…</p> : !access ? <div className="assistant-login"><p>Masuk diperlukan agar pertanyaan terhubung ke scope Supabase yang diizinkan.</p><button type="button" onClick={onOpenFieldMode}>Buka Field Mode untuk masuk →</button></div> : <>
          <div className="assistant-quick" aria-label="Contoh pertanyaan">{QUICK_QUESTIONS.map((question) => <button type="button" key={question} disabled={submitting} onClick={() => void askAssistant(question)}>{question}</button>)}</div>
          <div className="assistant-messages" aria-live="polite">{messages.length === 0 ? <p className="assistant-empty">Saya dapat merangkum tren dan status sumber data, serta menjelaskan dasar kualitas air dari KB-01.</p> : messages.map((message) => <article key={message.id} className={message.role}><span>{message.role === "user" ? "Anda" : "Asisten Jernih"}{message.role === "assistant" && message.sourceLabel ? ` · ${message.sourceLabel}` : ""}</span><p>{message.text}</p>{message.role === "assistant" && message.knowledgeBase && <div className="assistant-sources"><span>Sumber</span><strong>📚 {message.knowledgeBase.id} — {message.knowledgeBase.title}</strong><small>🔗 {message.knowledgeBase.sourceCount} sumber referensi</small></div>}</article>)}</div>
          <form className="assistant-form" onSubmit={submit}><label><span>Pertanyaan</span><textarea value={input} onChange={(event) => setInput(event.target.value)} maxLength={1000} rows={3} placeholder="Contoh: Ringkas tren NTU stasiun ini." /></label><button type="submit" disabled={submitting || !input.trim()}>{submitting ? "Menganalisis…" : "Tanya Asisten"}</button></form>
        </>}
        {error && <p className="assistant-error" role="alert">{error}</p>}
        <p className="assistant-footnote">Akses Viewer dibatasi 5 pertanyaan per jam; Field Operator dan Admin 10. Asisten tetap read-only dan tidak menentukan air aman, tercemar, atau layak dikonsumsi.</p>
      </div>}
    </section>
  );
}
