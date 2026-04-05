/**
 * Default configuration values and schema for the K9 robot.
 * All values can be overridden by the config file or environment variables.
 */

export const defaults = {
  // Motor control settings
  motors: {
    // Maximum speed (0.0 - 1.0, where 1.0 = 100% duty cycle)
    maxSpeed: 0.8,
    // Boost mode maximum speed (when C button is held)
    boostMaxSpeed: 1.0,
    // Acceleration rate (speed units per second)
    accelRate: 0.5,
    // Deceleration rate (speed units per second)
    decelRate: 0.8,
    // Emergency stop deceleration (much faster)
    eStopDecelRate: 2.0,
    // Deadband for joystick input (values below this are ignored)
    deadband: 0.1,
    // Minimum speed to move (after deadband applied)
    minMovementSpeed: 0.15,
  },

  // Battery monitoring settings
  battery: {
    // Voltage type: '12V' or '24V' system
    systemVoltage: '12V',
    // Warning threshold (volts) - alert user
    lowVoltageWarning: 11.0,
    // Critical threshold (volts) - trigger E-stop
    criticalVoltage: 10.0,
    // Polling interval in milliseconds
    pollIntervalMs: 1000,
  },

  // Input device settings
  input: {
    // Timeout in ms before triggering safe stop if no input received
    timeoutMs: 2000,
    // Wiimote MAC address (null = auto-discover first controller)
    wiimoteMac: null,
    // Auto-reconnect on disconnect
    autoReconnect: true,
    // Reconnect interval in ms
    reconnectIntervalMs: 3000,
  },

  // Web server settings
  web: {
    // HTTP server port
    port: 80,
    // WebSocket ping interval in ms
    pingIntervalMs: 30000,
    // CORS allowed origins (null = same origin)
    allowedOrigins: null,
  },

  // Audio settings
  audio: {
    // Enable audio output
    enabled: true,
    // Volume level (0.0 - 1.0)
    volume: 0.7,
    // Path to sound files
    soundPath: './sounds',
    // E-stop alarm sound file
    eStopSound: 'estop_alarm.wav',
  },

  // Logging settings
  logging: {
    // Log level: 'debug', 'info', 'warn', 'error'
    level: 'info',
    // Log file path
    filePath: './logs/app.log',
    // Maximum log file size in bytes before rotation (10MB)
    maxSizeBytes: 10 * 1024 * 1024,
    // Number of rotated log files to keep
    maxFiles: 5,
  },

  // Safety settings
  safety: {
    // Enable motor controller (must be explicitly enabled via API)
    motorsEnabled: false,
    // Allow remote E-stop via web API
    remoteEStopEnabled: true,
    // Require confirmation for E-stop reset
    requireEStopResetConfirm: true,
  },
};

/**
 * Configuration schema for validation.
 * Each key defines the expected type and optional validation function.
 */
export const schema = {
  motors: {
    type: 'object',
    fields: {
      maxSpeed: { type: 'number', min: 0, max: 1 },
      boostMaxSpeed: { type: 'number', min: 0, max: 1 },
      accelRate: { type: 'number', min: 0.01, max: 5 },
      decelRate: { type: 'number', min: 0.01, max: 5 },
      eStopDecelRate: { type: 'number', min: 0.1, max: 10 },
      deadband: { type: 'number', min: 0, max: 0.5 },
      minMovementSpeed: { type: 'number', min: 0, max: 1 },
    },
  },
  battery: {
    type: 'object',
    fields: {
      systemVoltage: { type: 'string', enum: ['12V', '24V'] },
      lowVoltageWarning: { type: 'number', min: 5, max: 30 },
      criticalVoltage: { type: 'number', min: 5, max: 30 },
      pollIntervalMs: { type: 'number', min: 100, max: 10000 },
    },
  },
  input: {
    type: 'object',
    fields: {
      timeoutMs: { type: 'number', min: 100, max: 30000 },
      wiimoteMac: { type: 'string', nullable: true },
      autoReconnect: { type: 'boolean' },
      reconnectIntervalMs: { type: 'number', min: 1000, max: 60000 },
    },
  },
  web: {
    type: 'object',
    fields: {
      port: { type: 'number', min: 1, max: 65535 },
      pingIntervalMs: { type: 'number', min: 1000, max: 300000 },
      allowedOrigins: { type: 'string', nullable: true },
    },
  },
  audio: {
    type: 'object',
    fields: {
      enabled: { type: 'boolean' },
      volume: { type: 'number', min: 0, max: 1 },
      soundPath: { type: 'string' },
      eStopSound: { type: 'string' },
    },
  },
  logging: {
    type: 'object',
    fields: {
      level: { type: 'string', enum: ['debug', 'info', 'warn', 'error'] },
      filePath: { type: 'string' },
      maxSizeBytes: { type: 'number', min: 1024 },
      maxFiles: { type: 'number', min: 1, max: 100 },
    },
  },
  safety: {
    type: 'object',
    fields: {
      motorsEnabled: { type: 'boolean' },
      remoteEStopEnabled: { type: 'boolean' },
      requireEStopResetConfirm: { type: 'boolean' },
    },
  },
};
