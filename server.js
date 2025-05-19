// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mqtt = require('mqtt');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'build')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// MQTT client setup
const MQTT_BROKER = 'broker.hivemq.com';
const MQTT_PORT = 1883;
const TOPIC_PREFIX = 'parking_system_custom_123456/'; // Match the ESP32 topic prefix

// MQTT Topics (same as on ESP32)
const TOPIC_PUB_SLOT = TOPIC_PREFIX + 'slot_status';
const TOPIC_PUB_GATE_STATUS = TOPIC_PREFIX + 'gate_status';
const TOPIC_SUB_VEHICLE = TOPIC_PREFIX + 'vehicle_status';
const TOPIC_SUB_GATE = TOPIC_PREFIX + 'gate_control';
const TOPIC_DEVICE_STATUS = TOPIC_PREFIX + 'device_status';

// Connect to MQTT broker
const mqttClient = mqtt.connect(`mqtt://${MQTT_BROKER}:${MQTT_PORT}`);

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  
  // Subscribe to topics published by the ESP32
  mqttClient.subscribe(TOPIC_PUB_SLOT);
  mqttClient.subscribe(TOPIC_PUB_GATE_STATUS);
  mqttClient.subscribe(TOPIC_DEVICE_STATUS);
});

// WebSocket connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Handle gate control commands from frontend
  socket.on('control_gate', (action) => {
    console.log('Gate control:', action);
    mqttClient.publish(TOPIC_SUB_GATE, action); // Forward command to ESP32
  });
  
  // Handle vehicle detection simulations from frontend
  socket.on('simulate_vehicle', (status) => {
    console.log('Vehicle simulation:', status);
    mqttClient.publish(TOPIC_SUB_VEHICLE, status); // Forward to ESP32
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Handle MQTT messages from ESP32 and broadcast to WebSocket clients
mqttClient.on('message', (topic, message) => {
  try {
    const messageStr = message.toString();
    console.log(`MQTT message: ${topic} -> ${messageStr}`);
    
    // Forward the message to all connected WebSocket clients
    if (topic === TOPIC_PUB_SLOT) {
      io.emit('slot_update', messageStr);
    } else if (topic === TOPIC_PUB_GATE_STATUS) {
      io.emit('gate_update', messageStr);
    } else if (topic === TOPIC_DEVICE_STATUS) {
      io.emit('device_status', messageStr);
    }
  } catch (error) {
    console.error('Error processing MQTT message:', error);
  }
});

// Serve React app for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});