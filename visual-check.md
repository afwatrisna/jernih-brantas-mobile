# Monitor simplification validation

The updated desktop preview confirms the sidebar now contains the brand and primary navigation only; the station list and its heading are absent. The map-side Pengukuran Lapangan promo card is absent from the rendered page, and the existing Monitor action bar still provides the path to Field Mode.

A 390px embedded viewport check confirms the sidebar is hidden, mobile bottom navigation remains visible, mobile station cards remain visible, the desktop chip row remains hidden, and the map card is still rendered at 343px wide. The `.field-callout` element count is zero, so the removed field card does not appear on mobile or desktop. No other mobile layout element was changed.

## AI Assistant UI removal validation

The refreshed desktop preview shows no AI Assistant section; the Monitor action bar and map remain present. A 390px embedded viewport reports `assistantCount: 0`, mobile bottom navigation visible at 351px wide, mobile station controls visible at 343px wide, action bar visible at 343px wide, and map visible at 343px wide. The Field Mode section is not rendered while Monitor is active. The backend API route remains part of the production build.
