// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mqtt = require('mqtt');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client', 'build')));

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
const TOPIC_PREFIX = 'parking_system_custom_123456/';

const TOPIC_PUB_SLOT = TOPIC_PREFIX + 'slot_status';
const TOPIC_PUB_GATE_STATUS = TOPIC_PREFIX + 'gate_status';
const TOPIC_SUB_VEHICLE = TOPIC_PREFIX + 'vehicle_status';
const TOPIC_SUB_GATE = TOPIC_PREFIX + 'gate_control';
const TOPIC_DEVICE_STATUS = TOPIC_PREFIX + 'device_status';

// Connect to MQTT broker
const mqttClient = mqtt.connect(`mqtt://${MQTT_BROKER}:${MQTT_PORT}`);

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');

  mqttClient.subscribe(TOPIC_PUB_SLOT);
  mqttClient.subscribe(TOPIC_PUB_GATE_STATUS);
  mqttClient.subscribe(TOPIC_DEVICE_STATUS);
});

// WebSocket connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('control_gate', (action) => {
    console.log('Gate control:', action);
    mqttClient.publish(TOPIC_SUB_GATE, action);
  });

  socket.on('simulate_vehicle', (status) => {
    console.log('Vehicle simulation:', status);
    mqttClient.publish(TOPIC_SUB_VEHICLE, status);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Handle MQTT messages
mqttClient.on('message', (topic, message) => {
  try {
    const messageStr = message.toString();
    console.log(`MQTT message: ${topic} -> ${messageStr}`);

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

// React app fallback route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
