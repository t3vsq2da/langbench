#!/bin/bash

set -e

echo "preparing the system for a more accurate test"
echo "a password for sudo will be requested."

run_sudo() {
  sudo "$@"
}

# 1. Установка CPU governor в 'performance'
if command -v cpupower >/dev/null 2>&1; then
  echo "etting CPU governor to 'performance'..."
  run_sudo cpupower frequency-set -g performance >/dev/null
  echo "done"
else
  echo "the 'cpupower' utility was not found"
fi

if [ -f /sys/devices/system/cpu/intel_pstate/no_turbo ]; then
  echo "disabling Intel Turbo Boost..."
  run_sudo sh -c 'echo 1 > /sys/devices/system/cpu/intel_pstate/no_turbo'
  echo "done"
elif [ -f /sys/devices/system/cpu/cpufreq/boost ]; then
  echo "Disabling CPU boost..."
  run_sudo sh -c 'echo 0 > /sys/devices/system/cpu/cpufreq/boost'
  echo "done"
else
  echo "couldn't determine how to disable Turbo Boost. Skip it."
fi

echo "the system is set up, you can run ./bench.mjs"
echo "the settings are valid until reboot."