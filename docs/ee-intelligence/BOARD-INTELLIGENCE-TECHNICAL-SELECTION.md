# EE Intelligence Board Intelligence technical selection

## Scope

The first web slice is deliberately local-first: KiCad `.kicad_pcb` is parsed in the browser, KiCad schematic/PDF metadata is detected as `PARTIAL`, and unsupported content returns an explicit status. Private uploads are not copied into `public/` or sent to an AI provider.

## Open-source review

- TRACE Boardviewer (MIT) was inspected at commit available on 2026-11-14. Its parser registry and `tests/fuzz/corpus` cover KiCad, GenCAD, FZ, Eagle, BDV/BVR, IPC-D-356 and related formats. Its board-view tests model component, pad, net, cross-probe and geometry behavior.
- OpenBoardView (MIT) was inspected in `src/openboardview/FileFormats`, `Board.*`, `PartList.*` and `NetList.*`. It is a native C++ viewer and parser collection; it is not shipped as a browser dependency.
- KiCad CLI documentation remains the preferred future server-side conversion boundary when a trusted installation is available. The browser adapter does not claim to replace KiCad's full parser.
- Framework InputModules is the preferred public sample source for future fixture imports; no commercial board is represented by the current synthetic example.

## Normalized model

`src/lib/board-intelligence/types.ts` keeps logical net membership separate from functional, manual and visual relationships. A same-net member list does not claim copper adjacency or inner-layer routing. `sourceConfidence` and `verificationStatus` remain attached to each component.

## Current support matrix

| Format | Status | Current behavior |
|---|---|---|
| KiCad PCB | SUPPORTED | Local component, pad, position, side and named-net extraction |
| KiCad schematic | PARTIAL | Detect and index source metadata; no connectivity claim |
| PDF | PARTIAL | Detect only; no PDF electrical graph claim |
| BoardView BRD / BDV / BVR | EXPERIMENTAL | Explicit status, no fabricated parse |
| GenCAD / IPC-D-356 | EXPERIMENTAL | Explicit status, no fabricated parse |
| Other formats | UNSUPPORTED | Explicit error/status |

## Photo alignment

The current page supports an uploaded photo, three manual anchor confirmations, a reviewable overlay and local session state. It does not infer hidden copper or promote visual guesses to facts. Automatic ORB/SIFT and server-side OpenCV are P1 work.

