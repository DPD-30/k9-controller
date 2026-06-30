import { BatteryMonitor } from './BatteryMonitor.js';
import { logger } from '../observability/logger.js';

/**
 * Hardware implementation of BatteryMonitor for RoboClaw controllers.
 */
export class RoboClawBatteryMonitor extends BatteryMonitor {
  constructor(config, roboclawInstance) {
    super();
    this.config = config;
    this.roboclaw = roboclawInstance;
    this._cachedVoltage = 0;
  }

  async initialize() {
    logger.info('RoboClawBatteryMonitor: Initialized');
  }

  /**
   * Get current main battery voltage.
   * Leverages the MotorController's telemetry if available, or reads directly.
   */
  async getVoltage() {
    // Try to use the cached telemetry first to avoid serial bus saturation
    if (this._cachedVoltage > 0) {
      return this._cachedVoltage;
    }

    try {
      const voltageTenths = await this.roboclaw.readMainBatteryVoltage(0x80);
      this._cachedVoltage = voltageTenths / 10.0;
      return this._cachedVoltage;
    } catch (error) {
      logger.error(`RoboClawBatteryMonitor: Failed to read voltage: ${error.message}`);
      throw error;
    }
  }

  isLow() {
    const v = this._cachedVoltage;
    const threshold = this.config?.battery?.lowVoltage ?? 11.0;
    return v > 0 && v <= threshold;
  }

  isCritical() {
    const v = this._cachedVoltage;
    const threshold = this.config?.battery?.criticalVoltage ?? 10.0;
    return v > 0 && v <= threshold;
  }

  /**
   * Called by the MotorController telemetry loop to update the local cache.
   * @param {number} voltage - Voltage in Volts.
   */
  updateVoltageCache(voltage) {
    this._cachedVoltage = voltage;
  }
}

export default RoboClawBatteryMonitor;
