const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mqtt = require('mqtt');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // You can restrict this to your frontend domain in production
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json()); // For parsing JSON requests if needed

// MQTT Setup
const MQTT_BROKER = 'mqtt://broker.hivemq.com';
const TOPIC_PREFIX = 'parking_system_custom_123456/';

const TOPIC_PUB_SLOT = `${TOPIC_PREFIX}slot_status`;
const TOPIC_PUB_GATE_STATUS = `${TOPIC_PREFIX}gate_status`;
const TOPIC_SUB_VEHICLE = `${TOPIC_PREFIX}vehicle_status`;
const TOPIC_SUB_GATE = `${TOPIC_PREFIX}gate_control`;
const TOPIC_DEVICE_STATUS = `${TOPIC_PREFIX}device_status`;

const mqttClient = mqtt.connect(MQTT_BROKER);

mqttClient.on('connect', () => {
  console.log('✅ Connected to MQTT broker');
  mqttClient.subscribe([TOPIC_PUB_SLOT, TOPIC_PUB_GATE_STATUS, TOPIC_DEVICE_STATUS]);
});

mqttClient.on('message', (topic, message) => {
  const msg = message.toString();
  console.log(`MQTT: ${topic} → ${msg}`);

  if (topic === TOPIC_PUB_SLOT) io.emit('slot_update', msg);
  else if (topic === TOPIC_PUB_GATE_STATUS) io.emit('gate_update', msg);
  else if (topic === TOPIC_DEVICE_STATUS) io.emit('device_status', msg);
});

// Socket.IO communication
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on('control_gate', (action) => {
    console.log(`🚪 Gate control: ${action}`);
    mqttClient.publish(TOPIC_SUB_GATE, action);
  });

  socket.on('simulate_vehicle', (status) => {
    console.log(`🚗 Vehicle simulation: ${status}`);
    mqttClient.publish(TOPIC_SUB_VEHICLE, status);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Serve frontend
app.use(express.static(path.join(__dirname, 'client', 'build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
