import React, { useState, useEffect } from "react";
import { getAuthHeaders } from "../../../utils/auth";

/**
 * ================================
 * DOCTOR LAB RESULTS VIEW COMPONENT
 * ================================
 * Professional lab result viewing system for doctors
 * - View patient lab test results
 * - Detailed result information
 * - Filter by status
 * - Track test progression
 */

const DoctorLabResultsSection = () => {
  // ===== STATE MANAGEMENT =====
  const [labResults, setLabResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const headers = getAuthHeaders();

  // ===== LOAD LAB RESULTS =====
  useEffect(() => {
    loadLabResults();
  }, []);

  const loadLabResults = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const response = await fetch(`${API_BASE}/api/lab-results`, { headers });

      if (response.ok) {
        const data = await response.json();
        setLabResults(data.data || []);
      } else {
        setErrorMsg("Failed to load lab results");
      }
    } catch (err) {
      console.error("Error loading lab results:", err);
      setErrorMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ===== FILTER RESULTS =====
  const filteredResults = labResults.filter((result) => {
    if (filterStatus === "pending") return result.status === "pending";
    if (filterStatus === "completed") return result.status === "completed";
    return true;
  });

  // ===== OPEN DETAIL MODAL =====
  const openDetailModal = (result) => {
    setSelectedResult(result);
    setShowDetailModal(true);
  };

  // ===== DOWNLOAD REPORT =====
  const downloadReport = async (resultId) => {
    try {
      const response = await fetch(`${API_BASE}/api/lab-results/${resultId}/download`, {
        headers,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `lab-result-${resultId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        setSuccessMsg("✅ Report downloaded successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg("Failed to download report");
      }
    } catch (err) {
      console.error("Download error:", err);
      setErrorMsg(`Error: ${err.message}`);
    }
  };

  // ===== STYLES =====
  const styles = {
    container: {
      backgroundColor: "#f8f9fa",
      borderRadius: "12px",
      padding: "20px",
      marginTop: "20px",
    },
    heading: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#333",
      marginBottom: "15px",
    },
    filterGroup: {
      marginBottom: "15px",
      display: "flex",
      gap: "10px",
    },
    filterBtn: {
      padding: "8px 16px",
      border: "1px solid #ddd",
      borderRadius: "6px",
      backgroundColor: "white",
      cursor: "pointer",
      fontSize: "13px",
      fontWeight: "500",
      transition: "0.3s",
    },
    filterBtnActive: {
      backgroundColor: "#007bff",
      color: "white",
      borderColor: "#007bff",
    },
    loadingText: {
      textAlign: "center",
      padding: "40px",
      color: "#666",
      fontSize: "14px",
    },
    emptyState: {
      backgroundColor: "white",
      borderRadius: "8px",
      padding: "40px",
      textAlign: "center",
      color: "#999",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      backgroundColor: "white",
      borderRadius: "8px",
      overflow: "hidden",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    },
    th: {
      backgroundColor: "#f0f0f0",
      padding: "12px",
      textAlign: "left",
      fontSize: "13px",
      fontWeight: "600",
      color: "#333",
      borderBottom: "2px solid #ddd",
    },
    td: {
      padding: "12px",
      borderBottom: "1px solid #eee",
      fontSize: "13px",
    },
    statusBadge: {
      display: "inline-block",
      padding: "4px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600",
    },
    statusPending: {
      backgroundColor: "#fff3cd",
      color: "#856404",
    },
    statusCompleted: {
      backgroundColor: "#d4edda",
      color: "#155724",
    },
    button: {
      backgroundColor: "#007bff",
      color: "white",
      padding: "8px 16px",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: "500",
      transition: "0.3s",
      marginRight: "5px",
    },
    modal: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    modalContent: {
      backgroundColor: "white",
      borderRadius: "12px",
      padding: "30px",
      maxWidth: "500px",
      width: "90%",
      maxHeight: "90vh",
      overflowY: "auto",
      boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
    },
    detailRow: {
      display: "flex",
      justifyContent: "space-between",
      paddingBottom: "12px",
      borderBottom: "1px solid #eee",
      marginBottom: "12px",
      fontSize: "13px",
    },
    detailLabel: {
      fontWeight: "600",
      color: "#333",
    },
    detailValue: {
      color: "#666",
    },
    successMsg: {
      backgroundColor: "#d4edda",
      color: "#155724",
      padding: "12px",
      borderRadius: "6px",
      marginBottom: "15px",
      fontSize: "13px",
      border: "1px solid #c3e6cb",
    },
    errorMsg: {
      backgroundColor: "#f8d7da",
      color: "#721c24",
      padding: "12px",
      borderRadius: "6px",
      marginBottom: "15px",
      fontSize: "13px",
      border: "1px solid #f5c6cb",
    },
  };

  // ===== RENDER =====
  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>🔬 Lab Results</h3>

      {successMsg && <div style={styles.successMsg}>{successMsg}</div>}
      {errorMsg && <div style={styles.errorMsg}>{errorMsg}</div>}

      {/* FILTER BUTTONS */}
      <div style={styles.filterGroup}>
        <button
          style={{
            ...styles.filterBtn,
            ...(filterStatus === "all" && styles.filterBtnActive),
          }}
          onClick={() => setFilterStatus("all")}
        >
          All Results ({labResults.length})
        </button>
        <button
          style={{
            ...styles.filterBtn,
            ...(filterStatus === "pending" && styles.filterBtnActive),
          }}
          onClick={() => setFilterStatus("pending")}
        >
          ⏳ Pending ({labResults.filter((r) => r.status === "pending").length})
        </button>
        <button
          style={{
            ...styles.filterBtn,
            ...(filterStatus === "completed" && styles.filterBtnActive),
          }}
          onClick={() => setFilterStatus("completed")}
        >
          ✅ Completed ({labResults.filter((r) => r.status === "completed").length})
        </button>
      </div>

      {/* LOADING */}
      {loading ? (
        <div style={styles.loadingText}>⏳ Loading lab results...</div>
      ) : filteredResults.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No lab results found</p>
          {filterStatus !== "all" && (
            <p style={{ fontSize: "12px" }}>Try changing the filter</p>
          )}
        </div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Patient</th>
              <th style={styles.th}>Test Name</th>
              <th style={styles.th}>Category</th>
              <th style={styles.th}>Ordered</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((result) => (
              <tr key={result.lab_result_id}>
                <td style={styles.td}>
                  {result.Patient?.User?.full_name || "Unknown"}
                </td>
                <td style={styles.td}>{result.test_name}</td>
                <td style={styles.td}>{result.test_category}</td>
                <td style={styles.td}>
                  {new Date(result.created_at).toLocaleDateString()}
                </td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      ...(result.status === "pending"
                        ? styles.statusPending
                        : styles.statusCompleted),
                    }}
                  >
                    {result.status === "pending" ? "⏳ Pending" : "✅ Completed"}
                  </span>
                </td>
                <td style={styles.td}>
                  <button
                    style={styles.button}
                    onClick={() => openDetailModal(result)}
                  >
                    👁️ View
                  </button>
                  {result.status === "completed" && (
                    <button
                      style={styles.button}
                      onClick={() => downloadReport(result.lab_result_id)}
                    >
                      📥 Download
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && selectedResult && (
        <div
          style={styles.modal}
          onClick={() => setShowDetailModal(false)}
        >
          <div
            style={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "15px" }}>
              🔬 Lab Result Details
            </h3>

            <div style={styles.detailRow}>
              <div style={styles.detailLabel}>Patient</div>
              <div style={styles.detailValue}>
                {selectedResult.Patient?.User?.full_name}
              </div>
            </div>

            <div style={styles.detailRow}>
              <div style={styles.detailLabel}>Test Name</div>
              <div style={styles.detailValue}>{selectedResult.test_name}</div>
            </div>

            <div style={styles.detailRow}>
              <div style={styles.detailLabel}>Category</div>
              <div style={styles.detailValue}>
                {selectedResult.test_category}
              </div>
            </div>

            <div style={styles.detailRow}>
              <div style={styles.detailLabel}>Requested</div>
              <div style={styles.detailValue}>
                {new Date(selectedResult.created_at).toLocaleDateString()}
              </div>
            </div>

            <div style={styles.detailRow}>
              <div style={styles.detailLabel}>Status</div>
              <div style={styles.detailValue}>
                {selectedResult.status === "pending" ? (
                  <span style={{ ...styles.statusBadge, ...styles.statusPending }}>
                    ⏳ Pending
                  </span>
                ) : (
                  <span style={{ ...styles.statusBadge, ...styles.statusCompleted }}>
                    ✅ Completed
                  </span>
                )}
              </div>
            </div>

            {selectedResult.status === "completed" && (
              <>
                <div style={styles.detailRow}>
                  <div style={styles.detailLabel}>Result Value</div>
                  <div style={styles.detailValue}>
                    {selectedResult.result_value} {selectedResult.unit}
                  </div>
                </div>

                <div style={styles.detailRow}>
                  <div style={styles.detailLabel}>Reference Range</div>
                  <div style={styles.detailValue}>
                    {selectedResult.reference_range || "N/A"}
                  </div>
                </div>

                <div style={styles.detailRow}>
                  <div style={styles.detailLabel}>Result Status</div>
                  <div style={styles.detailValue}>
                    {selectedResult.result_status}
                  </div>
                </div>

                {selectedResult.notes && (
                  <div style={{ ...styles.detailRow, borderBottom: "none" }}>
                    <div style={styles.detailLabel}>Notes</div>
                    <div style={styles.detailValue}>{selectedResult.notes}</div>
                  </div>
                )}
              </>
            )}

            <button
              style={{
                width: "100%",
                backgroundColor: "#6c757d",
                color: "white",
                padding: "10px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                marginTop: "15px",
              }}
              onClick={() => setShowDetailModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorLabResultsSection;
