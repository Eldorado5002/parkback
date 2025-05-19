// src/services/socketService.js
import { io } from 'socket.io-client';

// Connect to the server (adjust URL based on your deployment)
const SOCKET_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin 
  : 'http://localhost:5000';

const socket = io(SOCKET_URL);

// Socket connection events
socket.on('connect', () => {
  console.log('Connected to socket server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from socket server');
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

// API for sending commands to the ESP32
const socketService = {
  // Subscribe to real-time updates
  subscribeToSlotUpdates: (callback) => {
    socket.on('slot_update', callback);
    return () => socket.off('slot_update', callback);
  },
  
  subscribeToGateUpdates: (callback) => {
    socket.on('gate_update', callback);
    return () => socket.off('gate_update', callback);
  },
  
  subscribeToDeviceStatus: (callback) => {
    socket.on('device_status', callback);
    return () => socket.off('device_status', callback);
  },
  
  // Control functions
  openGate: () => {
    socket.emit('control_gate', 'OPEN');
  },
  
  closeGate: () => {
    socket.emit('control_gate', 'CLOSE');
  },
  
  // Simulation functions (for testing without actual vehicle detection)
  simulateVehicleDetected: () => {
    socket.emit('simulate_vehicle', 'DETECTED');
  },
  
  simulateVehicleAway: () => {
    socket.emit('simulate_vehicle', 'NONE');
  }
};

export default socketService;