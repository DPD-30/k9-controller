import { Router } from 'express';
import { logger } from '../observability/logger.js';

/**
 * Create REST API routes for robot control.
 * @param {RobotController} robotController - Robot controller instance
 * @param {MotorController} motorController - Motor controller instance (for telemetry)
 * @param {BehaviorOrchestrator} behaviorOrchestrator - Behavior orchestrator instance
 * @returns {Router}
 */
export function createRobotRoutes(robotController, motorController, behaviorOrchestrator) {
  const router = Router();

  /**
   * GET /api/status
   * Get current robot status including state, battery, and motor speeds.
   */
  router.get('/status', (req, res) => {
    try {
      const status = robotController.getStatus();
      const telemetry = motorController?.getTelemetry?.() || {};

      const response = {
        success: true,
        timestamp: new Date().toISOString(),
        robot: {
          state: status.state,
          eStopActive: status.eStopActive,
          inputTimeout: status.inputTimeout,
          batteryVoltage: status.batteryVoltage || telemetry.voltage || 0,
          batteryWarning: status.batteryWarning || 'ok',
        },
        motors: {
          enabled: motorController?.isEnabled?.() || false,
          leftSpeed: status.motorSpeeds?.left || 0,
          rightSpeed: status.motorSpeeds?.right || 0,
        },
        telemetry: {
          voltage: telemetry.voltage || 0,
          current: telemetry.current || 0,
          temperature: telemetry.temperature || 0,
        },
        wsClients: req.app.get('wsClientCount') || 0,
      };

      logger.debug({ status: response.robot.state }, 'Status API called');
      res.json(response);
    } catch (err) {
      logger.error({ err }, 'Failed to get status');
      res.status(500).json({
        success: false,
        error: 'Failed to get robot status',
      });
    }
  });

  /**
   * POST /api/enable
   * Enable the robot (transition from DISABLED to ENABLED).
   */
  router.post('/enable', (req, res) => {
    try {
      const result = robotController.enable();

      if (result.success) {
        logger.info('Robot enabled via API');
        res.json({
          success: true,
          message: 'Robot enabled',
        });
      } else {
        logger.warn({ error: result.error }, 'Failed to enable robot');
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (err) {
      logger.error({ err }, 'Error enabling robot');
      res.status(500).json({
        success: false,
        error: 'Failed to enable robot',
      });
    }
  });

  /**
   * POST /api/disable
   * Disable the robot.
   */
  router.post('/disable', (req, res) => {
    try {
      const result = robotController.disable();

      if (result.success) {
        logger.info('Robot disabled via API');
        res.json({
          success: true,
          message: 'Robot disabled',
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (err) {
      logger.error({ err }, 'Error disabling robot');
      res.status(500).json({
        success: false,
        error: 'Failed to disable robot',
      });
    }
  });

  /**
   * POST /api/estop
   * Trigger emergency stop.
   */
  router.post('/estop', (req, res) => {
    try {
      const context = {
        source: 'api',
        ip: req.ip,
        userAgent: req.get('user-agent'),
      };

      const result = robotController.emergencyStop(context);

      if (result.success) {
        logger.info({ source: 'api', ip: req.ip }, 'E-stop triggered via API');
        res.json({
          success: true,
          message: 'Emergency stop triggered',
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (err) {
      logger.error({ err }, 'Error triggering E-stop');
      res.status(500).json({
        success: false,
        error: 'Failed to trigger E-stop',
      });
    }
  });

  /**
   * POST /api/reset-estop
   * Reset emergency stop (must be in E_STOP state).
   */
  router.post('/reset-estop', (req, res) => {
    try {
      const result = robotController.resetEStop();

      if (result.success) {
        logger.info('E-stop reset via API');
        res.json({
          success: true,
          message: 'E-stop reset',
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (err) {
      logger.error({ err }, 'Error resetting E-stop');
      res.status(500).json({
        success: false,
        error: 'Failed to reset E-stop',
      });
    }
  });

  /**
   * GET /api/telemetry
   * Get raw motor telemetry data.
   */
  router.get('/telemetry', (req, res) => {
    try {
      const telemetry = motorController?.getTelemetry?.() || {};

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        telemetry: {
          voltage: telemetry.voltage || 0,
          current: telemetry.current || 0,
          temperature: telemetry.temperature || 0,
          leftSpeed: telemetry.leftSpeed || 0,
          rightSpeed: telemetry.rightSpeed || 0,
          enabled: telemetry.enabled || false,
          fault: telemetry.fault || false,
          faults: telemetry.faults || [],
        },
      });
    } catch (err) {
      logger.error({ err }, 'Failed to get telemetry');
      res.status(500).json({
        success: false,
        error: 'Failed to get telemetry',
      });
    }
  });

  /**
   * GET /api/config/servos
   * Get current servo calibration values.
   */
  router.get('/config/servos', (req, res) => {
    try {
      const servoController = robotController._behaviorOrchestrator?._servoController;
      if (!servoController) throw new Error('ServoController not initialized');

      res.json({
        success: true,
        calibration: servoController.calibration
      });
    } catch (err) {
      logger.error({ err }, 'Failed to get servo config');
      res.status(500).json({ success: false, error: err.message });
    }
  });

  /**
   * POST /api/config/servos/:name
   * Update calibration for a specific servo.
   */
  router.post('/config/servos/:name', (req, res) => {
    try {
      const { name } = req.params;
      const newCal = req.body;
      const servoController = robotController._behaviorOrchestrator?._servoController;

      if (!servoController) throw new Error('ServoController not initialized');

      servoController.updateCalibration(name, newCal);
      res.json({ success: true, message: `Updated calibration for ${name}` });
    } catch (err) {
      logger.error({ err }, 'Failed to update servo config');
      res.status(400).json({ success: false, error: err.message });
    }
  });

  /**
   * POST /api/control/servo-override
   * Manually set a servo angle.
   */
  router.post('/control/servo-override', (req, res) => {
    try {
      const { name, angle } = req.body;
      if (!name || angle === undefined) {
        return res.status(400).json({ success: false, error: 'Missing name or angle' });
      }

      if (!behaviorOrchestrator) throw new Error('BehaviorOrchestrator not initialized');

      behaviorOrchestrator.overrideServo(name, angle);
      res.json({ success: true });
    } catch (err) {
      logger.error({ err }, 'Servo override failed');
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}

export default createRobotRoutes;
