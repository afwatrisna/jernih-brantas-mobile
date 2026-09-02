# Monitor simplification validation

The updated desktop preview confirms the sidebar now contains the brand and primary navigation only; the station list and its heading are absent. The map-side Pengukuran Lapangan promo card is absent from the rendered page, and the existing Monitor action bar still provides the path to Field Mode.

A 390px embedded viewport check confirms the sidebar is hidden, mobile bottom navigation remains visible, mobile station cards remain visible, the desktop chip row remains hidden, and the map card is still rendered at 343px wide. The `.field-callout` element count is zero, so the removed field card does not appear on mobile or desktop. No other mobile layout element was changed.

## AI Assistant UI removal validation

The refreshed desktop preview shows no AI Assistant section; the Monitor action bar and map remain present. A 390px embedded viewport reports `assistantCount: 0`, mobile bottom navigation visible at 351px wide, mobile station controls visible at 343px wide, action bar visible at 343px wide, and map visible at 343px wide. The Field Mode section is not rendered while Monitor is active. The backend API route remains part of the production build.

## Leaflet preview check

The Next.js build passes, but the refreshed desktop preview still shows the `Memuat peta interaktif…` placeholder after waiting. The Monitor content and action bar render, so the issue is isolated to client-side Leaflet mounting or loading. Further console inspection is required before delivery.

## Leaflet mounted-preview check

The dynamic Leaflet map now mounts and shows OpenStreetMap attribution, zoom controls, and the map frame. The preview reveals a rendering issue: loaded tiles occupy only a small centered rectangle while most of the map frame remains gray, and station markers are not visibly distributed across the full map. This requires a map-size/invalidation or initial viewport fix before delivery.

## Leaflet CSS fix check

After importing `leaflet/dist/leaflet.css` in the root layout and restarting the preview, the Leaflet map mounts with OpenStreetMap tile images, Leaflet attribution, zoom controls, filters, and the station summary. The previous gray-area issue is expected to be resolved; marker positions and interaction still need a direct DOM/visual check.

## Leaflet interaction check

The map now fills the full frame with OpenStreetMap tiles and Brantas linework; all five markers are positioned within the geographic map area. Toggling “Tampilkan nama wilayah sensor” renders permanent labels for Malang Hulu, Kediri, Jombang, Mojokerto, and Surabaya Hilir without layout overflow.

## Filter interaction check

The Anomali filter updates the Leaflet map and shows the existing empty-state message when no station currently matches; the map tiles remain visible and the selected-station summary remains available. Permanent labels are still active during the filter test.

## Follow-up interaction check

The Anomali filter correctly produces the map empty state without removing the map itself. After restoring the Semua filter, all five permanent station labels are visible; a programmatic marker check attempted while the Anomali filter was empty and therefore did not find a marker. The visible map state is restored for final validation.

## Marker selection check

A visible Leaflet marker activates successfully. The popup shows the station name, subtitle, NTU reading, and current Normal status, while the selected-station summary remains available below the map. The existing station-selection callback is therefore connected to the new map.

## Updated GeoJSON preview check

The Monitor preview shows the new Brantas MultiLineString route across the map, including the Kali Porong branch toward Porong/Sidoarjo. The five station labels now include `Porong / Sidoarjo Hilir`, the sensor-name checkbox is checked by default, and the legend below the map renders Normal, Waspada, Perlu ditinjau, and Aliran sungai without overflow.
