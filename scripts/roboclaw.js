import { SerialPort } from 'serialport';

class RoboClaw {
    constructor(path, address = 0x80, baudRate = 38400) {
        this.address = address;
        this.port = new SerialPort({
            path,
            baudRate,
            autoOpen: false
        });
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.port.open((err) => {
                if (err) return reject(err);
                console.log(`Serial port opened`);
                resolve();
            });
        });
    }

    calculateCRC(data) {
        let crc = 0;
        for (let i = 0; i < data.length; i++) {
            crc ^= (data[i] << 8);
            for (let j = 0; j < 8; j++) {
                if ((crc & 0x8000) !== 0) {
                    crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
                } else {
                    crc = (crc << 1) & 0xFFFF;
                }
            }
        }
        return crc;
    }

    async sendCommand(command, data = []) {
        const packet = [this.address, command, ...data];
        const crc = this.calculateCRC(packet);
        packet.push((crc >> 8) & 0xFF);
        
        packet.push(crc & 0xFF);

        const buf = Buffer.from(packet);
        console.log(`Sending: ${buf.toString('hex').toUpperCase()}`);
        return new Promise((resolve, reject) => {
            this.port.write(buf, (err) => {
                if (err) return reject(err);
                 this.port.once('data', data => {
                 console.log('ACK:', data);
                resolve(data);})
   
            });
        });
    }

  async forwardM1(speed) {
    speed = Math.max(0, Math.min(127, speed));

    const b1 = speed;
    const b2 = Math.min(255, speed << 1);

    await this.sendCommand(0x34, [
        b1,
        b2,
        0x00,
        0x00,
        0x00,
        0x00
    ]);
}

    async backwardM1(speed) {
        await this.sendCommand(0x35, [(speed >> 8) & 0xFF, speed & 0xFF]);
    }

    async stopM1() {
        await this.forwardM1(0);
    }
}

export default RoboClaw;
