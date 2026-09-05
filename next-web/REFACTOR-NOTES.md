# Refactor `page.tsx` — Jernih Brantas Next.js

## Ringkasan

`next-web/src/app/page.tsx` semula ~608 baris (god component). Refactor ini memecahnya tanpa mengubah perilaku UI.

| Sebelum | Sesudah (fase 1) |
|---------|------------------|
| 608 baris di satu file | ~380 baris di `page.tsx` |
| Helper + UI + section + state campur | Modul terpisah |

## Struktur baru

```
next-web/src/
├── app/page.tsx                      # Orkestrasi + JSX section (lebih ramping)
├── lib/
│   ├── dashboard-types.ts            # Section, Severity, StationInsight, dll.
│   ├── dashboard-utils.ts            # seedHistory, getSeverity, getStationInsight, …
│   └── jernih-data.ts                # (sudah ada — tidak diubah)
├── components/
│   ├── ui/
│   │   ├── icon.tsx
│   │   ├── nav-button.tsx
│   │   ├── status-badge.tsx
│   │   └── data-trust.tsx
│   ├── trend-chart.tsx
│   ├── alert-panel.tsx
│   ├── brantas-map.tsx               # (sudah ada)
│   └── sections/
│       └── settings-section.tsx      # Contoh section ter-extract
└── hooks/
    ├── useSupabaseReadings.ts        # (sudah ada)
    └── useFieldModeAccess.ts         # (sudah ada)
```

## Cara menerapkan

1. Salin file baru ke repo kamu (path relatif sama di bawah `next-web/src/`).
2. Pastikan path alias `@/` mengarah ke `src/` (sudah standar di project ini).
3. Ganti `app/page.tsx` dengan versi baru.
4. Jalankan:

```bash
cd next-web
pnpm lint
pnpm build
pnpm dev
```

## Fase 2 (opsional, disarankan)

- Extract `MonitorSection`, `FieldSection`, `AnalyticsSection` (mirip `SettingsSection`).
- Extract `useDashboardState` untuk memindahkan ~15 `useState` + efek simulasi/localStorage keluar dari `page.tsx`.
- Format ulang JSX yang masih one-liner panjang agar lebih mudah dibaca/di-review.

## Catatan

- Perilaku (simulasi 4 detik, Supabase, Field Mode auth, CSV export, severity) **dipertahankan**.
- CSS class names tidak diubah — tidak perlu sentuh `globals.css`.
