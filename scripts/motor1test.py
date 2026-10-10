import time
from basicmicro import Basicmicro

ADDRESS = 0x80

rc = Basicmicro("/dev/ttyACM0", 38400)
rc.Open()

def stop():
    try:
        rc.ForwardM1(ADDRESS, 0)
    except:
        pass

try:
    print("Motor 1 test starting...")

    # much slower ramp + integer safety
    rc.ForwardM1(ADDRESS, 63)

    time.sleep(10)

    for speed in [ 0]:
        speed = int(speed)
        rc.ForwardM1(ADDRESS, speed)
        print("M1 speed:", speed)
        time.sleep(0.6)

    stop()
    print("Done")

except Exception as e:
    stop()
    print("Error:", e)