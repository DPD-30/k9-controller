from basicmicro import Basicmicro
import time
rc = Basicmicro("/dev/ttyACM0", 38400)
rc.Open()
address = 0x80 
print(rc.ReadMainBatteryVoltage(0x80))
print(rc.ReadLogicBatteryVoltage(0x80))
print(rc.ReadEncM1(0x80))
print(rc.ReadEncM2(0x80))
for i in range(300):
    print(rc.ReadEncM1(0x80))
   # print(rc.ReadMainBatteryVoltage(0x80))
    time.sleep(0.05)
# for name in sorted(dir(rc)):
#     if "Battery" in name or "Encoder" in name or "Enc" in name:
#         print(name)
# print(controller.ReadVersion(address))
# print([m for m in dir(controller) if "Config" in m or "Serial" in m or "Baud" in m])
# config = controller.GetConfig(0x80)
# print(config)
#help(controller.GetConfig)
#help(controller.SetConfig)