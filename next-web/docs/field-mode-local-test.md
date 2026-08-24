# Field Mode local test evidence

## Initial render

The Supabase-integrated development dashboard loaded successfully through the local Next.js server on port 3000. The Monitor view rendered all five Brantas stations, marked fallback values as simulation, and displayed the new Supabase-aware storage labels without a browser-visible runtime error.

## Navigation check

The first automated browser clicks on the Field Mode navigation control did not change the visible section. The browser console remained empty, so the next validation step uses direct DOM inspection to determine whether the issue is with the interaction harness or the rendered page event handling.

Direct invocation of the first rendered Field Mode button also left the Monitor view visible. A subsequent page inspection confirmed that the server-rendered page remained intact, with no console error. This requires checking whether the externally proxied development browser has loaded the Next.js client assets correctly before treating it as an application defect.

The proxied page reported `document.readyState = complete` and loaded the expected Next.js development chunks from the local server. The Field Mode buttons were rendered and enabled, but the DOM inspection did not expose a React props marker and invoking the button did not transition the section. This is isolated to the browser interaction harness until it can be reproduced in a normal local browser session.

Opening the same server at direct `127.0.0.1:3000` still showed the correct Monitor page but the automated click did not transition to Field Mode. Separately, the identical local browser-to-server route accepted a controlled `manual` reading labelled `TEST ONLY - local Field Mode validation` with HTTP 201, and the entry was confirmed in Supabase. The remaining interactive-toast assertion therefore requires a normal manually operated local browser rather than this automation harness.

After adding the approved development-origin configuration and restarting the local server, the page hydrated correctly. The dashboard read the verified Supabase test record as a manual input, updated Malang Hulu to 12.3 NTU, and the Field Mode navigation opened successfully in the browser automation session.

The interactive Field Mode form accepted a controlled value of 13.1 NTU for Malang Hulu and rendered the expected `Jernih · Kelas II` classification. The next step submits this deliberately labelled local test entry and checks the visible success feedback plus Supabase record.

The browser submitted the 13.1 NTU test entry successfully. The form reset, the Malang Hulu monitor value updated to 13.1 NTU, and Data Trust showed `INPUT MANUAL` with `NTU-Logger demo · TEST ONLY (local Field Mode)`. The toast is intentionally transient; it had cleared by the subsequent inspection after the three-second display interval.

## Supabase verification

The `public.readings` table contained the browser-submitted record with `station_id = malang`, `ntu = 13.1`, `source = manual`, and the explicit `TEST ONLY (local Field Mode)` equipment label. A prior 12.3 NTU route-level test entry was also present and explicitly marked as test-only. These are controlled development records, **not official water-quality readings**.

## Final checks

`pnpm test`, `pnpm lint`, and `pnpm build` all completed successfully after the integration. The built route list includes the protected `/api/readings` endpoint and the development-only `/api/readings/client-ingest` bridge.
