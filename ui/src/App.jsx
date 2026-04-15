import { useState, useEffect, useCallback } from 'preact/hooks';
import { StatusBar } from './components/StatusBar.jsx';
import { MotorSpeed } from './components/MotorSpeed.jsx';
import { ControlPanel } from './components/ControlPanel.jsx';
import { TelemetryPanel } from './components/TelemetryPanel.jsx';
import { ConnectionStatus } from './components/ConnectionStatus.jsx';
import { useWebSocket } from './hooks/useWebSocket.js';
import { useRobotStatus } from './hooks/useRobotStatus.js';
import { resetEStop } from './api/client.js';

export default function App() {
  const [robotStatus, setRobotStatus] = useState(null);
  const [motors, setMotors] = useState({ enabled: false, leftSpeed: 0, rightSpeed: 0 });
  const [telemetry, setTelemetry] = useState({ current: 0, temperature: 0 });
  const [wsClients, setWsClients] = useState(0);

  const handleWebSocketMessage = useCallback((data) => {
    if (data.type === 'stateChanged') {
      setRobotStatus(data.robot);
      setMotors(data.motors || { enabled: false, leftSpeed: 0, rightSpeed: 0 });
      setTelemetry({
        current: data.telemetry?.current ?? 0,
        temperature: data.telemetry?.temperature ?? 0,
      });
      setWsClients(data.wsClients ?? 0);
    } else if (data.type === 'emergencyStop') {
      setRobotStatus((prev) => ({ ...prev, state: 'E_STOP', eStopActive: true }));
    } else if (data.type === 'batteryWarning') {
      setRobotStatus((prev) => ({ ...prev, batteryWarning: 'warning', batteryVoltage: data.voltage }));
    }
  }, []);

  const { connected, disconnect } = useWebSocket(
    handleWebSocketMessage,
    null,
    null
  );

  const { status: polledStatus, subscribe, refresh } = useRobotStatus(connected);

  useEffect(() => {
    const unsubscribe = subscribe((data) => {
      setRobotStatus(data.robot);
      setMotors(data.motors || { enabled: false, leftSpeed: 0, rightSpeed: 0 });
      setTelemetry({
        current: data.telemetry?.current ?? 0,
        temperature: data.telemetry?.temperature ?? 0,
      });
      setWsClients(data.wsClients ?? 0);
    });
    return unsubscribe;
  }, [subscribe]);

  const handleStateChange = useCallback(() => {
    refresh();
  }, [refresh]);

  const handleResetEStop = useCallback(async () => {
    const result = await resetEStop();
    if (result.success) {
      refresh();
    }
  }, [refresh]);

  const robotState = robotStatus?.state || 'DISABLED';
  const eStopActive = robotStatus?.eStopActive || false;

  return (
    <div className="app">
      <header className="header">
        <h1>K9 ROBOT CONTROL</h1>
        <ConnectionStatus connected={connected} />
      </header>

      <StatusBar
        state={robotState}
        batteryVoltage={robotStatus?.batteryVoltage || 0}
        batteryWarning={robotStatus?.batteryWarning || 'ok'}
        motorsEnabled={motors.enabled}
      />

      <MotorSpeed
        leftSpeed={motors.leftSpeed}
        rightSpeed={motors.rightSpeed}
      />

      <ControlPanel
        state={robotState}
        eStopActive={eStopActive}
        onStateChange={handleStateChange}
      />

      <TelemetryPanel
        current={telemetry.current}
        temperature={telemetry.temperature}
        wsClients={wsClients}
      />

      {eStopActive && (
        <div className="estop-overlay">
          <h2>EMERGENCY STOP ACTIVE</h2>
          <button className="btn btn-secondary" onClick={handleResetEStop}>
            RESET E-STOP
          </button>
        </div>
      )}
    </div>
  );
}
