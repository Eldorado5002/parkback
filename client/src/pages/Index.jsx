// src/pages/Index.jsx
import React, { useEffect, useState } from "react";
import "./style.css";
import { Link } from "react-router-dom";
import socketService from "../services/socketService";

export default function Index() {
  const [availableSlots, setAvailableSlots] = useState(0);
  const [totalSlots] = useState(6);
  const [gateStatus, setGateStatus] = useState("CLOSED");
  const [freeSlotsList, setFreeSlotsList] = useState([]);
  const [isSystemOnline, setIsSystemOnline] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(true);

  useEffect(() => {
    console.log("Index page loaded");
    
    // Subscribe to real-time updates from the ESP32
    const unsubscribeSlot = socketService.subscribeToSlotUpdates((data) => {
      setIsSystemOnline(true); // Mark system as online when any data is received
      console.log("Slot update received:", data);
      
      // Handle slot status updates
      if (data === "FULL") {
        setAvailableSlots(0);
        setFreeSlotsList([]);
      } else {
        // Parse comma-separated list of available slots
        const freeSlots = data.split(",").map(Number);
        setFreeSlotsList(freeSlots);
        setAvailableSlots(freeSlots.length);
      }
    });
    
    const unsubscribeGate = socketService.subscribeToGateUpdates((data) => {
      setIsSystemOnline(true); // Mark system as online when any data is received
      console.log("Gate update received:", data);
      setGateStatus(data);
    });
    
    const unsubscribeDevice = socketService.subscribeToDeviceStatus((data) => {
      setIsSystemOnline(true); // Mark system as online when any data is received
      console.log("Device status update:", data);
    });
    
    // Cleanup subscriptions on component unmount
    return () => {
      unsubscribeSlot();
      unsubscribeGate();
      unsubscribeDevice();
    };
  }, [totalSlots]);

  // Function to determine slot CSS class based on occupancy
  const getSlotClass = (slotNumber) => {
    return freeSlotsList.includes(slotNumber) ? "slot available" : "slot occupied";
  };

  return (
    <div className="container">
      {/* Welcome Popup */}
      {showWelcomePopup && (
        <>
          <div className="overlay" onClick={() => setShowWelcomePopup(false)} />
          <div className="welcome-popup">
            <h2>Welcome to the Intelligent Urban Parking System</h2>
            <div className="system-status">
              <div className={`status-indicator ${isSystemOnline ? 'online' : 'offline'}`}>
                <span className={`status-dot ${isSystemOnline ? 'online' : 'offline'}`}></span>
                System {isSystemOnline ? 'Online' : 'Offline'}
              </div>
            </div>
            <button className="close-button" onClick={() => setShowWelcomePopup(false)}>
              Get Started
            </button>
          </div>
        </>
      )}

      <header>
        <h1>Smart Parking System</h1>
        <p className="subtitle">Real-time parking lot monitoring</p>
        <div className="device-status">
          System:{" "}
          {isSystemOnline && (
            <span className="status-online">ONLINE</span>
          )}
        </div>
      </header>

      <main>
        <section className="status-section">
          <div className="status-card">
            <h2>Parking Availability</h2>
            <div className="availability-display">
              <div className="count-display">
                <span id="available-count">{availableSlots}</span>
                <span className="count-label">Available</span>
              </div>
              <div className="count-display">
                <span id="total-count">{totalSlots}</span>
                <span className="count-label">Total</span>
              </div>
            </div>

            <div className="slots-container">
              <h3>Slot Status</h3>
              <div className="parking-grid">
                {Array.from({length: totalSlots}, (_, i) => i + 1).map(slotNum => (
                  <div
                    key={slotNum}
                    className={getSlotClass(slotNum)}
                    id={`slot-${slotNum}`}
                  >
                    {slotNum}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="status-card">
            <h2>Gate Status</h2>
            <div className="gate-status">
              <div 
                className={`gate-indicator ${gateStatus === "OPEN" ? "open" : "closed"}`} 
                id="gate-indicator"
              ></div>
              <span id="gate-status-text">{gateStatus}</span>
            </div>
            <div className="gate-info">
              <p>
                The gate automatically opens when a vehicle is detected and parking space is available.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <p>&copy; 2025 Smart Parking System</p>
        <Link to="/admin" className="admin-link">Admin Panel</Link>
      </footer>
    </div>
  );
}