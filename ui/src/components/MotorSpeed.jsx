export function MotorSpeed({ leftSpeed, rightSpeed }) {
  const formatValue = (v) => (v >= 0 ? '+' : '') + v.toFixed(2);

  const leftPercent = Math.min(100, Math.abs(leftSpeed) * 100);
  const rightPercent = Math.min(100, Math.abs(rightSpeed) * 100);

  return (
    <div className="motor-speed-panel">
      <div className="title">MOTOR SPEED</div>
      <div className="motor-bar">
        <span className="label">LEFT</span>
        <div className="track">
          <div
            className={`fill ${leftSpeed < 0 ? 'reverse' : ''}`}
            style={{ width: `${leftPercent}%` }}
          />
        </div>
        <span className="value">{formatValue(leftSpeed)}</span>
      </div>
      <div className="motor-bar">
        <span className="label">RIGHT</span>
        <div className="track">
          <div
            className={`fill ${rightSpeed < 0 ? 'reverse' : ''}`}
            style={{ width: `${rightPercent}%` }}
          />
        </div>
        <span className="value">{formatValue(rightSpeed)}</span>
      </div>
    </div>
  );
}
