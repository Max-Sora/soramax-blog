---
title: "OAI Summer Bridge 2026: Building Saturn Module 2"
description: Field notes from the OAI Summer Bridge space-themed technical challenge.
published: 2026-08-28
category: Projects
draft: false
tags:
  - UCI
  - OAI
  - Arduino
  - Laser Cutting
  - Prototyping
  - Engineering
---

# OAI Summer Bridge 2026: Building Saturn Module 2

OAI Summer Bridge gave us a space-themed technical challenge, and our piece of it was a Saturn station: Module 2. I spent most of my time thinking through the building and enclosure, then turning that idea into something we could actually cut, fit, wire, and revise.

The enclosure started as CAD, then became DXF files and laser-cut parts. We used 1/8-inch material, which made the slot fit matter much more than it did on screen. Small tolerance changes affected whether pieces slid together cleanly, needed sanding, or made the whole structure fight us. That loop of CAD, cut, test, and adjust became the most useful part of the build.

Inside the module, we worked with an Arduino Uno R3, a breadboard, wiring, servo motors, and DC motors. Getting the physical layout right was only half the job. The other half was making the power and signal paths understandable enough that we could debug them when something stopped behaving normally.

We had a few real reminders that prototypes can be unforgiving. Power distribution and breadboard wiring caused trouble, including a damaged breadboard, and we also had moments where a motor behaved in ways we did not expect. Those setbacks made the lesson concrete: check the supply path first, keep wiring legible, and change one thing at a time instead of guessing across the whole system.

My main takeaways were about power distribution, wiring discipline, tolerance, and iterative prototyping. A project like this is not only the final enclosure or the Arduino code. It is the chain of small decisions that makes the next revision easier to build and easier to understand.

Outside our module, I also enjoyed seeing the range of research presentations around the program. Water-cycle work, ozone-prediction ideas, and data-to-policy projects made the space challenge feel connected to a wider set of questions. It was a good reminder that engineering can move between physical prototypes, data, and public-impact research without staying in one lane.
