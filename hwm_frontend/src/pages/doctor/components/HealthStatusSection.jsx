import React, { useState } from "react";

const HealthMetricCard = ({ label, value, unit, icon, normalRange, styles }) => {
  const isNormal = normalRange
    ? value >= normalRange.min && value <= normalRange.max
    : true;

  return (
    <div
      style={{
        backgroundColor: isNormal ? "#f0f8ff" : "#fff5f5",
        border: `2px solid ${isNormal ? "#3498db" : "#e74c3c"}`,
        padding: "1.5rem",
        borderRadius: "8px",
        textAlign: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{icon}</div>
      <div style={{ fontSize: "0.85rem", color: "#7f8c8d", marginBottom: "0.5rem" }}>{label}</div>
      <div style={{ fontSize: "1.75rem", fontWeight: "bold", color: isNormal ? "#2c3e50" : "#e74c3c" }}>
        {value} <span style={{ fontSize: "0.9rem", color: "#95a5a6" }}>{unit}</span>
      </div>
      {normalRange && (
        <div style={{ fontSize: "0.75rem", color: "#95a5a6", marginTop: "0.5rem" }}>
          Normal: {normalRange.min}-{normalRange.max} {unit}
        </div>
      )}
    </div>
  );
};

const HealthStatusSection = ({ healthStatus, styles, onHealthUpdate }) => {
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [healthForm, setHealthForm] = useState({
    blood_pressure: "",
    heart_rate: "",
    temperature: "",
    weight: "",
    height: "",
  });

  const handleAddRecord = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");

      const resp = await fetch(`${API_BASE}/api/health-records`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(healthForm),
      });

      if (resp.ok) {
        setHealthForm({
          blood_pressure: "",
          heart_rate: "",
          temperature: "",
          weight: "",
          height: "",
        });
        setShowAddRecord(false);
        onHealthUpdate?.();
        alert("✅ Health record added successfully!");
      }
    } catch (err) {
      console.error("Error adding health record:", err);
      alert("Failed to add health record");
    }
  };

  const calculateBMI = (weight, height) => {
    if (weight && height) {
      const heightInMeters = height / 100;
      return (weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return null;
  };

  const bmi = calculateBMI(healthStatus?.weight, healthStatus?.height);

  return (
    <div style={styles.section}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>❤️ Health Status</h2>
        <button
          onClick={() => setShowAddRecord(!showAddRecord)}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#e74c3c",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {showAddRecord ? "Cancel" : "Add Health Record"}
        </button>
      </div>

      {showAddRecord && (
        <div
          style={{
            marginTop: "1.5rem",
            backgroundColor: "#ecf0f1",
            padding: "1.5rem",
            borderRadius: "8px",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "0.5rem" }}>
                Blood Pressure
              </label>
              <input
                type="text"
                placeholder="e.g., 120/80"
                value={healthForm.blood_pressure}
                onChange={(e) => setHealthForm({ ...healthForm, blood_pressure: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #bdc3c7",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "0.5rem" }}>
                Heart Rate (bpm)
              </label>
              <input
                type="number"
                placeholder="e.g., 72"
                value={healthForm.heart_rate}
                onChange={(e) => setHealthForm({ ...healthForm, heart_rate: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #bdc3c7",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "0.5rem" }}>
                Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g., 36.5"
                value={healthForm.temperature}
                onChange={(e) => setHealthForm({ ...healthForm, temperature: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #bdc3c7",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "0.5rem" }}>
                Temperature (°F)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g., 98.6"
                disabled
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #bdc3c7",
                  borderRadius: "4px",
                  backgroundColor: "#f5f5f5",
                }}
              />
            </div>
            <div>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "0.5rem" }}>
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g., 70"
                value={healthForm.weight}
                onChange={(e) => setHealthForm({ ...healthForm, weight: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #bdc3c7",
                  borderRadius: "4px",
                }}
              />
            </div>
            <div>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "0.5rem" }}>
                Height (cm)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g., 175"
                value={healthForm.height}
                onChange={(e) => setHealthForm({ ...healthForm, height: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "1px solid #bdc3c7",
                  borderRadius: "4px",
                }}
              />
            </div>
          </div>
          <button
            onClick={handleAddRecord}
            style={{
              marginTop: "1rem",
              padding: "0.75rem 2rem",
              backgroundColor: "#27ae60",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Save Record
          </button>
        </div>
      )}

      <div style={{ marginTop: "2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        <HealthMetricCard
          label="Blood Pressure"
          value={healthStatus?.blood_pressure || "120/80"}
          unit="mmHg"
          icon="🩸"
          normalRange={{ min: 120, max: 129 }}
          styles={styles}
        />
        <HealthMetricCard
          label="Heart Rate"
          value={healthStatus?.heart_rate || 72}
          unit="bpm"
          icon="💓"
          normalRange={{ min: 60, max: 100 }}
          styles={styles}
        />
        <HealthMetricCard
          label="Temperature"
          value={healthStatus?.temperature || 36.5}
          unit="°C"
          icon="🌡️"
          normalRange={{ min: 36.1, max: 37.2 }}
          styles={styles}
        />
        <HealthMetricCard
          label="Weight"
          value={healthStatus?.weight || 70}
          unit="kg"
          icon="⚖️"
          styles={styles}
        />
        <HealthMetricCard
          label="Height"
          value={healthStatus?.height || 175}
          unit="cm"
          icon="📏"
          styles={styles}
        />
        <HealthMetricCard
          label="BMI"
          value={bmi || "N/A"}
          unit=""
          icon="📊"
          normalRange={{ min: 18.5, max: 24.9 }}
          styles={styles}
        />
      </div>

      <div style={{ marginTop: "2rem", backgroundColor: "#e8f8f5", padding: "1.5rem", borderRadius: "8px", borderLeft: "4px solid #16a085" }}>
        <h3>📝 Latest Records</h3>
        <div style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#2c3e50" }}>
          <p>
            <strong>Last Updated:</strong> {healthStatus?.lastUpdated || "Never"}
          </p>
          <p>
            <strong>Total Records:</strong> {healthStatus?.totalRecords || 0}
          </p>
        </div>
      </div>
    </div>
  );
};

export default HealthStatusSection;
