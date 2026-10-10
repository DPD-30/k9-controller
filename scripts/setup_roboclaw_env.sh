#!/bin/bash
# Setup Python environment for RoboClaw configuration on Raspberry Pi

set -e

echo "Updating system..."
sudo apt-get update
sudo apt-get install -y python3-pip python3-venv

echo "Creating virtual environment in ~/roboclaw_setup..."
python3 -m venv ~/roboclaw_setup

echo "Installing basicmicro library..."
~/roboclaw_setup/bin/pip install basicmicro

echo "------------------------------------------------------------------"
echo "Setup complete."
echo "To run the config script, use:"
echo "  source ~/roboclaw_setup/bin/activate"
echo "  python3 k9/scripts/configure_roboclaw.py"
echo "------------------------------------------------------------------"
