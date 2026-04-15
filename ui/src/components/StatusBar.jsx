export function StatusBar({ state, batteryVoltage, batteryWarning, motorsEnabled }) {
  const stateClass = state === 'ENABLED' ? 'state-enabled'
    : state === 'E_STOP' ? 'state-estop'
    : 'state-disabled';

  const batteryClass = batteryWarning === 'critical' ? 'battery-critical'
    : batteryWarning === 'warning' ? 'battery-warning'
    : 'battery-ok';

  return (
    <div className="status-grid">
      <div className="status-card">
        <div className="label">State</div>
        <div className={`value ${stateClass}`}>{state || 'UNKNOWN'}</div>
      </div>
      <div className="status-card">
        <div className="label">Battery</div>
        <div className={`value ${batteryClass}`}>
          {batteryVoltage ? `${batteryVoltage.toFixed(1)}V` : '--'}
        </div>
      </div>
      <div className="status-card">
        <div className="label">Motors</div>
        <div className="value">{motorsEnabled ? 'ON' : 'OFF'}</div>
      </div>
    </div>
  );
}
