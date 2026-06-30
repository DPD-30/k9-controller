import { BatteryMonitor } from './BatteryMonitor.js';
import { logger } from '../observability/logger.js';

/**
 * Stub implementation of BatteryMonitor for development and testing.
 */
export class StubBatteryMonitor extends BatteryMonitor {
  constructor(config) {
    super();
    this.config = config; // Expected to contain battery: { lowVoltage, criticalVoltage }
    this._voltage = 12.6; // Default "healthy" battery
  }

  async initialize() {
    logger.info('StubBatteryMonitor: Initialized simulation...');
  }

  async getVoltage() {
    return this._voltage;
  }

  isLow() {
    const v = this._voltage;
    const threshold = this.config?.battery?.lowVoltage ?? 11.0;
    return v <= threshold;
  }

  isCritical() {
    const v = this._voltage;
    const threshold = this.config?.battery?.criticalVoltage ?? 10.0;
    return v <= threshold;
  }

  /**
   * Simulate a voltage change for testing.
   * @param {number} voltage
   */
  setSimulatedVoltage(voltage) {
    this._voltage = voltage;
    logger.debug(`StubBatteryMonitor: Simulated battery voltage updated to ${voltage}V`);
  }
}

export default StubBatteryMonitor;
