import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { context, trace } from '@opentelemetry/api';
import { env } from '../config/env.js';

// ensure log directory exists
const logDir = path.resolve('./logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// ---- trace correlation ----
function traceMixin() {
  const span = trace.getSpan(context.active());
  if (!span) {return {};}

  const ctx = span.spanContext();
  return {
    trace_id: ctx.traceId,
    span_id: ctx.spanId,
  };
}

// ---- file destination ----
const destination = pino.destination({
  dest: path.join(logDir, 'app.log'),
  sync: false, // async = better performance
});

export const logger = pino({
  level: env.logLevel,

  base: {
    service: env.serviceName,
    env: env.environment,
  },

  mixin: traceMixin,

  timestamp: pino.stdTimeFunctions.isoTime,

  formatters: {
    level(label) {
      return { level: label };
    },
  },
}, destination);