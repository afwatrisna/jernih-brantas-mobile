# Demo mode for presentation

The dashboard now starts with **Data demo untuk presentasi** enabled. In this state, Monitor and Analitik use local simulated readings even when `public.readings` contains Supabase records. The current source remains visibly labelled **SIMULASI**, and the records in Supabase are retained separately.

For tomorrow’s demonstration, open **Atur** and leave both toggles enabled:

1. **Mode Simulasi** keeps the five station values changing for the demo.
2. **Data demo untuk presentasi** keeps Supabase test or live entries from replacing the demo display.

To review Supabase data after the demo, turn off **Data demo untuk presentasi**. It changes only what is displayed; it neither deletes database rows nor changes Field Mode permissions. All simulated values remain illustrative and are not official environmental readings.
