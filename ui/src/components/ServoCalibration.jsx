import { useState, useEffect } from 'preact/hooks';
import { fetchServoConfig, updateServoConfig, overrideServo } from '../api/client.js';

export function ServoCalibration() {
  const [servos, setServos] = useState({});
  const [loading, setLoading] = useState(true);
  const [hwWarningAccepted, setHwWarningAccepted] = useState(false);
  const [logWarningAccepted, setLogWarningAccepted] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const data = await fetchServoConfig();
      if (data.success) setServos(data.calibration);
    } catch (e) {
      console.error('Failed to load servo config', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleParamChange(name, key, value) {
    const updated = { ...servos[name], [key]: parseFloat(value) };
    setServos({ ...servos, [name]: updated });
    await updateServoConfig(name, updated);
  }

  async function handleTestMove(name, angle) {
    await overrideServo(name, angle);
  }

  if (loading) return <div className="p-4">Loading calibration...</div>;

  return (
    <div className="servo-calibration p-4">
      <h2>Servo Calibration</h2>

      <div className="warning-box bg-red-100 p-3 mb-4 border border-red-400 rounded">
        <p className="text-red-700 font-bold">⚠️ HARDWARE LIMIT WARNING</p>
        <p className="text-sm text-red-600">
          Ensure servo is physically detached from linkage or has full clear travel.
          Moving to extreme pulse widths can damage gears or force linkages if obstructed.
        </p>
        <label className="flex items-center mt-2 cursor-pointer">
          <input type="checkbox" checked={hwWarningAccepted} onChange={e => setHwWarningAccepted(e.target.checked)} />
          <span className="ml-2 text-sm">I acknowledge hardware risks</span>
        </label>
      </div>

      <div className="warning-box bg-yellow-100 p-3 mb-4 border border-yellow-400 rounded">
        <p className="text-yellow-700 font-bold">⚠️ RANGE LIMIT WARNING</p>
        <p className="text-sm text-yellow-600">
          Verify the mechanical assembly can reach this angle without colliding with other parts.
          Over-extension can cause servo stall or structural damage.
        </p>
        <label className="flex items-center mt-2 cursor-pointer">
          <input type="checkbox" checked={logWarningAccepted} onChange={e => setLogWarningAccepted(e.target.checked)} />
          <span className="ml-2 text-sm">I acknowledge logical range risks</span>
        </label>
      </div>

      <div className="servo-grid grid gap-6">
        {Object.entries(servos).map(([name, cal]) => (
          <div key={name} className="servo-card p-4 border rounded bg-gray-50 shadow-sm">
            <h3 className="font-bold text-lg mb-3 uppercase">{name}</h3>

            <div className="param-group mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">HARDWARE PULSE (µs)</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs">Min</label>
                  <input type="number" value={cal.min} onChange={e => handleParamChange(name, 'min', e.target.value)} className="w-full p-1 border rounded" />
                </div>
                <div>
                  <label className="block text-xs">Max</label>
                  <input type="number" value={cal.max} onChange={e => handleParamChange(name, 'max', e.target.value)} className="w-full p-1 border rounded" />
                </div>
                <div>
                  <label className="block text-xs">Trim</label>
                  <input type="number" value={cal.trim} onChange={e => handleParamChange(name, 'trim', e.target.value)} className="w-full p-1 border rounded" />
                </div>
              </div>
            </div>

            <div className="param-group mb-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">LOGICAL LIMITS (deg)</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs">Limit Min</label>
                  <input type="number" value={cal.limitMin} onChange={e => handleParamChange(name, 'limitMin', e.target.value)} className="w-full p-1 border rounded" />
                </div>
                <div>
                  <label className="block text-xs">Limit Max</label>
                  <input type="number" value={cal.limitMax} onChange={e => handleParamChange(name, 'limitMax', e.target.value)} className="w-full p-1 border rounded" />
                </div>
              </div>
            </div>

            <div className="test-group pt-3 border-t">
              <p className="text-xs font-semibold text-gray-500 mb-2">REAL-TIME TEST (-180° to 180°)</p>
              <input
                type="range"
                min="-180"
                max="180"
                value="0"
                disabled={!hwWarningAccepted || !logWarningAccepted}
                onChange={e => handleTestMove(name, parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>-180°</span>
                <span>0°</span>
                <span>180°</span>
              </div>
              {!hwWarningAccepted || !logWarningAccepted ? (
                <p className="text-xs text-red-500 mt-1 italic">Acknowledge warnings to unlock test slider</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
