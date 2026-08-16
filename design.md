# Jernih Brantas — Mobile Interface Design

## Product Intent

Jernih Brantas is a calm, informative river-awareness experience that presents the Brantas watershed as a living public resource. The mobile app will translate the supplied prototype into a **portrait-first (9:16)** experience for one-handed use, using familiar iOS navigation, readable environmental indicators, and concise community-oriented storytelling.

## Screen List

| Screen | Primary content and functionality |
|---|---|
| Beranda | A horizontally scrollable station selector, the active station's prominent NTU condition card, compact river statistics, a tappable stylized river map, and a path to manual recording. |
| Stasiun | Five native list cards for Malang (Hulu), Kediri, Jombang, Mojokerto, and Surabaya (Hilir), each showing location, NTU, classification, and latest update. |
| Pengukuran | A field-friendly form to select a station, enter a 0–500 NTU reading, choose an existing turbidimeter, and save the record locally. |
| Analitik | An active-station switcher, range filters, current/average/minimum/maximum cards, a responsive line chart, and a vertical history mode. |
| Pengaturan | A clearly labelled simulation toggle, local-data information, classification reference, prototype information, and a confirmed data-reset flow. |

## Layout and Interaction Principles

The home screen uses a top-aligned summary with clear hierarchy: greeting and location context, a large water-status card, compact metric cards, and a short list of recent updates. The primary navigation sits at the bottom, making the principal destinations easily reachable with one hand. List rows and cards provide visible press feedback, while content details open in native navigation flows or sheets rather than introducing web-like overlays.

## Key User Flows

| User goal | Flow |
|---|---|
| Monitor a river condition | Open Beranda → swipe the station selector or tap a river-map marker → read the active NTU card and its classification. |
| Detect an area requiring attention | Open Stasiun → review the color-labelled cards → tap a card → arrive at its updated Beranda condition. |
| Record a field reading | Tap the prominent centre Pengukuran action → choose station and equipment → enter NTU → save → receive confirmation and return to Beranda. |
| Analyze the local record | Open Analitik → choose a station → choose a time range → inspect summary metrics, chart, or vertical history. |
| Manage simulation or reset data | Open Pengaturan → toggle simulation with an explicit state label, or choose reset → confirm in a destructive-action sheet. |

## Color and Typography

The brand palette will center on **Brantas Teal `#0D7775`** for trusted water information, **River Deep `#084C61`** for headings and navigation, **Water Mist `#E7F5F4`** for soft surfaces, **Silt Sand `#F6F1E7`** for environmental warmth, and **Leaf Green `#4F8A5B`** for positive water-quality states. Cautionary states will use restrained amber and coral tones that remain readable against white. Typography will use the platform system font with clear iOS-style scale and generous line-height for Indonesian-language reading.

## Accessibility and iOS Alignment

All interactive controls will have a comfortably sized touch target, meaningful labels, and high-contrast text. The interface will keep the most important information above the fold, avoid dense dashboards, support dynamic text where available, and use standard tab navigation and presentation patterns familiar to iOS users.
