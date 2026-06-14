import i2c from "i2c-bus";
import { Pca9685Driver } from "pca9685";

const options = {
  i2c: i2c.openSync(1),
  address: 0x40,
  frequency: 50,
  debug: false
};

const SERVO_CHANNEL = 0;

// Convert angle → pulse width
function angleToPulse(angle) {
  const minPulse = 500;
  const maxPulse = 2500;

  return Math.round(
    minPulse + (angle / 180) * (maxPulse - minPulse)
  );
}

function moveServo(pwm, angle) {
  const pulse = angleToPulse(angle);
  console.log(`Moving servo to ${angle}° (${pulse}µs)`);
  pwm.setPulseLength(SERVO_CHANNEL, pulse);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const pwm = new Pca9685Driver(options, async (err) => {
  if (err) {
    console.error("Error initializing PCA9685:", err);
    process.exit(1);
  }

  console.log("PCA9685 initialized");

  try {
    moveServo(pwm, 45);
    await wait(2000);

    moveServo(pwm, 90);
    await wait(2000);

    moveServo(pwm, 0);
    await wait(2000);

    pwm.channelOff(SERVO_CHANNEL);

    console.log("Done");
  } catch (error) {
    console.error(error);
  }
});