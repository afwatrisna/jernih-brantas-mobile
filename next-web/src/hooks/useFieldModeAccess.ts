"use client";

import { useCallback, useEffect, useState } from "react";

import { getSupabaseClient } from "@/lib/supabase-client";

export type FieldModeRole = "viewer" | "field_operator" | "admin";

export type FieldModeAccess = {
  email: string;
  displayName: string | null;
  role: FieldModeRole;
  stationIds: string[];
};

type ProfileRow = {
  display_name: string | null;
  role: FieldModeRole;
};

type MembershipRow = {
  station_id: string;
};

/**
 * Reads the current Supabase Auth session and the RLS-limited profile data.
 * Database policies remain the final authority for every manual Field Mode write.
 */
export function useFieldModeAccess() {
  const [access, setAccess] = useState<FieldModeAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [issue, setIssue] = useState("");

  const refresh = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setAccess(null);
      setIssue("Konfigurasi Supabase browser belum tersedia.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setIssue("");
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setAccess(null);
      setLoading(false);
      return;
    }

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      setAccess(null);
      setIssue("Sesi petugas tidak dapat diverifikasi. Silakan masuk kembali.");
      setLoading(false);
      return;
    }

    const user = userData.user;
    if (!user) {
      setAccess(null);
      setLoading(false);
      return;
    }

    const [{ data: profile, error: profileError }, { data: memberships, error: membershipError }] = await Promise.all([
      supabase.from("profiles").select("display_name, role").eq("id", user.id).maybeSingle<ProfileRow>(),
      supabase.from("station_memberships").select("station_id").eq("user_id", user.id).returns<MembershipRow[]>(),
    ]);

    if (profileError || membershipError || !profile) {
      setAccess(null);
      setIssue("Akun sudah masuk, tetapi belum memiliki profil akses Field Mode.");
      setLoading(false);
      return;
    }

    setAccess({
      email: user.email ?? "akun petugas",
      displayName: profile.display_name,
      role: profile.role,
      stationIds: (memberships ?? []).map((membership) => membership.station_id),
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const requestMagicLink = useCallback(async (email: string) => {
    const supabase = getSupabaseClient();
    const normalizedEmail = email.trim().toLowerCase();
    if (!supabase) throw new Error("Konfigurasi Supabase browser belum tersedia.");
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) throw new Error("Masukkan alamat email petugas yang valid.");

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) throw new Error(error.message);
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (supabase) await supabase.auth.signOut();
    setAccess(null);
    setIssue("");
  }, []);

  return { access, loading, issue, refresh, requestMagicLink, signOut };
}
