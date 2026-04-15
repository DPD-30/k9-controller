import { enableRobot, disableRobot, triggerEStop, resetEStop } from '../api/client.js';

export function ControlPanel({ state, eStopActive, onStateChange }) {
  const isDisabled = state === 'DISABLED';
  const isEnabled = state === 'ENABLED' || state === 'DRIVING';
  const isEStop = state === 'E_STOP';

  const handleEnable = async () => {
    const result = await enableRobot();
    if (result.success) onStateChange();
  };

  const handleDisable = async () => {
    const result = await disableRobot();
    if (result.success) onStateChange();
  };

  const handleEStop = async () => {
    await triggerEStop({ source: 'web-ui' });
    onStateChange();
  };

  const handleResetEStop = async () => {
    const result = await resetEStop();
    if (result.success) onStateChange();
  };

  return (
    <div className="control-panel">
      <div className="title">CONTROL</div>
      <div className="control-buttons">
        {isEStop ? (
          <button className="btn btn-danger" onClick={handleResetEStop}>
            RESET E-STOP
          </button>
        ) : (
          <>
            <button
              className="btn btn-primary"
              onClick={handleEnable}
              disabled={!isDisabled || eStopActive}
            >
              ENABLE
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleDisable}
              disabled={!isEnabled}
            >
              DISABLE
            </button>
            <button
              className="btn btn-danger"
              onClick={handleEStop}
              disabled={isEStop}
            >
              🛑 E-STOP
            </button>
          </>
        )}
      </div>
    </div>
  );
}
