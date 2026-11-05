---
title: "Career Navigator: Planning a Career Backwards with AI"
description: "How I am turning career planning into an editable, evidence-aware system for UCI EE students."
published: 2026-11-04
category: Projects
draft: false
tags:
  - UCI
  - AI Tools
  - Engineering
  - Career Planning
  - Notes
---

# Career Navigator: Planning a Career Backwards with AI

Career advice often starts with a broad question: "What job should I get?" I have found that question too vague to be useful on its own. My current project, Career Navigator, started as Future Planner and became a more concrete system for working backwards from a target role.

The first release is aimed at UCI Electrical Engineering students. The scope is intentionally small. I want to connect a career direction to skills, courses, projects, research opportunities, and applications without pretending that a model can predict hiring or replace an advisor.

## Starting from the destination

The product has three modes:

- Explore: inspect career directions, skills, campus resources, and opportunity starting points.
- Build: turn missing evidence into a sequence of courses, projects, research actions, or conversations.
- Apply: compare a job description and track applications manually.

This reverse-planning model makes the next step more concrete. If I select Embedded Systems Engineer, the system can show the skills in that framework, compare them with the profile I entered, and generate a small set of suggested actions. The result is a planning signal. It is not a claim that I am qualified, that a job is available, or that a particular path is the correct one.

## What the current code actually does

The local fixtures include four planning archetypes: embedded systems, digital or ASIC engineering, robotics, and undergraduate research. They also include sample job postings and official starting points for UCI career services, Samueli School of Engineering, and research resources.

The word sample is deliberate. The current job postings are clearly marked sample data, and the live job-board allowlist is empty. Greenhouse, Lever, and Ashby adapter interfaces exist as seams for future work, but the unconfigured adapter returns an unavailable state instead of pretending it fetched current jobs. Campus source adapters are also empty.

The deterministic engine is the most complete part of the MVP. It normalizes skill aliases from user-entered text, compares demonstrated and missing skills, filters mandatory eligibility requirements, analyzes a posting with matched, missing, and unknown states, and generates a capped roadmap based on workload. It also has date checks for stale jobs and expired opportunities.

The roadmap is editable in the UI. I can accept, reject, or mark an action done and move it up or down. The Apply section is a manual tracker with statuses such as saved, planning, applied, interviewing, rejected, and offered. Nothing is submitted automatically.

## Why evidence belongs in the interface

A career plan becomes risky when it hides where a statement came from. Official UCI links are starting points, not proof that a particular course, lab opening, or deadline is current. A sample job is useful for demonstrating matching logic, but it cannot be used as a live application target.

That is why the data types carry source evidence, retrieved dates, applicability notes, and evidence kinds such as official, sample, user-provided, and unknown. The UI labels sample frameworks and official links separately. If a requirement cannot be mapped safely, the engine marks it unknown instead of forcing a match.

I also want deterministic rules and AI suggestions to remain separate. The current AI module is only a provider-independent interface plus a deterministic provider. It makes no network request and makes no model claim. A future AI provider would need explicit consent before private profile data leaves the browser.

## Local privacy and ownership

The default privacy settings are local-first: local persistence is off, private data is not sent to an AI provider, and automatic application submission is off. A user can enable local saving, save a draft, or export the current plan as JSON. The point is to keep the plan editable and portable.

The test suite covers the deterministic engine's normalization, matching, roadmap generation, stale and expiry logic, and validation helpers. The current implementation is a functional Phase 1 foundation with local sample data and a manual tracker. It is not a deployed recruiting platform, a live job aggregator, or an AI service.

## What comes next

I want to improve source adapters one at a time, starting with a narrow allowlist and visible retrieval timestamps. I also want better UCI catalog-year handling, stronger course and research evidence, imported resume or course-plan review, and a clearer way to compare a real posting with the source text that produced each requirement.

The bigger idea is simple: use AI where it helps me explore and explain, but keep the plan, evidence, status, and final decision under the user's control. Career Navigator should help me make a better next move, not hand me an answer that cannot be checked.

Evidence notes: Career Navigator types, fixtures, engine, adapters, privacy defaults, UI, and tests audited in the SoraMax repository on 2026-11-04.