import { MotorController } from './MotorController.js';
import { RoboClaw } from '@dpd-30/roboclaw-javascript';
import { logger } from '../observability/logger.js';

/**
 * Hardware implementation of MotorController for RoboClaw controllers.
 */
export class RoboClawMotorController extends MotorController {
  constructor(config) {
    super();
    this.config = config;
    this.address = 0x80; // Default address
    this.roboclaw = null;
    this._isEnabled = false;
    this._telemetryInterval = null;
    this._cachedTelemetry = {
      voltage: 0,
      currentLeft: 0,
      currentRight: 0,
      speedLeft: 0,
      speedRight: 0,
      enabled: false,
      fault: false,
    };
  }

  async initialize() {
    logger.info('RoboClawMotorController: Initializing hardware...');

    try {
      // Instantiate the RoboClaw driver
      // Params: port, baudRate, timeout(ms), retries
      this.roboclaw = new RoboClaw(
        this.config.motors.port ?? '/dev/ttyACM0',
        this.config.motors.baudRate ?? 115200,
        1000,
        2
      );

      await this.roboclaw.connect();
      // Give port time to settle before further communication
      await new Promise(resolve => setTimeout(resolve, 100));
      logger.info('RoboClawMotorController: Connected to serial port');

      // Verify communication
      const version = await this._retry(() => this.roboclaw.readVersion(this.address));
      logger.info(`RoboClawMotorController: Firmware version ${version} verified`);

      // Boot-time Sync: Sync PID and Acceleration settings to NVM
      await this._syncHardwareSettings();

      // Start Telemetry Heartbeat (250ms)
      this._startTelemetryLoop();

      this.emit('initialized');
      logger.info('RoboClawMotorController: Initialization complete');
      return { success: true };
    } catch (error) {
      logger.error(`RoboClawMotorController: Initialization failed: ${error.message}`);
      throw error;
    }
  }

  async _syncHardwareSettings() {
    logger.info('RoboClawMotorController: Syncing settings to NVM...');
    try {
      const { pid } = this.config.motors;
      if (pid) {
        // Set Velocity PID for both motors (P, I, D, QPPS)
        await this.roboclaw.setM1VelocityPID(this.address, pid.kp, pid.ki, pid.kd, 44000);
        await this.roboclaw.setM2VelocityPID(this.address, pid.kp, pid.ki, pid.kd, 44000);
      }

      // Set Default Accelerations
      const accel = this.config.motors.accelRate ?? 500;
      const decel = this.config.motors.decelRate ?? 500;
      await this.roboclaw.setM1DefaultAccel(this.address, accel, decel);
      await this.roboclaw.setM2DefaultAccel(this.address, accel, decel);

      // Save to NVM
      await this.roboclaw.writeNVM(this.address);
      logger.info('RoboClawMotorController: Hardware settings synced to NVM');
    } catch (error) {
      logger.warn(`RoboClawMotorController: Settings sync failed: ${error.message}`);
    }
  }

  async setSpeeds(left, right) {
    if (!this._isEnabled) {
      logger.warn('RoboClawMotorController: Attempted to set speeds while DISABLED');
      return;
    }

    const mode = this.config.motors.controlMode ?? 'open';

    try {
      if (mode === 'closed') {
        // Closed Loop: Map normalized -> Encoder Counts/Sec
        const maxCounts = this.config.motors.maxEncoderCountsPerSec ?? 1000;
        const targetL = left * maxCounts;
        const targetR = right * maxCounts;

        await this._retry(() => this.roboclaw.speedM1M2(this.address, targetL, targetR));
      } else {
        // Open Loop: Map normalized -> Duty Cycle (-32767 to 32767)
        const maxDuty = this.config.motors.maxSpeedNormal ?? 0.5;
        const boost = this.config.motors.maxSpeedBoost ?? 1.5;
        const currentMax = this._isBoostActive() ? boost : maxDuty;

        const mapToDuty = (val) => {
          const clamped = Math.max(-1, Math.min(1, val));
          return Math.round(clamped * currentMax * 32767);
        };

        await this._retry(() => this.roboclaw.dutyM1M2(this.address, mapToDuty(left), mapToDuty(right)));
      }

      this.emit('speedChanged', { left, right });
    } catch (error) {
      logger.error(`RoboClawMotorController: setSpeeds failed: ${error.message}`);
      this.emit('fault', { reason: 'COMMUNICATION_FAILURE', error });
      await this.emergencyStop();
    }
  }

  async stop() {
    await this.setSpeeds(0, 0);
    this.emit('stopped');
  }

  async emergencyStop() {
    try {
      // Immediate stop via library (High priority)
      await this.roboclaw.dutyM1M2(this.address, 0, 0);
      this._isEnabled = false;
      logger.error('RoboClawMotorController: EMERGENCY STOP executed');
      this.emit('emergencyStop');
    } catch (error) {
      logger.error(`RoboClawMotorController: E-STOP failed: ${error.message}`);
    }
  }

  async enable() {
    this._isEnabled = true;
    logger.info('RoboClawMotorController: Motors ENABLED');
    this.emit('enabled');
  }

  async disable() {
    this._isEnabled = false;
    await this.stop();
    logger.info('RoboClawMotorController: Motors DISABLED');
    this.emit('disabled');
  }

  isEnabled() {
    return this._isEnabled;
  }

  getTelemetry() {
    return { ...this._cachedTelemetry };
  }

  async dispose() {
    await this.disable();
    this._stopTelemetryLoop();
    if (this.roboclaw) {
      await this.roboclaw.disconnect();
    }
    this.emit('disposed');
  }

  /**
   * Helper to retry commands based on failure strategy.
   */
  async _retry(fn, retries = 3) {
    let lastError;
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (e) {
        lastError = e;
        logger.debug(`RoboClawMotorController: Retry ${i+1}/${retries} failed: ${e.message}`);
      }
    }
    throw lastError;
  }

  _isBoostActive() {
    // This would be integrated with InputMapper/RobotController state
    // For now, assume a property on the controller or a config check
    return this.config?.motors?.boostActive ?? false;
  }

  _startTelemetryLoop() {
    this._telemetryInterval = setInterval(async () => {
      try {
        // Using a low-priority read for status
        const status = await this.roboclaw.getStatus(this.address);

        this._cachedTelemetry = {
          voltage: status.mbat / 10.0,
          currentLeft: status.cur1 / 100.0,
          currentRight: status.cur2 / 100.0,
          speedLeft: status.speed1,
          speedRight: status.speed2,
          enabled: this._isEnabled,
          fault: !!status.error,
        };

        this.emit('telemetryUpdate', this._cachedTelemetry);
      } catch (error) {
        logger.debug(`RoboClawMotorController: Telemetry sample failed: ${error.message}`);
      }
    }, 250);
  }

  _stopTelemetryLoop() {
    if (this._telemetryInterval) {
      clearInterval(this._telemetryInterval);
      this._telemetryInterval = null;
    }
  }
}

export default RoboClawMotorController;
