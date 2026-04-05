import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { defaults, schema } from './defaults.js';

/**
 * Configuration manager with validation, persistence, and change events.
 */
export class Config extends EventEmitter {
  constructor(configPath = './data/config.json') {
    super();
    this.configPath = configPath;
    this.config = JSON.parse(JSON.stringify(defaults)); // Deep clone defaults
  }

  /**
   * Load configuration from file.
   * Missing file is OK - defaults are used.
   * @returns {Promise<this>}
   */
  async load() {
    const fullPath = path.resolve(this.configPath);

    if (fs.existsSync(fullPath)) {
      try {
        const fileContent = fs.readFileSync(fullPath, 'utf8');
        const fileConfig = JSON.parse(fileContent);

        // Merge file config with defaults (file values override defaults)
        this.config = this._deepMerge(defaults, fileConfig);

        // Validate the merged config
        const validation = this.validate();
        if (!validation.valid) {
          console.warn('Config validation warnings:', validation.errors);
          // Continue with warnings - invalid values fall back to defaults
        }

        this.emit('loaded', this.config);
      } catch (err) {
        console.warn(`Failed to load config from ${fullPath}:`, err.message);
        console.warn('Using default configuration');
      }
    } else {
      // No config file - create directory and save defaults
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      await this.save();
    }

    return this;
  }

  /**
   * Save current configuration to file.
   * @returns {Promise<void>}
   */
  async save() {
    const fullPath = path.resolve(this.configPath);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const content = JSON.stringify(this.config, null, 2);
    fs.writeFileSync(fullPath, content, 'utf8');
    this.emit('saved', this.config);
  }

  /**
   * Get a configuration value by dot-notation path.
   * @param {string} path - e.g., 'motors.maxSpeed'
   * @param {*} defaultValue - Value to return if path doesn't exist
   * @returns {*}
   */
  get(path, defaultValue) {
    const keys = path.split('.');
    let value = this.config;

    for (const key of keys) {
      if (value === undefined || value === null) {
        return defaultValue;
      }
      value = value[key];
    }

    return value !== undefined ? value : defaultValue;
  }

  /**
   * Set a configuration value by dot-notation path.
   * @param {string} path - e.g., 'motors.maxSpeed'
   * @param {*} value - Value to set
   * @returns {boolean} - True if value changed
   */
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();

    let obj = this.config;
    for (const key of keys) {
      if (obj[key] === undefined || obj[key] === null) {
        return false;
      }
      obj = obj[key];
    }

    const oldValue = obj[lastKey];
    if (oldValue === value) {
      return false;
    }

    obj[lastKey] = value;
    this.emit('changed', { path, oldValue, newValue: value });
    return true;
  }

  /**
   * Validate configuration against schema.
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate() {
    const errors = [];

    for (const [section, sectionSchema] of Object.entries(schema)) {
      const sectionValue = this.config[section];

      if (!sectionValue || typeof sectionValue !== 'object') {
        errors.push(`Section '${section}' is missing or not an object`);
        continue;
      }

      for (const [field, fieldSchema] of Object.entries(sectionSchema.fields)) {
        const value = sectionValue[field];

        // Check if field exists and is not null when required
        if (value === undefined || value === null) {
          if (!fieldSchema.nullable) {
            errors.push(`${section}.${field}: required field is missing`);
          }
          continue;
        }

        // Type validation
        if (fieldSchema.type === 'number' && typeof value !== 'number') {
          errors.push(`${section}.${field}: expected number, got ${typeof value}`);
          continue;
        }
        if (fieldSchema.type === 'string' && typeof value !== 'string') {
          errors.push(`${section}.${field}: expected string, got ${typeof value}`);
          continue;
        }
        if (fieldSchema.type === 'boolean' && typeof value !== 'boolean') {
          errors.push(`${section}.${field}: expected boolean, got ${typeof value}`);
          continue;
        }

        // Range validation for numbers
        if (fieldSchema.type === 'number') {
          if (fieldSchema.min !== undefined && value < fieldSchema.min) {
            errors.push(`${section}.${field}: ${value} is below minimum ${fieldSchema.min}`);
          }
          if (fieldSchema.max !== undefined && value > fieldSchema.max) {
            errors.push(`${section}.${field}: ${value} is above maximum ${fieldSchema.max}`);
          }
        }

        // Enum validation for strings
        if (fieldSchema.type === 'string' && fieldSchema.enum) {
          if (!fieldSchema.enum.includes(value)) {
            errors.push(`${section}.${field}: ${value} is not in allowed values [${fieldSchema.enum.join(', ')}]`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Reset a section to default values.
   * @param {string} section - e.g., 'motors'
   * @returns {boolean} - True if section was reset
   */
  resetSection(section) {
    if (!defaults[section]) {
      return false;
    }

    const oldValue = this.config[section];
    this.config[section] = JSON.parse(JSON.stringify(defaults[section]));
    this.emit('changed', { path: section, oldValue, newValue: this.config[section] });
    return true;
  }

  /**
   * Reset all configuration to defaults.
   */
  resetAll() {
    const oldValue = this.config;
    this.config = JSON.parse(JSON.stringify(defaults));
    this.emit('changed', { path: '*', oldValue, newValue: this.config });
  }

  /**
   * Get the full configuration object.
   * @returns {object}
   */
  getAll() {
    return JSON.parse(JSON.stringify(this.config)); // Return a copy
  }

  /**
   * Deep merge two objects (source overrides target).
   * @private
   */
  _deepMerge(target, source) {
    const result = { ...target };

    for (const key of Object.keys(source)) {
      if (source[key] instanceof Object && key in target) {
        result[key] = this._deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }
}

// Singleton instance for convenience
let configInstance = null;

export async function getConfig(configPath) {
  if (!configInstance) {
    configInstance = new Config(configPath);
    await configInstance.load();
  }
  return configInstance;
}

export default Config;
