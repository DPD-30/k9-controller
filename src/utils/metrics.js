import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('my-app');

// Example metric
export const requestCounter = meter.createCounter('requests_total', {
  description: 'Total number of requests',
});

export function recordRequest() {
  requestCounter.add(1);
}