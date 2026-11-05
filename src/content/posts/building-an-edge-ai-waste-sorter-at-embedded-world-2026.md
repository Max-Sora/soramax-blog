---
title: "Building an Edge AI Waste Sorter at Embedded World 2026"
description: "A first-person engineering log from building the ZOT ROT or NOT conveyor prototype."
published: 2026-11-04
category: Projects
draft: false
tags:
  - Embedded Systems
  - Edge AI
  - Arduino
  - Computer Vision
  - Prototyping
  - Hackathon
---

# Building an Edge AI Waste Sorter at Embedded World 2026

At embedded world North America in Anaheim, I joined a four-person team for the Edge AI Hackathon. Our project was called ZOT ROT or NOT: a camera-powered conveyor that tried to separate organic waste, recyclable material, and trash. The problem sounded simple until we had to make a physical object, a vision model, a Linux process, a microcontroller sketch, and several power paths cooperate under a short deadline.

We chose waste sorting because the failure mode is easy to understand. In a busy dining area or event hall, one item in the wrong bin can contaminate a larger recycling stream. A conveyor gave us a concrete way to show the loop: place an item on the belt, capture an image, classify it, display the result, and use the result to control the hardware.

## The system we were trying to build

The main board was an Arduino UNO Q, which gave us a Linux side for higher-level Python work and an MCU side for lower-level C++ control. A USB camera supplied the visual input. The Linux process handled the model and sent a category across Arduino Router Bridge. The MCU then drove the output devices: an SSD1306 I2C OLED, indicator LEDs, and the motor control path.

The mechanical side was a lightweight laser-cut conveyor kit with a DC motor. We kept the conveyor motor on its own battery supply instead of pulling motor current through the logic path. That separation was a practical attempt to reduce noise and current spikes while we were still trying to make the rest of the system understandable.

The published Edge Impulse log reports a dataset of 244 labeled images across organic, recycle, and trash. The unoptimized model reached 89.6% validation accuracy and had an estimated on-device latency of about 5 ms. Those are model report numbers. They are not a measurement of real-world sorting accuracy or of the full end-to-end conveyor latency, and I want to keep that distinction clear.

## Where the time went

The hackathon schedule made integration the real project. A small change could involve the camera, a USB hub, Wi-Fi, the Linux runtime, Bridge messages, the OLED wiring, and the motor supply at the same time. That is too many possible failure points for random debugging.

We first made the MCU side do something visible with a basic LED test. We then used an I2C scanner to confirm the OLED address. The display wiring also taught us a specific UNO Q lesson: the familiar A4/A5 assumption from older Arduino boards did not give us the result we expected. Moving SDA and SCL to the board's dedicated pins fixed the display path.

The camera needed a powered USB-C hub, and Wi-Fi became a separate source of schedule pressure. The public project log records connection problems with available networks and phone hotspots. That mattered because a pipeline can be logically correct while still being difficult to test when the board cannot stay connected long enough to upload, run, and observe a result.

## My part and the team's part

I worked on the shared integration problem, especially the path between the vision process, Router Bridge messages, and the hardware behavior that people could see. My job was less about claiming a single finished subsystem and more about helping the pieces line up: what label was being produced, how it was transported, what the MCU did with it, and what the display or LEDs should communicate.

The other members carried important parts of the build. The public project page identifies Juliat Delgado, Erik David Piolo, Jeff Fan, and me as the team. Juliat's logs cover the model and OLED work, while Jeff documented several hardware, Wi-Fi, and day-one integration steps. The page does not assign every contribution in detail, so I am keeping the team result separate from my own work.

## What worked, and what did not

We got meaningful slices working: the board could run the basic MCU checks, the OLED path could be brought up, the Bridge architecture and category handlers were in place, and the project had a documented vision-to-hardware pipeline. We also had model metrics and a physical conveyor prototype.

We did not finish a production-like validation campaign. Wi-Fi and upload time slowed iteration. The public model log itself lists deployment to the UNO Q, a held-out test set, and final connection to the sorting mechanism as next steps. That is a useful reminder that a demo pipeline and a measured sorting system are different milestones.

## Lessons learned

The strongest lesson was to make every interface observable. A visible LED test, an I2C scan, a printed category, and a timeout tell me more than a large script that fails silently. Power isolation also mattered earlier than I expected. A motor, camera hub, Linux host, and display are not just software dependencies; they compete for current, ports, and debugging attention.

If I had more time, I would add a held-out test set, log every prediction with the captured image and actual label, measure end-to-end timing, improve lighting and camera mounting, and add a safer actuator state machine. I would also make the system work offline for the final demo so that Wi-Fi is not part of the proof.

Sources: [Hackaday project](https://hackaday.io/project/206767-zot-rot-or-not), [Edge Impulse project link](https://studio.edgeimpulse.com/public/1119008/live), and [embedded world North America visitor information](https://embedded-world-na.com/visitor-info/).