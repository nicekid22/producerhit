---
name: ph-conversion
description: Conversion audit — funnel CRO, trial to paid, landing pages
model: qwen2.5
---

# ph-conversion — ProducerHit

Nightly funnel audit of producerhit.com. Read `metrics/latest.md` + `ph-funnel-doctor` reports.

Output: `reports/daily/conversion-*.md` — CRO fixes ranked by revenue impact.

Overlap OK with Revenue OS (`ph-revenue-optimizer`).
