#!/usr/bin/env node
/**
 * Initialize the K9 robot configuration file.
 * Creates a config.json with default values if it doesn't exist.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defaults } from '../src/config/defaults.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configDir = path.resolve(process.cwd(), 'data');
const configPath = path.join(configDir, 'config.json');

console.log('K9 Robot Configuration Initializer');
console.log('==================================\n');

if (fs.existsSync(configPath)) {
  console.log(`Config file already exists at: ${configPath}`);
  console.log('Delete it first if you want to regenerate with defaults.');
  process.exit(0);
}

// Create config directory if it doesn't exist
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
  console.log(`Created config directory: ${configDir}`);
}

// Write default configuration
const content = JSON.stringify(defaults, null, 2);
fs.writeFileSync(configPath, content, 'utf8');

console.log(`Created default configuration at: ${configPath}`);
console.log('\nDefault configuration:');
console.log('---');
console.log(content);
console.log('---');
console.log('\nYou can now edit this file to customize your K9 robot settings.');
