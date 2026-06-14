const BASE_URL = '';

export async function fetchStatus() {
  const res = await fetch(`${BASE_URL}/api/status`);
  if (!res.ok) throw new Error('Failed to fetch status');
  return res.json();
}

export async function enableRobot() {
  const res = await fetch(`${BASE_URL}/api/enable`, { method: 'POST' });
  return res.json();
}

export async function disableRobot() {
  const res = await fetch(`${BASE_URL}/api/disable`, { method: 'POST' });
  return res.json();
}

export async function triggerEStop(context = {}) {
  const res = await fetch(`${BASE_URL}/api/estop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(context),
  });
  return res.json();
}

export async function resetEStop() {
  const res = await fetch(`${BASE_URL}/api/reset-estop`, { method: 'POST' });
  return res.json();
}

export async function fetchTelemetry() {
  const res = await fetch(`${BASE_URL}/api/telemetry`);
  if (!res.ok) throw new Error('Failed to fetch telemetry');
  return res.json();
}

export async function fetchServoConfig() {
  const res = await fetch(`${BASE_URL}/api/config/servos`);
  if (!res.ok) throw new Error('Failed to fetch servo config');
  return res.json();
}

export async function updateServoConfig(name, config) {
  const res = await fetch(`${BASE_URL}/api/config/servos/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  return res.json();
}

export async function overrideServo(name, angle) {
  const res = await fetch(`${BASE_URL}/api/control/servo-override`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, angle }),
  });
  return res.json();
}
