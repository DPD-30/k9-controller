/**
 * Base interface for battery monitoring.
 * All battery monitor implementations must inherit from this class.
 */
export class BatteryMonitor {
  /**
   * Setup connection and configuration.
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error('BatteryMonitor.initialize() must be implemented');
  }

  /**
   * Get current main battery voltage.
   * @returns {Promise<number>} Voltage in volts.
   */
  async getVoltage() {
    throw new Error('BatteryMonitor.getVoltage() must be implemented');
  }

  /**
   * Check if battery voltage is below the low warning threshold.
   * @returns {boolean}
   */
  isLow() {
    throw new Error('BatteryMonitor.isLow() must be implemented');
  }

  /**
   * Check if battery voltage is below the critical shutdown threshold.
   * @returns {boolean}
   */
  isCritical() {
    throw new Error('BatteryMonitor.isCritical() must be implemented');
  }
}

export default BatteryMonitor;
