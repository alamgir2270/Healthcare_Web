import React from "react";

const PrescriptionsSection = ({ prescriptions, styles }) => {
  return (
    <div style={styles.section}>
      <h2>💊 Recent Prescriptions</h2>
      {prescriptions && prescriptions.length > 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
          {prescriptions.slice(0, 6).map((presc) => (
            <div key={presc.prescription_id} style={styles.prescriptionCard}>
              <h4 style={{ marginTop: 0, color: "#333" }}>👤 {presc.Patient?.User?.full_name || "N/A"}</h4>
              <p style={{ margin: "0.5rem 0", fontSize: "0.9rem", color: "#666" }}>
                📅 {new Date(presc.created_at).toLocaleDateString()}
              </p>
              {presc.medications && Array.isArray(presc.medications) && presc.medications.length > 0 && (
                <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#555" }}>
                  <strong>Medications:</strong>
                  {presc.medications.map((med, idx) => (
                    <div key={idx} style={{ marginLeft: "0.5rem" }}>
                      • {med.medication_name} - {med.dosage} ({med.frequency})
                    </div>
                  ))}
                </div>
              )}
              {presc.advice && (
                <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#555" }}>
                  <strong>Advice:</strong> {presc.advice}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: "#999", textAlign: "center", padding: "2rem" }}>No prescriptions yet</p>
      )}
    </div>
  );
};

const styles = {
  section: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "8px",
    marginBottom: "2rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  prescriptionCard: {
    backgroundColor: "#f9f9f9",
    padding: "1rem",
    borderRadius: "8px",
    borderLeft: "4px solid #9b59b6",
  },
};

export default PrescriptionsSection;
