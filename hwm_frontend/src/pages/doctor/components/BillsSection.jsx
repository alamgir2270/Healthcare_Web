import React, { useState } from "react";

const BillsSection = ({ bills, styles, onPaymentProcess }) => {
  const [expandedBill, setExpandedBill] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(null);

  const handleProcessPayment = async (billId) => {
    try {
      setProcessingPayment(billId);
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const token = localStorage.getItem("token");

      const resp = await fetch(`${API_BASE}/api/bills/${billId}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "paid" }),
      });

      if (resp.ok) {
        onPaymentProcess?.(billId);
        alert("✅ Payment processed successfully!");
      }
    } catch (err) {
      console.error("Error processing payment:", err);
      alert("Failed to process payment");
    } finally {
      setProcessingPayment(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "#27ae60";
      case "pending":
        return "#f39c12";
      case "overdue":
        return "#e74c3c";
      default:
        return "#95a5a6";
    }
  };

  const getStatusBgColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "#d5f4e6";
      case "pending":
        return "#fdeaa8";
      case "overdue":
        return "#fadbd8";
      default:
        return "#ecf0f1";
    }
  };

  const totalBills = bills?.length || 0;
  const totalAmount = bills?.reduce((sum, bill) => sum + (bill.amount || 0), 0) || 0;
  const paidAmount = bills?.filter((b) => b.status === "paid").reduce((sum, bill) => sum + (bill.amount || 0), 0) || 0;
  const pendingAmount = bills?.filter((b) => b.status === "pending").reduce((sum, bill) => sum + (bill.amount || 0), 0) || 0;

  return (
    <div style={styles.section}>
      <h2>💳 Billing & Payments</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginTop: "1.5rem", marginBottom: "2rem" }}>
        <div
          style={{
            backgroundColor: "#ecf0f1",
            padding: "1.5rem",
            borderRadius: "8px",
            borderLeft: "4px solid #3498db",
          }}
        >
          <div style={{ fontSize: "0.85rem", color: "#7f8c8d" }}>Total Bills</div>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#2c3e50" }}>{totalBills}</div>
        </div>

        <div
          style={{
            backgroundColor: "#ecf0f1",
            padding: "1.5rem",
            borderRadius: "8px",
            borderLeft: "4px solid #e74c3c",
          }}
        >
          <div style={{ fontSize: "0.85rem", color: "#7f8c8d" }}>Total Amount</div>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#2c3e50" }}>৳{totalAmount.toFixed(2)}</div>
        </div>

        <div
          style={{
            backgroundColor: "#ecf0f1",
            padding: "1.5rem",
            borderRadius: "8px",
            borderLeft: "4px solid #27ae60",
          }}
        >
          <div style={{ fontSize: "0.85rem", color: "#7f8c8d" }}>Paid</div>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#27ae60" }}>৳{paidAmount.toFixed(2)}</div>
        </div>

        <div
          style={{
            backgroundColor: "#ecf0f1",
            padding: "1.5rem",
            borderRadius: "8px",
            borderLeft: "4px solid #f39c12",
          }}
        >
          <div style={{ fontSize: "0.85rem", color: "#7f8c8d" }}>Pending</div>
          <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#f39c12" }}>৳{pendingAmount.toFixed(2)}</div>
        </div>
      </div>

      <h3 style={{ marginTop: "2rem", marginBottom: "1rem" }}>Recent Bills</h3>

      {bills && bills.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {bills.slice(0, 10).map((bill) => (
            <div
              key={bill.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <div
                onClick={() => setExpandedBill(expandedBill === bill.id ? null : bill.id)}
                style={{
                  backgroundColor: "#f8f9fa",
                  padding: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "background-color 0.3s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#ecf0f1")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f8f9fa")}
              >
                <div>
                  <div style={{ fontWeight: "bold", color: "#2c3e50" }}>
                    {bill.patient_name || "Unknown Patient"}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#95a5a6" }}>
                    Bill ID: {bill.id || "N/A"}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: "bold", fontSize: "1.25rem", color: "#2c3e50" }}>
                      ৳{bill.amount?.toFixed(2) || "0.00"}
                    </div>
                    <div
                      style={{
                        display: "inline-block",
                        backgroundColor: getStatusBgColor(bill.status),
                        color: getStatusColor(bill.status),
                        padding: "0.25rem 0.75rem",
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        marginTop: "0.25rem",
                      }}
                    >
                      {bill.status || "pending"}
                    </div>
                  </div>

                  <div style={{ fontSize: "1.5rem" }}>
                    {expandedBill === bill.id ? "▼" : "▶"}
                  </div>
                </div>
              </div>

              {expandedBill === bill.id && (
                <div
                  style={{
                    backgroundColor: "#ffffff",
                    padding: "1.5rem",
                    borderTop: "1px solid #ddd",
                  }}
                >
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                    <div>
                      <div style={{ fontSize: "0.85rem", color: "#95a5a6" }}>Date</div>
                      <div style={{ fontWeight: "bold" }}>{bill.created_at?.split("T")[0] || "N/A"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.85rem", color: "#95a5a6" }}>Due Date</div>
                      <div style={{ fontWeight: "bold" }}>{bill.due_date || "N/A"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.85rem", color: "#95a5a6" }}>Service</div>
                      <div style={{ fontWeight: "bold" }}>{bill.service_type || "Medical Consultation"}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.85rem", color: "#95a5a6" }}>Doctor</div>
                      <div style={{ fontWeight: "bold" }}>{bill.doctor_name || "General"}</div>
                    </div>
                  </div>

                  {bill.description && (
                    <div>
                      <div style={{ fontSize: "0.85rem", color: "#95a5a6" }}>Description</div>
                      <div style={{ fontWeight: "normal" }}>{bill.description}</div>
                    </div>
                  )}

                  {bill.status !== "paid" && (
                    <button
                      onClick={() => handleProcessPayment(bill.id)}
                      disabled={processingPayment === bill.id}
                      style={{
                        marginTop: "1rem",
                        padding: "0.75rem 1.5rem",
                        backgroundColor: processingPayment === bill.id ? "#95a5a6" : "#27ae60",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: processingPayment === bill.id ? "not-allowed" : "pointer",
                        opacity: processingPayment === bill.id ? 0.6 : 1,
                      }}
                    >
                      {processingPayment === bill.id ? "Processing..." : "Mark as Paid"}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            padding: "2rem",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            color: "#95a5a6",
          }}
        >
          No bills available
        </div>
      )}
    </div>
  );
};

export default BillsSection;
