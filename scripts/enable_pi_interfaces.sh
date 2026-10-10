#!/bin/bash
# Enable I2C and Serial interfaces on Raspberry Pi

set -e

echo "Enabling I2C..."
sudo raspi-config nonint do_i2c 0

echo "Enabling Serial Hardware..."
sudo raspi-config nonint do_serial_hw 0

echo "Disabling Serial Console via cmdline.txt..."
# Try both possible locations for cmdline.txt
CMDLINE_FILES=("/boot/firmware/cmdline.txt" "/boot/cmdline.txt")

for file in "${CMDLINE_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Cleaning $file..."
    sudo sed -i 's/console=serial[0-9]*,[0-9]*//g' "$file"
    sudo sed -i 's/console=tty[A-Z]*[0-9]*,[0-9]*//g' "$file"
    sudo sed -i 's/  / /g' "$file"
  fi
done

echo "------------------------------------------------------------------"
echo "Interfaces configured. System reboot required to apply changes."
echo "Run: sudo reboot"
echo "------------------------------------------------------------------"
