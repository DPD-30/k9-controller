import { metrics } from '@opentelemetry/api';
import { env } from '../config/env.js';

const meter = metrics.getMeter(env.serviceName, env.serviceVersion);

// Counter: total requests (cumulative)
export const requestCounter = meter.createCounter('k9_requests_total', {
  description: 'Total number of HTTP requests',
  unit: '{requests}',
});

// Histogram: request duration
export const requestDuration = meter.createHistogram('k9_request_duration', {
  description: 'HTTP request duration in milliseconds',
  unit: 'ms',
});

// Record request with labels and duration
export function recordRequest(method, path, statusCode, durationMs) {
  requestCounter.add(1, {
    method,
    path,
    status_code: String(statusCode),
  });

  requestDuration.record(durationMs, {
    method,
    path,
    status_code: String(statusCode),
  });
}