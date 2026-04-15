export function TelemetryPanel({ current, temperature, wsClients }) {
  return (
    <div className="telemetry-panel">
      <div className="title">TELEMETRY</div>
      <div className="telemetry-grid">
        <div className="telemetry-item">
          <div className="label">CURRENT</div>
          <div className="value">{current?.toFixed(2) ?? '--'}A</div>
        </div>
        <div className="telemetry-item">
          <div className="label">TEMP</div>
          <div className="value">{temperature ?? '--'}°C</div>
        </div>
        <div className="telemetry-item">
          <div className="label">WS CLIENTS</div>
          <div className="value">{wsClients ?? 0}</div>
        </div>
      </div>
    </div>
  );
}
