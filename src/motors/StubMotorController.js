import { MotorController } from './MotorController.js';
import { logger } from '../observability/logger.js';

/**
 * Simulated motor controller for development and testing.
 * No hardware required.
 */
export class StubMotorController extends MotorController {
  constructor(config = {}) {
    super();
    this.config = config;
    this._isEnabled = false;
    this._leftSpeed = 0;
    this._rightSpeed = 0;
    this._initialized = false;
    this._telemetryInterval = null;

    this._telemetry = {
      voltage: config.baseVoltage ?? 12.6,
      currentLeft: config.restCurrent ?? 0.5,
      currentRight: config.restCurrent ?? 0.5,
      speedLeft: 0,
      speedRight: 0,
      enabled: false,
      fault: false,
    };
  }

  async initialize() {
    logger.info('StubMotorController: Initializing simulation...');
    this._initialized = true;
    this._isEnabled = true; // Default to enabled for stub
    this._startTelemetrySimulation();
    this.emit('initialized');
    logger.info('StubMotorController: Initialized');
  }

  async dispose() {
    await this.disable();
    this._stopTelemetrySimulation();
    this._initialized = false;
    logger.info('StubMotorController: Disposed');
    this.emit('disposed');
  }

  async enable() {
    this._isEnabled = true;
    this._telemetry.enabled = true;
    logger.info('StubMotorController: Motors ENABLED');
    this.emit('enabled');
  }

  async disable() {
    this._isEnabled = false;
    this._telemetry.enabled = false;
    await this.stop();
    logger.info('StubMotorController: Motors DISABLED');
    this.emit('disabled');
  }

  isEnabled() {
    return this._isEnabled;
  }

  async setSpeeds(left, right) {
    if (!this._isEnabled) {
      logger.warn('StubMotorController: Attempted to set speeds while DISABLED');
      return;
    }

    this._leftSpeed = left;
    this._rightSpeed = right;

    logger.debug(`StubMotorController: Set speeds L=${left.toFixed(2)} R=${right.toFixed(2)}`);
    this.emit('speedChanged', { left: this._leftSpeed, right: this._rightSpeed });
  }

  async stop() {
    await this.setSpeeds(0, 0);
    logger.info('StubMotor ControllerBase: Motors STOPPED');
    this.emit('stopped');
  }

  async emergencyStop() {
    this._leftSpeed = 0;
    this._rightSpeed = 0;
    this._isEnabled = false;
    this._telemetry.enabled = false;
    logger.error('StubMotorController: EMERGENCY STOP triggered!');
    this.emit('emergencyStop');
    this.emit('fault', { reason: 'E-STOP' });
  }

  getTelemetry() {
    return { ...this._telemetry };
  }

  _startTelemetrySimulation() {
    this._telemetryInterval = setInterval(() => {
      this._updateTelemetry();
    }, 250);
  }

  _stopTelemetrySimulation() {
    if (this._telemetryInterval) {
      clearInterval(this._telemetryInterval);
      this._telemetryInterval = null;
    }
  }

  _updateTelemetry() {
    const avgSpeed = (Math.abs(this._leftSpeed) + Math.abs(this._rightSpeed)) / 2;
    const loadDrop = avgSpeed * 0.5;

    this._telemetry.voltage = (this.config.baseVoltage ?? 12.6) - loadDrop;
    this._telemetry.currentLeft = Math.abs(this._leftSpeed) * 2.0 + (Math.random() * 0.1);
    this._telemetry.currentRight = Math.abs(this._rightSpeed) * 2.0 + (Math.random() * 0.1);
    this._telemetry.speedLeft = this._leftSpeed * 1000; // Mock encoder counts
    this._telemetry.speedRight = this._rightSpeed * 1000;
    this._telemetry.enabled = this._isEnabled;

    this.emit('telemetryUpdate', { ...this._telemetry });
  }
}

export default StubMotorController;
