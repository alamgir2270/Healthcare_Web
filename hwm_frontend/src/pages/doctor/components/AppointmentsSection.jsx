import React from "react";

const AppointmentsSection = ({ appointments, styles, onStatusChange, onCompleteAppointment }) => {
  return (
    <div style={styles.section}>
      <h2>📅 Appointments</h2>
      {appointments && appointments.length > 0 ? (
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr style={{ backgroundColor: "#f0f0f0" }}>
                <th style={{ ...styles.tableCell, fontWeight: "bold" }}>Patient</th>
                <th style={{ ...styles.tableCell, fontWeight: "bold" }}>Date & Time</th>
                <th style={{ ...styles.tableCell, fontWeight: "bold" }}>Reason</th>
                <th style={{ ...styles.tableCell, fontWeight: "bold" }}>Status</th>
                <th style={{ ...styles.tableCell, fontWeight: "bold" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt) => (
                <tr key={apt.appointment_id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={styles.tableCell}>{apt.Patient?.User?.full_name || "N/A"}</td>
                  <td style={styles.tableCell}>
                    {new Date(apt.start_time).toLocaleDateString()} {new Date(apt.start_time).toLocaleTimeString()}
                  </td>
                  <td style={styles.tableCell}>{apt.reason || "N/A"}</td>
                  <td style={styles.tableCell}>
                    <span style={{ ...styles.badge, backgroundColor: getStatusColor(apt.status) }}>
                      {apt.status}
                    </span>
                  </td>
                  <td style={styles.tableCell}>
                    {apt.status === "pending" && (
                      <button
                        onClick={() => onCompleteAppointment(apt.appointment_id)}
                        style={{
                          padding: "0.5rem 1rem",
                          backgroundColor: "#2ecc71",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ color: "#999", textAlign: "center", padding: "2rem" }}>No appointments</p>
      )}
    </div>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case "pending":
      return "#f39c12";
    case "completed":
      return "#2ecc71";
    case "cancelled":
      return "#e74c3c";
    default:
      return "#95a5a6";
  }
};

const styles = {
  section: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "8px",
    marginBottom: "2rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableCell: {
    padding: "1rem",
    textAlign: "left",
  },
  badge: {
    padding: "0.5rem 1rem",
    borderRadius: "20px",
    color: "white",
    fontSize: "0.9rem",
    fontWeight: "bold",
  },
};

export default AppointmentsSection;
