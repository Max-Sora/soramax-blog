---
title: "What Actually Worked (and Failed) in My AI Agent Experiments"
description: "A debugging devlog about metadata limits, evidence gates, deduplication, and local integration tests."
published: 2026-11-04
category: AI
draft: false
tags:
  - AI Tools
  - Engineering
  - Debugging
  - Evidence
  - Notes
  - Bilibili
---

# What Actually Worked (and Failed) in My AI Agent Experiments

The useful part of an engineering agent is not the confidence of its wording. It is whether I can trace a result back to an input, a test, and a known limitation. My recent EE-Agent work gave me several small failures that were more educational than a clean demo.

## 1. Metadata is not video understanding

**What I was trying to do:** I wanted Scout to find hardware debugging material from Bilibili and pass useful candidates to the Hardware Debugger.

**What went wrong:** Public pages were sometimes blocked, blank, or incomplete. The accessible path could return a title or platform metadata without giving me the video body. The pilot report recorded 15 candidates, but zero had video content read. No frames, audio, subtitles, or comments were analyzed.

**How I investigated it:** I compared the saved feed records, metadata responses, and the normalization code. The adapter checks blocked status, non-JSON content, read errors, and HTTP 412 conditions. It marks the result partial when those signals appear.

**What the evidence actually showed:** The system could know that a candidate existed and preserve its title, URL, and metadata. It could not know the exact circuit, waveform, fault, or repair outcome. The correct state was partial_metadata_only with content_read=false.

**What I changed or would change next:** I kept the record candidate/unverified and made the boundary explicit in the answer shape. A future run needs an authorized content path or user-provided logs before any technical conclusion is upgraded.

## 2. Deduplication only helps when identity is specific

**What I was trying to do:** I wanted repeated Scout imports to enrich a case without multiplying the same source or merging unrelated videos.

**What went wrong:** A generic symptom such as "black screen" is not enough identity. Two videos can discuss similar symptoms while showing different devices, versions, and evidence.

**How I investigated it:** The integration tests imported records with separate Bilibili IDs and then repeated the import. The schema keeps source identity, case identity, version fields, and evidence status separate. The acceptance fixture recorded three new rows and one enrichment on the first follow-up import, then zero new rows and four duplicates on repeat. The source count did not grow during the repeat.

**What the evidence actually showed:** Deduplication worked for the tested identities and source URLs. It did not prove that two real hardware faults were the same fault. The version-aware filter also excluded a non-matching historical case in the regression suite.

**What I changed or would change next:** I would keep BVID or source identity in the key, preserve multiple sources for the same normalized problem, and require stronger device and version evidence before merging anything beyond the source record.

## 3. Evidence gating is more useful than a confident answer

**What I was trying to do:** I wanted a retrieval answer that could combine documented engineering principles, similar cases, and possible root causes.

**What went wrong:** A naive answer would collapse all three into one explanation. That would make a Microsoft or Espressif document look like proof of what happened in an unrelated Bilibili video.

**How I investigated it:** The isolated WeChat retrieval tests queried a documented TDR principle, historical GPU test data, an Espressif camera baseline, and a Bilibili candidate. The answer shape kept engineering_principles, similar_cases, and unverified_root_causes in separate fields.

**What the evidence actually showed:** The isolated suite passed 6/6 API scenarios. The Bilibili candidate stayed content_read=false, verification=unverified, and candidate_submit returned pending_review with persisted=false and auto_promoted=false. That is a safer success than a fabricated diagnosis.

**What I changed or would change next:** I would make those status fields visible in every UI or generated report. The system should say what it read, what it inferred, and what still needs a measurement.

## 4. A local dry-run is not a live integration

**What I was trying to do:** I wanted to see whether DSH could load a read-only WeChat skill and retrieve a knowledge row.

**What went wrong:** The ordinary shell-backed DSH path repeatedly exited with 0xC0000142 before meaningful commands ran. That blocked claims about the normal runtime.

**How I investigated it:** I compared the failed shell evidence with an isolated headless DSH Session using a task-local home, a deterministic local provider, and a file-backed fixture. The isolated session loaded the skill and queried the SQLite knowledge path.

**What the evidence actually showed:** The isolated session exited successfully, but it did not test an external model, a desktop WeChat binding, or phone delivery. The runtime production database also remained schema v1 and was not migrated.

**What I changed or would change next:** I report the isolated result as verified local integration and the shell path as blocked. This distinction is less impressive than claiming the whole system works, but it is the only description I can defend.

My main lesson is that failed access is still evidence. It tells me where the system boundary is, which tests are fixtures, and what I must measure before the next claim.

Evidence notes: local Scout, Debugger, SQLite, and WeChat reports audited on 2026-11-04.