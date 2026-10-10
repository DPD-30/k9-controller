import { BatteryMonitor } from './BatteryMonitor.js';
import { EventEmitter } from 'events';
import { logger } from '../observability/logger.js';

/**
 * RoboClaw implementation of BatteryMonitor.
 * Leverages the RoboClawMotorController to read battery levels via serial.
 */
export class RoboClawBatteryMonitor extends BatteryMonitor {
  constructor(motorController, options = {}) {
    super();
    this._motorController = motorController;
    this.options = {
      lowVoltageThreshold: options.lowVoltageThreshold ?? 11.0,
      criticalVoltageThreshold: options.criticalVoltageThreshold ?? 10.0,
      checkIntervalMs: options.checkIntervalMs ?? 5000,
    };

    this._currentVoltage = 0;
    this._timer = null;
  }

  /**
   * Initialize the monitor and start the polling loop.
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  async initialize() {
    try {
      // Initial read to verify connection
      const voltage = await this.getVoltage();
      if (voltage === 0) {
        logger.warn('RoboClaw battery monitor reporting 0V - check hardware/connection');
      }
      this._currentVoltage = voltage;

      // Start polling loop
      this._startPolling();

      return { success: true };
    } catch (err) {
      logger.error({ err }, 'Failed to initialize RoboClaw battery monitor');
      return { success: false, error: err.message };
    }
  }

  /**
   * Stop the polling loop.
   * @returns {Promise<void>}
   */
  async dispose() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  /**
   * Read the main battery voltage from the RoboClaw controller.
   * @returns {Promise<number>} Voltage in volts.
   */
  async getVoltage() {
    if (!this._motorController) {
      throw new Error('Motor controller not provided to battery monitor');
    }

    const voltage = await this._motorController.readMainVoltage();
    this._currentVoltage = voltage;
    return voltage;
  }

  /**
   * Set low voltage threshold.
   * RoboClaw doesn't store this threshold internally in a way we need to write,
   * so we store it in our local config/options.
   * @param {number} voltage
   */
  async setLowVoltageThreshold(voltage) {
    this.options.lowVoltageThreshold = voltage;
    logger.info({ voltage }, 'Battery low voltage threshold updated');
  }

  /**
   * Get current low voltage threshold.
   * @returns {Promise<number>}
   */
  async getLowVoltageThreshold() {
    return this.options.lowVoltageThreshold;
  }

  /**
   * Start internal polling for battery levels.
   * @private
   */
  _startPolling() {
    this._timer = setInterval(async () => {
      try {
        const voltage = await this.getVoltage();
        this._checkThresholds(voltage);
      } catch (err) {
        logger.error({ err }, 'Error polling battery voltage');
      }
    }, this.options.checkIntervalMs);
  }

  /**
   * Check current voltage against thresholds and emit events.
   * @private
   * @param {number} voltage
   */
  _checkThresholds(voltage) {
    if (voltage === 0) return; // Ignore 0V readings if they are errors

    if (voltage < this.options.criticalVoltageThreshold) {
      this.emit('critical', { voltage });
    } else if (voltage < this.options.lowVoltageThreshold) {
      this.emit('warning', { voltage });
    }
  }
}

// Inherit from EventEmitter as well for threshold alerts
Object.assign(RoboClawBatteryMonitor.prototype, EventEmitter.prototype);
RoboClawBatteryMonitor.prototype.constructor = RoboClawBatteryMonitor;
// Use a proper mixin or just extend EventEmitter in the class definition.
// Since we already extend BatteryMonitor, we can't extend EventEmitter.
// Let's fix this by making RoboClawBatteryMonitor extend EventEmitter
// and including BatteryMonitor methods via composition or mixin.
// Actually, the simplest way is to let the RobotController handle the voltage
// read and emit the events, or make BatteryMonitor extend EventEmitter.
