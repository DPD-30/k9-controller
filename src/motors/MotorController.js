import { EventEmitter } from 'node:events';

/**
 * @typedef {Object} MotorTelemetry
 * @property {number} voltage - Main battery voltage in Volts
 * @property {number} currentLeft - Motor 1 current in Amperes
 * @property {number} currentRight - Motor 2 current in Amperes
 * @property {number} speedLeft - Actual speed of motor 1 (counts/sec)
 * @property {number} speedRight - Actual speed of motor 2 (counts/sec)
 * @property {boolean} enabled - Whether the motor controller is enabled
 * @property {boolean} fault - Whether the controller is in a fault state
 */

/**
 * Base interface for K9 Motor Controllers.
 * All implementations should extend this class.
 * Emits: initialized, speedChanged, stopped, emergencyStop, enabled, disabled, fault, telemetryUpdate, disposed
 */
export class MotorController extends EventEmitter {
  constructor() {
    super();
  }

  /**
   * Setup connection and sync hardware configuration.
   * @returns {Promise<void>}
   * @throws {Error} If connection fails.
   */
  async initialize() {
    throw new Error('MotorController.initialize() must be implemented');
  }

  /**
   * Clean up resources and close connections.
   * @returns {Promise<void>}
   */
  async dispose() {
    throw new Error('MotorController.dispose() must be implemented');
  }

  /**
   * Enable motor power.
   * @returns {Promise<void>}
   */
  async enable() {
    throw new Error('MotorController.enable() must be implemented');
  }

  /**
   * Disable motor power and stop.
   * @returns {Promise<void>}
   */
  async disable() {
    throw new Error('MotorController.disable() must be implemented');
  }

  /**
   * Check if motors are currently enabled.
   * @returns {boolean}
   */
  isEnabled() {
    throw new Error('MotorController.isEnabled() must be implemented');
  }

  /**
   * Set normalized speeds for left and right motors.
   * @param {number} left - Normalized speed (-1.0 to 1.0)
   * @param {number} right - Normalized speed (-1.0 to 1.0)
   * @returns {Promise<void>}
   */
  async setSpeeds(left, right) {
    throw new Error('MotorController.setSpeeds() must be implemented');
  }

  /**
   * Immediately set all speeds to 0.
   * @returns {Promise<void>}
   */
  async stop() {
    throw new Error('MotorController.stop() must be implemented');
  }

  /**
   * High-priority emergency stop.
   * @returns {Promise<void>}
   */
  async emergencyStop() {
    throw new Error('MotorController.emergencyStop() must be implemented');
  }

  /**
   * Get the latest cached telemetry data.
   * @returns {MotorTelemetry}
   */
  getTelemetry() {
    throw new Error('MotorController.getTelemetry() must be implemented');
  }
}

export default MotorController;
