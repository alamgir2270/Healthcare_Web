import React, { useState, useEffect } from "react";
import { getAuthHeaders } from "../../utils/auth";

/**
 * ================================
 * PATIENT LAB RESULTS VIEW COMPONENT
 * ================================
 * Professional lab result viewing and download system for patients
 * - View own lab test results
 * - Download reports
 * - Track test status
 */

const PatientLabResults = () => {
  // ===== STATE MANAGEMENT =====
  const [labResults, setLabResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const headers = getAuthHeaders();

  // ===== LOAD MY LAB RESULTS =====
  useEffect(() => {
    loadMyLabResults();
  }, []);

  const loadMyLabResults = async () => {
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
  const handleDownloadReport = async (resultId, resultName) => {
    try {
      setDownloading(true);

      const response = await fetch(
        `${API_BASE}/api/lab-results/${resultId}/download`,
        { headers }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${resultName}-${new Date().toISOString().split("T")[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        setSuccessMsg("✅ Report downloaded successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg("Failed to download report. Please try again.");
      }
    } catch (err) {
      console.error("Download error:", err);
      setErrorMsg(`Error: ${err.message}`);
    } finally {
      setDownloading(false);
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
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },
    filterGroup: {
      marginBottom: "15px",
      display: "flex",
      gap: "10px",
      flexWrap: "wrap",
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
      padding: "8px 16px",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "12px",
      fontWeight: "500",
      transition: "0.3s",
      marginRight: "5px",
    },
    buttonPrimary: {
      backgroundColor: "#007bff",
      color: "white",
    },
    buttonSecondary: {
      backgroundColor: "#6c757d",
      color: "white",
    },
    buttonDisabled: {
      opacity: 0.6,
      cursor: "not-allowed",
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
      textAlign: "right",
    },
    detailHighlight: {
      backgroundColor: "#f0f7ff",
      padding: "12px",
      borderRadius: "6px",
      marginBottom: "12px",
      fontSize: "13px",
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
    infoBox: {
      backgroundColor: "#e7f3ff",
      border: "1px solid #b3d9ff",
      color: "#004085",
      padding: "12px",
      borderRadius: "6px",
      fontSize: "12px",
      marginBottom: "15px",
    },
  };

  // ===== RENDER =====
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>🔬 My Lab Results</h2>

      {successMsg && <div style={styles.successMsg}>{successMsg}</div>}
      {errorMsg && <div style={styles.errorMsg}>{errorMsg}</div>}

      {/* INFO BOX */}
      <div style={styles.infoBox}>
        💡 Your lab test results appear here once the doctor orders a test and
        uploads the results.
      </div>

      {/* FILTER BUTTONS */}
      <div style={styles.filterGroup}>
        <button
          style={
            filterStatus === "all"
              ? { ...styles.filterBtn, ...styles.filterBtnActive }
              : styles.filterBtn
          }
          onClick={() => setFilterStatus("all")}
        >
          All Tests ({labResults.length})
        </button>
        <button
          style={
            filterStatus === "pending"
              ? { ...styles.filterBtn, ...styles.filterBtnActive }
              : styles.filterBtn
          }
          onClick={() => setFilterStatus("pending")}
        >
          ⏳ Pending ({labResults.filter((r) => r.status === "pending").length})
        </button>
        <button
          style={
            filterStatus === "completed"
              ? { ...styles.filterBtn, ...styles.filterBtnActive }
              : styles.filterBtn
          }
          onClick={() => setFilterStatus("completed")}
        >
          ✅ Completed ({labResults.filter((r) => r.status === "completed").length})
        </button>
      </div>

      {/* LOADING */}
      {loading ? (
        <div style={styles.loadingText}>⏳ Loading your lab results...</div>
      ) : filteredResults.length === 0 ? (
        <div style={styles.emptyState}>
          <p>📋 No lab results yet</p>
          {filterStatus !== "all" && (
            <p style={{ fontSize: "12px" }}>Try changing the filter</p>
          )}
          {filterStatus === "all" && (
            <p style={{ fontSize: "12px" }}>
              Contact your doctor to order a lab test
            </p>
          )}
        </div>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
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
                    style={{ ...styles.button, ...styles.buttonPrimary }}
                    onClick={() => openDetailModal(result)}
                  >
                    👁️ View
                  </button>
                  {result.status === "completed" && (
                    <button
                      style={{ ...styles.button, ...styles.buttonSecondary }}
                      onClick={() =>
                        handleDownloadReport(
                          result.lab_result_id,
                          result.test_name
                        )
                      }
                      disabled={downloading}
                    >
                      {downloading ? "⏳" : "📥"} Download
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

            {/* KEY INFO */}
            <div style={styles.detailHighlight}>
              <strong>{selectedResult.test_name}</strong>
              <br />
              <span style={{ color: "#666", fontSize: "12px" }}>
                {selectedResult.test_category}
              </span>
            </div>

            {/* TEST INFO */}
            <div style={styles.detailRow}>
              <div style={styles.detailLabel}>Requested Date</div>
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

            {/* RESULTS (if completed) */}
            {selectedResult.status === "completed" && (
              <>
                <hr style={{ margin: "15px 0", border: "none", borderTop: "1px solid #eee" }} />

                <div style={styles.detailRow}>
                  <div style={styles.detailLabel}>Result Value</div>
                  <div style={styles.detailValue}>
                    <strong>
                      {selectedResult.result_value} {selectedResult.unit}
                    </strong>
                  </div>
                </div>

                {selectedResult.reference_range && (
                  <div style={styles.detailRow}>
                    <div style={styles.detailLabel}>Reference Range</div>
                    <div style={styles.detailValue}>
                      {selectedResult.reference_range}
                    </div>
                  </div>
                )}

                <div style={styles.detailRow}>
                  <div style={styles.detailLabel}>Result Status</div>
                  <div style={styles.detailValue}>
                    {selectedResult.result_status === "normal" && "✅ Normal"}
                    {selectedResult.result_status === "abnormal" && "⚠️ Abnormal"}
                    {selectedResult.result_status === "critical" && "🔴 Critical"}
                  </div>
                </div>

                {selectedResult.notes && (
                  <div style={{ ...styles.detailRow, borderBottom: "none" }}>
                    <div style={styles.detailLabel}>Notes</div>
                    <div style={styles.detailValue}>
                      {selectedResult.notes}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ACTIONS */}
            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              {selectedResult.status === "completed" && (
                <button
                  style={{
                    ...styles.button,
                    ...styles.buttonSecondary,
                    flex: 1,
                  }}
                  onClick={() =>
                    handleDownloadReport(
                      selectedResult.lab_result_id,
                      selectedResult.test_name
                    )
                  }
                  disabled={downloading}
                >
                  {downloading ? "⏳ Downloading..." : "📥 Download Report"}
                </button>
              )}
              <button
                style={{
                  ...styles.button,
                  backgroundColor: "#6c757d",
                  color: "white",
                  flex: 1,
                }}
                onClick={() => setShowDetailModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientLabResults;
