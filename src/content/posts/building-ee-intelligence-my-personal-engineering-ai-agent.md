---
title: "Building EE Intelligence: My Personal Engineering AI Agent"
description: "Why I am building a local-first engineering assistant for technical research and hardware debugging."
published: 2026-11-04
category: AI
draft: false
tags:
  - AI Tools
  - Engineering
  - Hardware
  - Embedded Systems
  - Notes
  - Research
---

# Building EE Intelligence: My Personal Engineering AI Agent

I started EE Intelligence because technical information is easy to collect and surprisingly hard to reuse. While learning electrical engineering, reading embedded documentation, and thinking through hardware faults, I kept running into the same problem: a useful answer was often spread across a video, a datasheet, a forum post, a test log, and my own half-finished notes. I wanted a personal system that could organize those pieces without pretending that a language model had measured the hardware.

The project is also known as EE-Agent. I think of it less as a chatbot and more as an engineering workbench:

Information Sources -> Scout -> Knowledge Store -> Debugger / Reasoning -> Human Review / Actions

Each arrow has a different confidence level. Keeping those levels separate is the most important design decision so far.

## Scout: finding information without upgrading it

Scout is the discovery and collection layer. It can normalize machine-readable feed output, identify a Bilibili candidate, preserve its source URL and metadata, and mark whether content was actually read. The current adapter deliberately turns blocked or partial responses into metadata-only records. A record with content_read=false remains unverified.

That distinction matters for engineering work. A video title can suggest a useful direction, but it cannot prove a waveform, a damaged component, a repair, or even the exact device shown. The local pilot produced structured candidates, but it did not read video frames, audio, subtitles, or comments. The live dsh-bili-whale runtime was not treated as verified because its process path remained blocked.

I would describe Scout as implemented in its local normalization and reporting pieces, and verified through saved fixtures and regression tests. Its live external collection path is still blocked or only partially verified.

## Knowledge Store: memory with provenance

The knowledge layer uses SQLite and FTS5 to make technical principles and sources searchable. It keeps knowledge statements separate from diagnostic cases. That separation prevents a documented general rule from being mistaken for a repair history.

The isolated schema-v3 fixture has knowledge rows, source citations, fingerprints for deduplication, and integrity checks. The acceptance records show repeated imports adding duplicates or enrichment without growing the source list unnecessarily. The existing runtime database is a different state: it is schema v1, contains cases, and does not yet contain the v3 knowledge tables. The isolated result therefore proves the design and test path, not a production migration.

This component is implemented and verified in the isolated database path. Production deployment remains pending.

## Hardware Debugger: cases, not guesses

The Hardware Debugger stores structured symptoms, versions, hypotheses, evidence, tests, and verification status. It can search similar cases and recommend low-risk next steps. Its test cases are useful for checking the schema and ranking behavior, but they are not personal repair outcomes.

The system must keep the sentence "this is a plausible hypothesis" separate from "this component is damaged." A model can help me decide what to inspect next. It cannot replace a multimeter reading, an oscilloscope trace, a known-good swap, or a repeatable reproduction.

The local debugger and integration tests are implemented and have recorded passing suites. The evidence records still classify many cases as test data or unverified.

## Bilibili, WeChat, and the human boundary

Bilibili and bili-whale are useful possible sources, but the current work is constrained by access behavior and evidence quality. The adapter can preserve partial metadata and HTTP or blocked status. It does not convert that response into a full analysis.

The WeChat bridge is a read-only boundary around case and knowledge retrieval. An isolated DSH Session successfully loaded a local skill and queried an isolated SQLite fixture through a deterministic provider. That is a verified local integration result. It is not proof of a live desktop WeChat binding, an external model call, or phone delivery. The shell-backed DSH path also has a recorded 0xC0000142 startup failure, so I keep that as a blocker rather than hiding it behind the successful isolated run.

## What I want this system to become

The next layer is not simply "add a smarter model." I want better source adapters, stronger version-aware retrieval, evidence summaries that show exactly what was read, and a review queue that makes uncertain cases easy to inspect. Research notes and content drafts could use the same provenance rules.

The final action still belongs to a human. EE Intelligence can reduce the work of finding, organizing, comparing, and remembering. It should never turn an inference into a measurement or an unverified candidate into a fact.

Evidence notes: local EE-Agent acceptance, Scout, Debugger, and WeChat reports audited on 2026-11-04.