#!/bin/bash

pkill -f "firebase emulators" 2>/dev/null || true
pkill -f "java.*emulator" 2>/dev/null || true


