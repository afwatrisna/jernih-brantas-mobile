import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextResponse } from "next/server";

import { AssistantAccessError, buildAssistantContext, type AssistantDisplayContext } from "@/lib/assistant/context";
import { buildAssistantSystemPrompt, classifyAssistantIntent, getAssistantPolicyMessage } from "@/lib/assistant/policy";
import { JERNIH_KNOWLEDGE_BASE } from "@/lib/assistant/knowledge-base";
import { consumeAnonymousEducationalRequest, consumeAssistantRequest } from "@/lib/assistant/rate-limit";
import type { ReadingSource } from "@/lib/jernih-data";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const MODEL_ID = "gemini-3.1-flash-lite";
const VALID_SOURCES: ReadingSource[] = ["simulation", "manual", "sensor"];
const VALID_ROLES = ["viewer", "field_operator", "admin"] as const;
type AssistantRole = (typeof VALID_ROLES)[number];

function isDisplayContext(value: unknown): value is AssistantDisplayContext {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.ntu === "number"
    && Number.isFinite(candidate.ntu)
    && candidate.ntu >= 0
    && candidate.ntu <= 500
    && typeof candidate.source === "string"
    && VALID_SOURCES.includes(candidate.source as ReadingSource)
    && typeof candidate.simulationEnabled === "boolean"
    && typeof candidate.demoDisplayMode === "boolean";
}

function parseRequest(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  const message = typeof candidate.message === "string" ? candidate.message.trim() : "";
  const stationId = typeof candidate.stationId === "string" ? candidate.stationId.trim() : "";
  if (!message || message.length > 1000 || !stationId || stationId.length > 40 || !isDisplayContext(candidate.display)) return null;
  return { message, stationId, display: candidate.display };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Permintaan asisten tidak valid." }, { status: 400 });
  }

  const input = parseRequest(body);
  if (!input) {
    return NextResponse.json({ error: "Pertanyaan, stasiun, atau context data tidak valid." }, { status: 400 });
  }

  const policyMessage = getAssistantPolicyMessage(input.message);
  if (policyMessage) {
    return NextResponse.json({ answer: policyMessage, blocked: true }, { status: 200 });
  }

  const intent = classifyAssistantIntent(input.message);
  const authorization = request.headers.get("authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "");

  // Educational questions ("apa itu NTU?", "apa beda NTU dan pH?") never touch
  // Supabase station data or Gemini with station context — they only use the
  // curated knowledge base. Anonymous visitors can ask these without signing
  // in, under a strict per-IP limit, so first-time visitors are not blocked
  // from basic explanations behind a login wall.
  if (!token && intent === "educational") {
    const identifier = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";
    const rate = consumeAnonymousEducationalRequest(identifier);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Batas ${rate.limit} pertanyaan edukatif per jam untuk pengunjung belum masuk telah tercapai. Masuk untuk kuota lebih besar dan pertanyaan tentang data stasiun.` },
        { status: 429 },
      );
    }

    try {
      const result = await generateText({
        model: google(MODEL_ID),
        system: buildAssistantSystemPrompt("{}", JERNIH_KNOWLEDGE_BASE, "educational"),
        prompt: input.message,
        maxOutputTokens: 450,
        temperature: 0.2,
      });

      return NextResponse.json({
        answer: result.text.trim(),
        intent: "educational",
        knowledgeBase: { id: JERNIH_KNOWLEDGE_BASE.id, title: JERNIH_KNOWLEDGE_BASE.title, version: JERNIH_KNOWLEDGE_BASE.version },
        sources: [{ type: "knowledge_base", label: `${JERNIH_KNOWLEDGE_BASE.id} — ${JERNIH_KNOWLEDGE_BASE.title}` }],
        sourceCount: 1,
        suggestions: ["Apa itu NTU?", "Apa perbedaan NTU dan pH?"],
        remaining: rate.remaining,
        anonymous: true,
        generatedAt: new Date().toISOString(),
      });
    } catch {
      return NextResponse.json({ error: "Asisten Jernih sedang tidak tersedia. Data dashboard tetap dapat digunakan seperti biasa." }, { status: 503 });
    }
  }

  if (!token) {
    return NextResponse.json({ error: "Masuk untuk menggunakan Asisten Jernih." }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  const user = userData.user;
  if (userError || !user) {
    return NextResponse.json({ error: "Sesi tidak dapat diverifikasi. Silakan masuk kembali." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || !VALID_ROLES.includes(profile.role as AssistantRole)) {
    return NextResponse.json({ error: "Akun belum memiliki role akses Jernih yang valid." }, { status: 403 });
  }

  const role = profile.role as AssistantRole;

  const rate = consumeAssistantRequest(user.id, role);
  if (!rate.allowed) {
    return NextResponse.json({ error: `Batas ${rate.limit} pertanyaan per jam untuk role ${role} telah tercapai. Coba lagi nanti.` }, { status: 429 });
  }

  try {
    const context = await buildAssistantContext({
      userId: user.id,
      role,
      stationId: input.stationId,
      display: input.display,
    });

    const result = await generateText({
      model: google(MODEL_ID),
      system: buildAssistantSystemPrompt(JSON.stringify(context), JERNIH_KNOWLEDGE_BASE, intent),
      prompt: input.message,
      maxOutputTokens: 450,
      temperature: 0.2,
    });

    const sources = intent === "educational"
      ? [{ type: "knowledge_base", label: `${JERNIH_KNOWLEDGE_BASE.id} — ${JERNIH_KNOWLEDGE_BASE.title}` }]
      : context.selectedStation.readingCount24h > 1
        ? [{ type: "station_data", label: "Station Data" }, { type: "historical_data", label: "Historical Data (24 jam)" }]
        : [{ type: "station_data", label: "Station Data" }];
    const stationName = context.selectedStation.name;
    const suggestions = intent === "educational"
      ? [`Apa hubungan ${stationName} dengan kualitas air?`, "Apa perbedaan NTU dan pH?"]
      : intent === "data"
        ? ["Lihat tren turbidity", "Bandingkan dengan upstream", "Ada anomaly?"]
        : ["Lihat tren 7 hari", "Bandingkan dengan upstream", "Cek rainfall"];

    return NextResponse.json({
      answer: result.text.trim(),
      intent,
      dataStatus: context.dataStatus,
      stationName,
      knowledgeBase: { id: JERNIH_KNOWLEDGE_BASE.id, title: JERNIH_KNOWLEDGE_BASE.title, version: JERNIH_KNOWLEDGE_BASE.version },
      sources,
      sourceCount: sources.length,
      suggestions,
      remaining: rate.remaining,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof AssistantAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json({ error: "Asisten Jernih sedang tidak tersedia. Data dashboard tetap dapat digunakan seperti biasa." }, { status: 503 });
  }
}
