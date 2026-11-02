# K9 Robot - Release 1 Implementation Plan

**Goal:** Remote-controlled robot with basic drive, safety features, and web UI.

---

## Phase 1: Project Setup & Infrastructure

### 1.1 Repository Structure
- [x] Create GitHub repo (`k9-control` or similar)
- [x] Set up directory structure:
  ```
  k9/
  ├── package.json
  ├── src/
  │   ├── app.js            # Express server entry point
  │   ├── config/           # Configuration module
  │   ├── motors/           # Motor controllers
  │   ├── input/            # Wiimote input handling
  │   ├── control/          # Robot controller
  │   ├── web/              # Web server & API
  │   └── observability/    # Logging & telemetry
  ├── ui/                   # Preact app source
  ├── scripts/              # Utility scripts
  ├── data/                 # Runtime config storage
  ├── build/                # GitHub Actions output
  └── docs/
  ```
- [x] Initialize `package.json` with dependencies:
  - Runtime: `express`, `pino`, `@opentelemetry/*`
  - Dev: `eslint`, native Node.js test runner
  - Scripts: `start`, `dev`, `test`, `lint`, `build`, `config:init`

### 1.2 Config Module
- [x] `src/config/defaults.js` - Default config values with validation schema
- [x] `src/config/config.js` - Load/save/validate config with EventEmitter
- [x] `src/config/env.js` - Environment variable bindings
- [x] Config file location: `./data/config.json`
- [x] Config validation schema with type checking and range validation

### 1.3 Logger Module
- [x] `src/observability/logger.js` - Pino logger with levels
- [x] Log to file (`./logs/app.log`) with async transport
- [x] ISO timestamps and structured JSON output
- [x] OpenTelemetry trace/span context injection

### 1.4 GitHub Actions Workflow
- [x] `.github/workflows/build.yml` - Build on push/PR
- [x] Super-Linter integration (JavaScript, JSON, YAML, Markdown)
- [x] Build steps:
  1. Install deps (`npm ci`)
  2. Super-Linter validation
  3. Run unit tests (native Node.js test runner)
  4. Build Preact UI (when workspace exists)
- [x] Pi compatibility check job (ARM native modules)

---

## Phase 2: Motor Controller Abstraction

### 2.1 Interface Definition
- [x] `src/motors/MotorController.js` - Base class with normalized speeds (-1.0 to 1.0), priority E-stop, and telemetry cache.

### 2.2 Stub Implementation (for development)
- [x] `src/motors/StubMotorController.js` - Pure JS simulation with randomized telemetry.

### 2.3 RoboClaw Implementation
- [x] `src/motors/RoboClawMotorController.js` - Implementation using `@dpd-30/roboclaw-javascript`.
- [x] **Features:** 115.2k baud, `open`/`closed` loop support, 3x retry logic, and NVM boot-sync.

### 2.4 Motor Controller Tests
- [ ] Unit tests for stub controller
- [ ] Integration tests for RoboClaw (may require hardware)

---

## Phase 3: Battery Monitor

### 3.1 Interface Definition
- [x] `src/battery/BatteryMonitor.js` - Base class for voltage monitoring.

### 3.2 RoboClaw Implementation
- [x] `src/battery/RoboClawBatteryMonitor.js` - Reads voltage via shared RoboClaw instance.

### 3.3 Stub Implementation
- [x] `src/battery/StubBatteryMonitor.js` - Mock implementation for testing safety triggers.

---

## Phase 4: Wiimote Input (Release 1)

### 4.1 Wiimote/Nunchuk Support in wiinode
- [x] Update `wiinode/src/index.ts` or create new module
- [x] Enable Nunchuk expansion port (I2C init sequence)
- [x] Parse Nunchuk data from Wiimote packets:
  - Analog stick X, Y (bytes 6-7)
  - Z and C buttons (byte 8, bitmasked)
- [x] Export Nunchuk data on Remote object

### 4.2 Input Module
- [ ] `src/input/WiimoteInput.js`
- [ ] Scan for Wiimotes, connect
- [ ] Expose input state:
  - Stick X, Y (-1.0 to 1.0)
  - Z button (E-stop)
  - C button (boost)
  - Home button (E-stop)
  - +/- buttons (speed adjust)
- [ ] Emit events on state changes

### 4.3 Input Mapper
- [ ] `src/input/InputMapper.js`
- [ ] Map stick input to motor commands:
  - Stick Y $\rightarrow$ base speed
  - Stick X $\rightarrow$ differential (turn)
- [ ] Apply deadband
- [ ] Apply max speed limit (normal vs boost)

---

## Phase 5: PCA9685 Peripheral Control

### 5.1 I2C Interface & Driver
- [ ] `src/peripherals/Pca9685Driver.js` - Low-level I2C communication
- [ ] Handle PWM frequency setting and channel writing
- [ ] Methods for reading/writing specific channels

### 5.2 Servo Controller
- [x] `src/peripherals/ServoController.js`
- [x] Map logical servos to PCA9685 channels
- [x] `setPosition(servo, angle)` - Convert degrees to PWM pulse with logical and hardware clamping
- [x] `stopAll()` - Immediately halt all servo movement (required for E-Stop)

### 5.3 Back Panel LED Controller
- [x] `src/peripherals/BackPanelLeds.js`
- [x] Map 3x4 grid (12 LEDs) to PCF8574 channels
- [x] `setPattern(patternId)` - Implement visual patterns
- [x] `setState(state)` - Visual indicators for `FAULT` / `E_STOP`

---

## Phase 6: Behavior Orchestrator

### 6.1 Orchestrator Module
- [x] `src/control/BehaviorOrchestrator.js`
- [x] Manage high-level "Moods" and "Behaviors"
- [x] Synchronize state across Head, Ears, Tail, and Back Panel LEDs

### 6.2 Mood Definitions
- [x] Define `MOOD_IDLE`, `MOOD_EXCITED`, `MOOD_THINKING`, `MOOD_FAULT`

### 6.3 Animation Sequences
- [x] Implement timing/interpolation (LERP) for smooth transitions
- [x] Handle "randomness" for "alive" behaviors

---

## Phase 7: Main Control Loop

### 7.1 Controller Module
- [ ] `src/control/RobotController.js`
- [ ] Main control loop (33ms interval)
- [ ] Safety checks:
  - E-stop state (Trigger `stopAll()` on servos + `MOOD_FAULT`)
  - Battery voltage
  - Input timeout
- [ ] Speed ramping (accel/decel)
- [ ] State machine: `DISABLED` $\rightarrow$ `ENABLED` $\rightarrow$ `DRIVING` $\rightarrow$ `E_STOP`

### 7.2 State Management
- [ ] `src/control/StateMachine.js` (or inline)
- [ ] States: `DISABLED`, `ENABLED`, `DRIVING`, `E_STOP`, `FAULT`
- [ ] Transitions guarded by safety checks
- [ ] Emit state change events to `BehaviorOrchestrator`

---

## Phase 8: Audio (Release 1 - E-stop only)

### 8.1 Audio Player
- [ ] `src/audio/AudioPlayer.js`
- [ ] Play WAV files via Pi PWM
- [ ] Use `node-aplay` or system `aplay` command
- [ ] Volume control
- [ ] Priority system (E-stop interrupts)

### 8.2 Sound Trigger
- [ ] `src/audio/SoundTrigger.js`
- [ ] E-stop alarm trigger
- [ ] Future: expand to full sound library

---

## Phase 9: Web Server & API

### 9.1 Express Server
- [ ] `src/web/server.js`
- [ ] HTTP server on port 80
- [ ] Serve static files (Preact UI)
- [ ] WebSocket server for real-time updates

### 9.2 REST API
- [ ] `src/web/routes/config.js`
  - `GET /api/config` - Get current config
  - `POST /api/config` - Update config
- [ ] `src/web/routes/control.js`
  - `POST /api/estop` - Trigger E-stop
  - `POST /api/enable` - Enable robot
  - `GET /api/status` - Get robot status

### 9.3 WebSocket
- [ ] `src/web/websocket.js`
- [ ] Push real-time updates:
  - Battery voltage
  - Motor speed
  - Robot state
  - Warnings/errors
- [ ] Handle client disconnect/reconnect

---

## Phase 10: Web UI (Release 1)

### 10.1 Preact App Setup
- [ ] `ui/` directory with Vite or similar bundler
- [ ] Basic app structure (App.jsx, index.jsx)
- [ ] Routing (react-router or Preact-RT)

### 10.2 Dashboard Page
- [ ] `ui/src/pages/Dashboard.jsx`
- [ ] E-stop button (prominent, red)
- [ ] Status indicators:
  - Robot state (enabled/disabled/E-stop)
  - Battery voltage
  - Wiimote connection
  - Motor speed (visual bar)
- [ ] Warning alerts display

### 10.3 Config Page
- [x] `ui/src/pages/Config.jsx` (implemented as `ServoCalibration.jsx` component)
- [x] Servo tuning form (min, max, trim, logical limits)
- [x] Safety warnings and acknowledgment flow for range testing
- [x] Real-time "Test" override functionality
- [x] Save/restore buttons (via API updates)
- [x] Validation feedback

### 10.4 API Client
- [ ] `ui/src/api.js` - REST client
- [ ] `ui/src/ws.js` - WebSocket client
- [ ] Reconnect logic

---

## Phase 11: Integration & Testing

### 11.1 Wiring It All Together
- [ ] `src/index.js` - Main entry point
- [ ] Wire up dependencies:
  ```javascript
  config $\rightarrow$ motors, battery, audio, web, peripherals
  wiimote $\rightarrow$ input mapper $\rightarrow$ controller $\rightarrow$ motors & behavior orchestrator
  controller $\rightarrow$ web (status updates)
  web $\rightarrow$ controller (E-stop, enable)
  ```
- [ ] Error handling and graceful shutdown

### 11.2 Unit Tests
- [ ] Config module tests
- [ ] Input mapper tests
- [ ] Controller logic tests
- [ ] Web API tests (mocked)

### 11.3 Integration Tests
- [ ] Full control loop with stubbed hardware
- [ ] E-stop triggers correctly (Servos STOP, LEDs flash)
- [ ] Battery warning/critical works
- [ ] Input timeout works

### 11.4 Manual Testing Checklist
- [ ] Wiimote connects and controls robot
- [ ] E-stop (Z button, Home button, UI button) all work
- [ ] Boost mode (C button) increases max speed
- [ ] Battery monitoring reports correctly
- [ ] Web UI shows real-time status
- [ ] Config changes persist and take effect

---

## Phase 12: Deployment

### 12.1 systemd Service
- [ ] `k9.service` file:
  ```ini
  [Unit]
  Description=K9 Robot Control
  After=network.target

  [Service]
  Type=simple
  User=pi
  WorkingDirectory=/opt/k9
  ExecStart=/usr/bin/node /opt/k9/src/index.js
  Restart=always

  [Install]
  WantedBy=multi-user.target
  ```

### 12.2 Installation Script
- [ ] `install.sh` - Deploy to Pi:
  1. Create `/opt/k9` directory
  2. Extract release artifact
  3. Install systemd service
  4. Enable and start service

### 12.3 Pi Setup Documentation
- [ ] Enable UART (for RoboClaw)
- [ ] Enable I2C (for PCA9685)
- [ ] Configure audio (PWM)
- [ ] Set up log directory (`/var/log/k9`)
- [ ] Wiimote pairing instructions

---

## Release 1 Timeline Estimate

| Phase | Estimated Time | Dependencies |
|-------|----------------|--------------|
| 1. Setup | 1-2 days | None |
| 2. Motors | 2-3 days | Phase 1 |
| 3. Battery | 1 day | Phase 2 |
| 4. Wiimote | 3-5 days | Phase 1 (wiinode Nunchuk work) |
| 5. PCA9685 | 3-5 days | Phase 1 |
| 6. Behaviors | 2-3 days | Phase 5 |
| 7. Control Loop | 2-3 days | Phases 2, 3, 4, 6 |
| 8. Audio | 1 day | Phase 7 |
| 9. Web Server | 2-3 days | Phase 1 |
| 10. Web UI | 3-5 days | Phase 9 |
| 11. Integration | 3-5 days | All above |
| 12. Deployment | 1-2 days | Phase 11 |

**Total Estimate:** 4-7 weeks

---

## Critical Path

The **critical path** for Release 1:
1. **wiinode Nunchuk support** - Can't test control without this
2. **RoboClaw communication** - Can't drive motors without this
3. **PCA9685 I2C communication** - Can't move servos or LEDs without this
4. **Control loop integration** - Everything comes together here

**Risk mitigation:**
- Stub implementations allow parallel development
- Wiimote testing can happen without robot hardware
- Web UI can be developed with mocked data

---

## Open Technical Questions

1. **wiinode Nunchuk implementation**: Need to research Wiimote expansion port I2C protocol
2. **RoboClaw packet serial protocol**: Need to verify exact command format
3. **Audio playback**: Best method for Pi PWM WAV playback from Node.js
4. **UART on Pi**: Which UART to use (mini UART vs. PL011), pin conflicts with other GPIO
5. **PCA9685 I2C**: Confirming the `i2c-bus` or similar library for Node.js stability on Pi

---

## Future Release: Logging & Telemetry Enhancements

**Status:** Core infrastructure complete (v0.0.1)

### Completed (v0.0.1)
- [x] Pino logger with file transport to `./logs/app.log`
- [x] OpenTelemetry SDK with OTLP HTTP exporters
- [x] Trace/span context injection in logs
- [x] Request counter (`k9_requests_total`) with labels
- [x] Request duration histogram (`k9_request_duration`)
- [x] Environment-based configuration (`src/config/env.js`)
- [x] Configurable trace sampling (50% dev, 10% production)
- [x] Graceful shutdown handling

### Planned Metrics (v0.2.0+)

**Robot telemetry gauges:**
- [ ] Battery voltage gauge
- [ ] Motor speed (left/right) gauges
- [ ] Motor current draw
- [ ] Distance sensor readings
- [ ] Wiimote nunchuk joystick position (X, Y)
- [ ] Wiimote button states (Z, C)

**System health metrics:**
- [ ] Active WebSocket connections (UpDownCounter)
- [ ] Message queue depth
- [ ] Error rate counter by type
- [ ] Input timeout events

**Advanced observability:**
- [ ] Exemplars to correlate high-latency requests to traces
- [ ] Custom span attributes for robot actions (e.g., `robot.state`, `robot.speed`)
- [ ] Distributed tracing across wiinode $\rightarrow$ k9 communication
- [ ] Trace-based sampling decisions (sample errors at higher rate)

### Collector Configuration
- [ ] Add Prometheus exporter for metrics scraping
- [ ] Configure OTLP collector with persistent queue
- [ ] Add Grafana dashboard for metrics visualization
- [ ] Set up alerting rules for critical thresholds
