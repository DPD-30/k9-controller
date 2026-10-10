import RoboClaw from './roboclaw.js';

async function run() {
    const rc = new RoboClaw('/dev/ttyACM0');
    try {
        await rc.connect();
        console.log("Testing M1...");
        await rc.forwardM1(63);

        await new Promise(resolve => setTimeout(resolve, 2000));

        await rc.forwardM1(0);
        console.log("Done");
    } catch (e) {
        console.error("Error:", e);
    }
}

run();
