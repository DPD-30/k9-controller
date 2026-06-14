import PCA9685 from 'pca9685';

// Setup PCA9685
const pca = new PCA9685();

// Servo settings
const SERVO_MIN = 150; // Min pulse length (approx 0 degrees)
const SERVO_MAX = 600; // Max pulse length (approx 180 degrees)
const SERVO_CHANNEL = 0; // Testing first servo

async function testServo() {
  console.log(`Testing servo on channel ${SERVO_CHANNEL}...`);

  try {
    // Move to 0 degrees
    console.log('Moving to 0°');
    pca.setPWM(SERVO_CHANNEL, 0, SERVO_MIN);
    await new Promise(r => setTimeout(r, 1000));

    // Move to 90 degrees
    console.log('Moving to 90°');
    pca.setPWM(SERVO_CHANNEL, 0, Math.floor((SERVO_MIN + SERVO_MAX) / 2));
    await new Promise(r => setTimeout(r, 1000));

    // Move to 180 degrees
    console.log('Moving to 180°');
    pca.setPWM(SERVO_CHANNEL, 0, SERVO_MAX);
    await new Promise(r => setTimeout(r, 1000));

    // Return to 90 degrees
    console.log('Returning to 90°');
    pca.setPWM(SERVO_CHANNEL, 0, Math.floor((SERVO_MIN + SERVO_MAX) / 2));

    console.log('Servo test complete.');
  } catch (err) {
    console.error('Error controlling servo:', err);
  }
}

testServo();
