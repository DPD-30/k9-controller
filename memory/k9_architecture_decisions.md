---
name: K9 robot build decisions
description: Architecture and technology decisions for the Doctor Who K9 robot dog project
type: project
---

**K9 Robot Control System - Architecture Decisions**

## Release Phases

### Release 1 (Minimum MVP)
**Core robot operation - must work for basic remote control**

| Component | Scope |
|-----------|-------|
| **Drive** | 2 motors via RoboClaw, tank-style control |
| **Encoders** | Enabled, basic PID (P-only to start) |
| **Wiimote/Nunchuk** | Stick control, Z=E-stop, C=boost |
| **Safety** | E-stop latch, battery monitoring, input timeout, speed ramping |
| **Web UI** | Dashboard (E-stop, status, battery), Config page |
| **Audio** | E-stop alarm only (single sound trigger) |
| **Deployment** | GitHub Actions, systemd service |

### Release 2 (Personality Features)
**K9 character enhancements**

| Component | Scope |
|-----------|-------|
| **Servos** | Ears (2), Head (1), Laser (1), Tail (2) via PCA9685 |
| **Lighting** | Eye LEDs (intensity), Nose laser LED, Back panel 12V lights |
| **Displays** | 2x SSD1306 OLEDs, iPad side display |
| **Audio** | Full sound library (startup, affirmative, negative, master) |
| **Wiimote** | Full button mapping (A/B/1/2 sounds, laser control) |
| **Web UI** | Manual control page, iPad route |
| **Behaviors** | Autonomous ear scanning, tail wag, head auto-center |

### Future (TBD)
**Nice-to-have enhancements**

| Feature | Notes |
|---------|-------|
| mmWave obstacle avoidance | Sensors + avoidance logic |
| Voice recognition | Mic input, voice-triggered responses |
| Eye LED "look" effects | Directional lighting (left/right/down) |
| Advanced PID tuning | Full PID (I+D terms) after testing |
| Complex back panel patterns | Beyond random chase |
| iPad state sync | Video reacts to robot state |
| Additional Wiimote features | D-pad control, LED patterns |

---

## Motor Control Strategy (Release 1/2)

### Communication & Reliability
- **Baud Rate:** 115,200 bps for stability/latency balance.
- **Failure Strategy:** Retry failed commands 3x. If all fail, emit `FAULT` event and trigger `emergencyStop()`.
- **Hardware Safety:** Set RoboClaw internal communications timeout to 1-2 seconds (deadman's switch).
- **Timing Model:**
  - **Control Loop:** 33ms (Sensing $\rightarrow$ Logic $\rightarrow$ Command).
  - **Commands:** Async "Fire and Forget" via prioritised queue (`NORMAL` for movement, `CRITICAL` for E-Stop).
  - **Telemetry:** Decoupled "Heartbeat" sampling every 250ms via `LOW` priority queue; results are cached for the control loop.

### Control Modes
- **Open Loop (`open`):** Normalized speed (-1.0 to 1.0) $\rightarrow$ $\pm 32767$ Duty Cycle $\rightarrow$ `DutyM1M2`.
- **Closed Loop (`closed`):** Normalized speed $\rightarrow$ Encoder Counts/Sec $\rightarrow$ `SpeedM1M2`.
  - **Guard:** Implement "Speed Deviation Guard" — trigger `FAULT` if `abs(target - actual) > threshold` for too long.
  - **Verification:** `initialize()` must verify encoder connectivity before enabling closed-loop mode.

### Configuration & Persistence
- **Source of Truth:** `config.json` (User/Dev) $\rightarrow$ Hardware NVM.
- **Boot Sync:** On `initialize()`, compare `config.json` (PID constants, default acceleration) with hardware state; write updates to NVM if they differ.
- **Runtime Tuning:** Allow Web UI to update and save these parameters to NVM.

### Motion Control (Servos via PCA9685 I2C) - Release 2
- Ears: 2 servos (left/right sweep only)
- Head: 1 linear actuator (up/down)
- Nose laser: 1 servo (extend/retract)
- Tail: 2 servos (up/down, left/right)

### Lighting - Release 2
- Eye lights: 2x addressable 5V LEDs (WS2812/NeoPixel) - intensity only
- Nose laser LED: Red tight-beam LED, on/off via GPIO
- Back panel: 4x3 grid (12 lights) with original 12V bulbs
  - Driven by 2x PCF8574 I2C IO expanders + relay modules
  - Random chase pattern effect

### Displays - Release 2
- Back panel: 2x SSD1306 OLED (128x64, I2C)
- Side panel: First-gen iPad via WiFi (web page served from Pi, video playback)

### Audio
- Pi PWM output → amplifier → speaker
- **Release 1**: E-stop alarm only
- **Release 2**: Full WAV library (startup, affirmative, negative, master, etc.)

### Input
- Wiimote + Nunchuk attachment (Bluetooth/HID)
- **Release 1**: Stick, Z, C, Home, +/-
- **Release 2**: A, B, 1, 2 buttons + full LED status

### I2C Device Map (Release 2)
```
├── PCA9685 (servos): 0x40
├── PCF8574 #1 (lights 1-8): 0x20
├── PCF8574 #2 (lights 9-12): 0x21
├── SSD1306 #1 (screen): 0x3C
└── SSD1306 #2 (screen): 0x3D
```

## Software Stack
- JavaScript (ES modules, `import` syntax) - NOT TypeScript
- Express.js for backend HTTP/WebSocket server
- Preact for UI (pre-built on GitHub, deployed as static files)

## Architecture
- Single Node.js application with modular design
- Motor controller abstraction for hardware swap-ability
- Config: JSON file defaults + Web UI management
- Build on GitHub, download artifacts to Pi for production
- systemd service for auto-start on boot

## Control Scheme

### Nunchuk Input (Release 1)
- Analog stick Y: Speed (forward/reverse)
- Analog stick X: Turn rate (differential steering)
- Z button: E-stop (hard cut)
- C button (held): Boost mode (higher max speed)

### Wiimote Input (Release 2 additions)
- Home: E-stop (Release 1)
- +/-: Adjust normal max speed (Release 1)
- D-pad: Reserved for future use (head tilt, ear listen mode)
- A button: Toggle laser extend/retract
- B button: Momentary laser on (only when extended)
- 1 button: "Affirmative" sound
- 2 button: "Negative" sound
- LEDs: Status (solid=OK, flashing=warning, off=E-stop)

### Speed Defaults
- Normal mode: 0.5 m/s
- Boost mode (C held): 1.5 m/s
- Both configurable via Web UI

## Web UI

### Release 1
- Port 80 for production
- **Dashboard**: E-stop (prominent), status, battery, motor speed
- **Config**: Motor tuning, speed limits, battery thresholds

### Release 2
- **Manual Control**: Backup joystick/sliders (separate page)
- **iPad Route** (`/ipad`): Full-screen video page for side display
- **Servo Config**: Trim, enable/disable per servo

## Audio

### Release 1
- E-stop alarm trigger only

### Release 2
- Pre-recorded WAV playback (Pi PWM)
- **Automatic triggers**: Startup chime, E-stop alarm, low battery warning, disconnect
- **Manual triggers**: A=Affirmative, B=Negative, 1=Master
- Global volume (0-100%), E-stop alarm has priority

## Servo Behaviors (Release 2)
- **Ears**:
  - Default: Autonomous scanning (alternating left/right while moving, random "aliveness" when stationary)
  - Listen mode: Both ears same direction (Wiimote control while button held)
- **Head**: Linear actuator, manual tilt via Wiimote, auto-center on release
- **Laser**: Binary extend/retract (A button toggle), LED on only when extended
- **Tail**: Wag speed proportional to robot speed, position based on state

## Back Panel (Release 2)
- **12V Button Lights**: Random chase pattern via PCF8574 + relays
- **OLED Screens**: Battery level, mode indicator, error codes

## Safety Features
- E-stop latch (requires explicit enable to resume)
- Input timeout (2 sec) → gradual stop
- Battery warning + critical E-stop thresholds
- Speed ramping (configurable accel/decel)
- Deadband for stick input (prevent drift)

## Error Handling

### Severity Levels
| Level | Action |
|-------|--------|
| INFO | Log only, no action |
| WARNING | Log + UI alert, continue operation |
| FAULT | Log + UI + E-stop, auto-recover possible |
| CRITICAL | Log + UI + E-stop, manual reset required |

### Error Mapping
| Error | Severity | Action |
|-------|----------|--------|
| Wiimote disconnect | FAULT | E-stop, try reconnect 3x |
| Motor controller fault | CRITICAL | E-stop, require manual reset |
| Low battery warning | WARNING | UI alert, continue |
| Low battery critical | FAULT | E-stop |
| I2C device timeout | WARNING | Log, retry, continue if non-critical |
| Servo fault | WARNING | Log, continue |
| Web UI disconnect | INFO | Log only |

### Logging
- Log file: `/var/log/k9/k9.log`
- Viewable via Web UI (simple log viewer)

## Testing Strategy
- **Unit tests**: Jest, run on GitHub Actions (CI)
- **Hardware stubs**: StubMotorController, StubServoController, etc.
- **`--stub-hardware` flag**: Run with all hardware stubbed for development
- **Coverage goal**: 70%+ on non-hardware code

## Config Schema
```json
{
  "system": { "port": 80, "inputTimeoutMs": 2000, "loopIntervalMs": 33 },
  "motors": {
    "maxSpeedNormal": 0.5, "maxSpeedBoost": 1.5,
    "accelRate": 200, "decelRate": 150, "deadband": 0.1,
    "invertLeft": false, "invertRight": false,
    "encoderEnabled": true, "wheelDiameterMm": null,
    "pid": { "kp": 1.0, "ki": 0.0, "kd": 0.0 }
  },
  "servos": {
    "enabled": false,
    "ears": { "mode": "auto" },
    "head": { "autoCenter": true },
    "laser": { },
    "tail": { }
  },
  "battery": { "lowVoltage": 11.0, "criticalVoltage": 10.0 },
  "audio": { "enabled": true, "volume": 80, "estopPriority": true },
  "wiimote": { "ledMode": "status", "rumbleOnAlert": true },
  "displays": { "oledEnabled": false, "iPadEnabled": false }
}
```

## Open Questions / TODO
- Wiimote Nunchuk support not yet implemented in wiinode (needs I2C expansion port handling)
- Wheel diameter TBD (affects speed → RPM calculation)
- Exact audio amplifier/speaker selection
- SSD1306 dimensions verification for back panel fit
- Tail servo mechanical design details

## Status
Design phase complete. Release 1 scope defined. Ready for implementation planning.
