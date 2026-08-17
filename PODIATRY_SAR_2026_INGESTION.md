# Podiatry SAR 2026 — verified ingestion record

## Status and evidential discipline

This file stages verified source-level material from the 27-page Podiatry SAR transcription for later integration into the canonical registers.

It deliberately separates documentary fact from inference. It does **not** assert that a structural corn/callus was itself neurological, that Podiatry referral was inappropriate, or that the mechanism of recurrence is established.

## Source corrections fixed before ingestion

1. The Merlin Park Podiatry referral/receipt stamp on the older referral is **10 Apr 2017**, not 12 Apr 2017.
2. The Podiatry database distinguishes **Referral Date: 10 Apr 2017** from **Registration Date: 10 Jul 2017**.
3. The database records **First Treated: 14 Sep 2017** and **Patient Last Seen: 25 Mar 2019**.
4. The older referral is a layered document. The underlying referral is dated 10 Apr 2017, but later Parkinson's-era handwriting cannot safely be attributed to 10 Apr 2017 without audit evidence.
5. On the older referral, **Medium Risk — Foot deformities** is visibly ticked; visible Low Risk boxes, including **No neuropathy**, are not ticked.
6. On the 2019 re-referral, all three visible Low Risk boxes are ticked: **No deformity**, **No neuropathy**, and **No PAD**. No High Risk or Medium Risk selection is asserted from that image.

## Longitudinal treatment-series fact

There are eight documented Podiatry treatment appointments between 14 Sep 2017 and 25 Mar 2019. Every one of the eight records pathology at the **left 5th metatarsophalangeal joint (L/5 MTPJ)**.

| Appointment | Source-level finding at left 5th MTPJ |
| --- | --- |
| 14 Sep 2017 | Callus on L/5 MTPJ; callus removed from L/5 MTPJ. |
| 26 Oct 2017 | HD with macerated surrounding skin on L/5 MTPJ; HD enucleated; offloading/template directed to the 5th/L5 MTPJ. |
| 25 Jan 2018 | H.D on L. 5th MTPJ; H.D on L. 5th enucleated. |
| 22 Feb 2018 | Callus present on left 5th MTPJ; debrided and donut-pad offloaded. |
| 22 Mar 2018 | Callus on L.5 MTPJ; debrided. |
| 15 Jun 2018 | Callus on L/5 MTPJ; debrided on L/5th MTPJ. |
| 7 Dec 2018 | Patient: “I get pain under the left side of my left foot”; callus to 5th MTPJ of left foot; foot sketch marked to 5th MTPJ of the left foot. |
| 25 Mar 2019 | Callus overlying HD present on L/5th MTPJ; callus debrided and HD enucleated. |

**Count:** 8 treatment appointments → 8 records documenting pathology at the left 5th MTPJ → **8/8 (100%)** of the surviving treatment series.

The terminology varies between **callus**, **HD**, and corn-related language. The stable source-level feature is the repeated anatomical site, not a single asserted mechanism.

## Additional source-level findings relevant to mechanism questions

- 14 Sep 2017: the patient was recorded as having been diagnosed with Parkinson's in April and saying, “my gait was very bad but it's not any more”. The note does not state why the gait had improved.
- 22 Mar 2018: “Toes clawed.”
- 15 Jun 2018: “Toes clawed 1-3 on both feet.”
- 7 Dec 2018: the patient reported the Ottoform devices were “very effective”, while the insoles were problematic because he felt he slipped around in them. This is adverse/qualifying evidence showing benefit from at least some podiatric intervention.
- 7 Dec 2018: slight leg-length difference and a pronating foot type were documented alongside the recurrent left 5th MTPJ callus.
- 25 Mar 2019: PPL insoles received did not match the requested prescription and were returned for remake.

## 2019 re-referral — source wording

The 2019 Merlin Park Podiatry re-referral records:

> Seen by podiatry in the past due to feet issues in relating to increased tone and abnormal gait relating to Parkinson's disease. Feels foot pain and issue again at present and seeking re-referral to service

Medication recorded: **Neupro Patch 10mg daily in total, Kemadrin, Azilect**.

Visible referral reasons include **Callus** and **Gait abnormalities**. The comments state:

> Parkinsons at very young age has issues with “clawing feet” and pain

The 2019 re-referral shows all three visible Low Risk boxes ticked: **No deformity**, **No neuropathy**, and **No PAD**.

## Proposed fact-register additions

These are staged identifiers only and should be copied into the canonical `FACT_REGISTER.md` after review.

### F1891

**Fact:** The Podiatry database records Referral Date 10 Apr 2017, Registration Date 10 Jul 2017, First Treated 14 Sep 2017, and Patient Last Seen 25 Mar 2019.

**Evidence class:** Podiatry database/SAR record.

**Qualification:** Referral and registration are separate recorded events; the database alone does not establish why registration occurred on 10 Jul 2017.

### F1892

**Fact:** The older Merlin Park Podiatry referral bears a received/date stamp of 10 Apr 2017.

**Evidence class:** contemporaneous referral form within Podiatry SAR.

**Qualification:** The document contains later-appearing handwriting. Not all annotations can safely be dated to 10 Apr 2017.

### F1893

**Fact:** On the older referral, Medium Risk — Foot deformities is visibly ticked; the visible Low Risk boxes, including No neuropathy, are not ticked.

**Evidence class:** referral-form checkbox state.

**Qualification:** No neuropathy diagnosis is inferred from an unticked Low Risk box.

### F1894

**Fact:** On 14 Sep 2017 Podiatry documented callus on the left 5th MTPJ and removed callus from that site.

**Evidence class:** contemporaneous Podiatry treatment note.

### F1895

**Fact:** On 26 Oct 2017 Podiatry documented HD with macerated surrounding skin on the left 5th MTPJ, enucleated the HD, and directed offloading/insole templating to that site.

**Evidence class:** contemporaneous Podiatry treatment note.

### F1896

**Fact:** On 25 Jan 2018 Podiatry documented H.D on the left 5th MTPJ and enucleated it.

**Evidence class:** contemporaneous Podiatry treatment note.

### F1897

**Fact:** On 22 Feb 2018 Podiatry documented callus on the left 5th MTPJ and debrided/offloaded that site.

**Evidence class:** contemporaneous Podiatry treatment note.

### F1898

**Fact:** On 22 Mar 2018 Podiatry documented callus on the left 5th MTPJ and “Toes clawed.”

**Evidence class:** contemporaneous Podiatry treatment note.

### F1899

**Fact:** On 15 Jun 2018 Podiatry documented callus on the left 5th MTPJ and “Toes clawed 1-3 on both feet.”

**Evidence class:** contemporaneous Podiatry treatment note.

### F1900

**Fact:** On 7 Dec 2018 the patient reported pain “under the left side of my left foot”; Podiatry documented callus at the 5th MTPJ of the left foot and marked the 5th MTPJ of the left foot on the foot sketch.

**Evidence class:** contemporaneous Podiatry treatment note.

### F1901

**Fact:** On 7 Dec 2018 the patient reported the Ottoforms were “very effective” and that he did not find the insoles good because he slipped around in them.

**Evidence class:** contemporaneous Podiatry treatment note — patient report.

**Qualification:** This is relevant adverse/qualifying evidence showing benefit from at least some local podiatric intervention.

### F1902

**Fact:** On 25 Mar 2019 Podiatry documented callus overlying HD on the left 5th MTPJ and debrided/enucleated it.

**Evidence class:** contemporaneous Podiatry treatment note.

### F1903

**Fact:** Across all eight documented Podiatry treatment appointments from 14 Sep 2017 through 25 Mar 2019, pathology was documented at the left 5th MTPJ: 8/8 appointments (100%).

**Evidence class:** longitudinal synthesis of the eight contemporaneous treatment notes.

**Qualification:** This establishes repeated anatomical-site documentation. It does not by itself establish neurological, biomechanical, structural, medication-related, or mixed causation.

### F1904

**Fact:** The 2019 Podiatry re-referral states that the patient had previously been seen by Podiatry for “feet issues in relating to increased tone and abnormal gait relating to Parkinson's disease” and sought re-referral because foot pain/issues had recurred.

**Evidence class:** 2019 GP-to-Podiatry referral.

**Qualification:** This is the referrer's recorded clinical characterisation; it is not itself an expert mechanism determination.

### F1905

**Fact:** The 2019 re-referral comments state: “Parkinsons at very young age has issues with ‘clawing feet’ and pain”.

**Evidence class:** 2019 GP-to-Podiatry referral.

### F1906

**Fact:** On the 2019 re-referral, the three visible Low Risk boxes — “No deformity”, “No neuropathy”, and “No PAD” — are ticked.

**Evidence class:** referral-form checkbox state.

**Qualification:** This checkbox state is specific to the 2019 re-referral and should not be conflated with the older 2017 referral.

## Safe proposition-level consequence for later review

The records support a mixed-mechanism question rather than an either/or conclusion. They establish genuine structural/local pathology requiring podiatric treatment, while the later re-referral expressly relates prior foot issues to increased tone and abnormal gait associated with Parkinson's disease. The records do not resolve the relative causal contribution of structural loading, deformity, tone/posture/gait, medication state, or other mechanisms.

A particularly important question for expert review is whether repeated loading of the same left 5th MTPJ site could plausibly have been influenced by neurological tone, posture, gait or clawing while still producing a genuinely structural callus/HD requiring local treatment.

## Quarantined conclusions

Do **not** infer from these records alone that:

- the April 2017 referral originally diagnosed Parkinson's;
- all handwriting on the older referral was entered on 10 Apr 2017;
- the 10 Jul 2017 registration was caused by any particular telephone call, inpatient event, or patient protest;
- the corn/callus itself was Parkinsonian;
- successful podiatric treatment disproves neurological contribution;
- the Podiatry pathway was inappropriate merely because neurological disease was later diagnosed.
