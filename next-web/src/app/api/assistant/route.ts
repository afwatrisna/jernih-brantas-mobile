import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextResponse } from "next/server";

import { AssistantAccessError, buildAssistantContext, type AssistantDisplayContext } from "@/lib/assistant/context";
import { buildAssistantSystemPrompt, getAssistantPolicyMessage } from "@/lib/assistant/policy";
import { consumeAssistantRequest } from "@/lib/assistant/rate-limit";
import type { ReadingSource } from "@/lib/jernih-data";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const MODEL_ID = "gemini-3.1-flash-lite";
const VALID_SOURCES: ReadingSource[] = ["simulation", "manual", "sensor"];

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

  const authorization = request.headers.get("authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Masuk sebagai petugas untuk menggunakan Asisten Jernih." }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  const user = userData.user;
  if (userError || !user) {
    return NextResponse.json({ error: "Sesi petugas tidak dapat diverifikasi. Silakan masuk kembali." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Akun belum memiliki profil akses Jernih." }, { status: 403 });
  }

  const policyMessage = getAssistantPolicyMessage(input.message);
  if (policyMessage) {
    return NextResponse.json({ answer: policyMessage, blocked: true }, { status: 200 });
  }

  const rate = consumeAssistantRequest(user.id);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Batas 10 pertanyaan per jam untuk pilot Asisten Jernih telah tercapai. Coba lagi nanti." }, { status: 429 });
  }

  try {
    const context = await buildAssistantContext({
      userId: user.id,
      role: profile.role,
      stationId: input.stationId,
      display: input.display,
    });

    const result = await generateText({
      model: google(MODEL_ID),
      system: buildAssistantSystemPrompt(JSON.stringify(context)),
      prompt: input.message,
      maxOutputTokens: 450,
      temperature: 0.2,
    });

    return NextResponse.json({
      answer: result.text.trim(),
      dataStatus: context.dataStatus,
      stationName: context.selectedStation.name,
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
