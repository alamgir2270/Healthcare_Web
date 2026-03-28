import React from "react";

const DoctorInfoCards = ({ doctorStats, styles }) => {
  if (!doctorStats) return null;

  const infoCards = [
    {
      title: "Specialty",
      value: doctorStats.specialty || "Not set",
      icon: "🏥",
      color: "#3498db"
    },
    {
      title: "License Number",
      value: doctorStats.license_no || "Not set",
      icon: "📄",
      color: "#2ecc71"
    },
    {
      title: "Available Days",
      value: doctorStats.available_days || "Not set",
      icon: "📅",
      color: "#f39c12"
    },
    {
      title: "Available Hours",
      value: doctorStats.available_hours || "Not set",
      icon: "⏰",
      color: "#e74c3c"
    }
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "1rem",
      marginBottom: "2rem"
    }}>
      {infoCards.map((card, idx) => (
        <div
          key={idx}
          style={{
            backgroundColor: "#fff",
            border: `2px solid ${card.color}`,
            borderRadius: "8px",
            padding: "1.5rem",
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            transition: "transform 0.2s, box-shadow 0.2s"
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
            {card.icon}
          </div>
          <div style={{
            fontSize: "0.85rem",
            color: "#888",
            marginBottom: "0.5rem",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}>
            {card.title}
          </div>
          <div style={{
            fontSize: "1.1rem",
            fontWeight: "bold",
            color: card.color,
            wordBreak: "break-word"
          }}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DoctorInfoCards;
