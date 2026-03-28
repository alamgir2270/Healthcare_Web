import React from "react";

const OverviewSection = ({ doctorStats, styles, onWritePrescription, onTabChange }) => {
  return (
    <>
      {/* Statistics Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1rem",
        marginTop: "1.5rem"
      }}>
        <div style={{
          backgroundColor: "#e3f2fd",
          padding: "1.5rem",
          borderRadius: "8px",
          textAlign: "center",
          border: "2px solid #2196F3"
        }}>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#2196F3" }}>
            {doctorStats?.totalPatients || 0}
          </div>
          <div style={{ fontSize: "0.9rem", color: "#555", marginTop: "0.5rem" }}>
            Total Patients
          </div>
        </div>

        <div style={{
          backgroundColor: "#fff3e0",
          padding: "1.5rem",
          borderRadius: "8px",
          textAlign: "center",
          border: "2px solid #ff9800"
        }}>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#ff9800" }}>
            {doctorStats?.todayAppointments || 0}
          </div>
          <div style={{ fontSize: "0.9rem", color: "#555", marginTop: "0.5rem" }}>
            Today's Appointments
          </div>
        </div>

        <div style={{
          backgroundColor: "#f3e5f5",
          padding: "1.5rem",
          borderRadius: "8px",
          textAlign: "center",
          border: "2px solid #9c27b0"
        }}>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#9c27b0" }}>
            {doctorStats?.pendingAppointments || 0}
          </div>
          <div style={{ fontSize: "0.9rem", color: "#555", marginTop: "0.5rem" }}>
            Pending Appointments
          </div>
        </div>

        <div style={{
          backgroundColor: "#e8f5e9",
          padding: "1.5rem",
          borderRadius: "8px",
          textAlign: "center",
          border: "2px solid #4caf50"
        }}>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#4caf50" }}>
            {doctorStats?.activePrescriptions || 0}
          </div>
          <div style={{ fontSize: "0.9rem", color: "#555", marginTop: "0.5rem" }}>
            Active Prescriptions
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        marginTop: "2rem",
        backgroundColor: "#f5f5f5",
        padding: "1.5rem",
        borderRadius: "8px"
      }}>
        <h3 style={{ marginTop: 0 }}>⚡ Quick Actions</h3>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button
            onClick={onWritePrescription}
            style={{
              padding: "0.7rem 1.5rem",
              backgroundColor: "#27ae60",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.95rem",
              fontWeight: "bold"
            }}
          >
            📝 Write Prescription
          </button>
          <button
            onClick={() => onTabChange("appointments")}
            style={{
              padding: "0.7rem 1.5rem",
              backgroundColor: "#2196F3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.95rem"
            }}
          >
            📅 View Appointments
          </button>
          <button
            onClick={() => onTabChange("patients")}
            style={{
              padding: "0.7rem 1.5rem",
              backgroundColor: "#9c27b0",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.95rem"
            }}
          >
            🧑‍⚕️ View Patients
          </button>
          <button
            onClick={() => onTabChange("prescriptions")}
            style={{
              padding: "0.7rem 1.5rem",
              backgroundColor: "#ff9800",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.95rem"
            }}
          >
            💊 View Prescriptions
          </button>
        </div>
      </div>
    </>
  );
};

export default OverviewSection;
