# Condition card validation notes

The reference screenshot was inspected as the single ordered tile at 554x160. The intended hierarchy is a compact dark green card with station context and name at the upper left, a prominent NTU value below, a small simulation badge at the upper right, a subtle gauge on the right, and a single readable condition summary bar across the bottom.

The updated Next.js preview was checked at desktop width. The condition summary renders with separate text and status-pill alignment; the compact hero remains 190px high without overlap. A hidden 390px iframe check confirmed the mobile station-card controls remain visible, the desktop station-chip row is hidden, the mobile bottom navigation is present, and the hero remains contained at 343px wide and 265px high.
