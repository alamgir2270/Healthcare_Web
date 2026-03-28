import React, { useState, useEffect } from "react";
import { getAuthHeaders } from "../../../utils/auth";

/**
 * ================================
 * ADMIN LAB RESULTS UPLOAD COMPONENT
 * ================================
 * Professional lab result report upload system
 * - Manage pending lab tests
 * - Upload PDF/Image reports
 * - Track completion status
 * - Validate file types and sizes
 */

const AdminLabResultsSection = () => {
  // ===== STATE MANAGEMENT =====
  const [pendingTests, setPendingTests] = useState([]);
  const [completedTests, setCompletedTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErrors, setUploadErrors] = useState({});

  // Upload form
  const [uploadForm, setUploadForm] = useState({
    result_value: "",
    unit: "",
    reference_range: "",
    result_status: "normal",
    notes: "",
  });
  const [uploadFile, setUploadFile] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const headers = getAuthHeaders();

  // ===== LOAD TESTS =====
  useEffect(() => {
    loadLabTests();
  }, []);

  const loadLabTests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/lab-results`, { headers });

      if (response.ok) {
        const data = await response.json();
        const tests = data.data || [];
        setPendingTests(tests.filter((t) => t.status === "pending"));
        setCompletedTests(tests.filter((t) => t.status === "completed"));
      } else {
        setErrorMsg("Failed to load lab tests");
      }
    } catch (err) {
      console.error("Error loading tests:", err);
      setErrorMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ===== OPEN UPLOAD MODAL =====
  const openUploadModal = (test) => {
    setSelectedTest(test);
    setUploadForm({
      result_value: "",
      unit: "",
      reference_range: "",
      result_status: "normal",
      notes: "",
    });
    setUploadFile(null);
    setUploadErrors({});
    setSuccessMsg("");
    setErrorMsg("");
    setShowUploadModal(true);
  };

  // ===== VALIDATE UPLOAD =====
  const validateUpload = () => {
    const errors = {};

    if (!uploadForm.result_value.trim()) {
      errors.result_value = "Result value is required";
    }

    if (!uploadForm.unit.trim()) {
      errors.unit = "Unit is required";
    }

    if (!uploadFile) {
      errors.file = "Please select a file (PDF or Image)";
    } else {
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (!allowedTypes.includes(uploadFile.type)) {
        errors.file = "Only PDF, JPG, and PNG files are allowed";
      }

      if (uploadFile.size > 10 * 1024 * 1024) {
        errors.file = "File size must be less than 10MB";
      }
    }

    setUploadErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ===== UPLOAD RESULT =====
  const handleUploadResult = async (e) => {
    e.preventDefault();

    if (!validateUpload()) {
      setErrorMsg("Please fix all errors before uploading");
      return;
    }

    try {
      setUploading(true);
      setErrorMsg("");
      setSuccessMsg("");

      const formData = new FormData();
      formData.append("result_value", uploadForm.result_value);
      formData.append("unit", uploadForm.unit);
      formData.append("reference_range", uploadForm.reference_range || "");
      formData.append("result_status", uploadForm.result_status);
      formData.append("notes", uploadForm.notes || "");
      formData.append("file", uploadFile);

      const response = await fetch(
        `${API_BASE}/api/lab-results/${selectedTest.lab_result_id}/upload`,
        {
          method: "PUT",
          headers: { Authorization: headers.Authorization },
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg(
          `✅ Lab result uploaded successfully!\nTest: ${selectedTest.test_name}\nStatus: Completed`
        );

        // Refresh tests
        setTimeout(() => {
          setShowUploadModal(false);
          loadLabTests();
        }, 1500);
      } else {
        setErrorMsg(`❌ ${data.message || "Upload failed"}`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMsg(`❌ Error: ${err.message}`);
    } finally {
      setUploading(false);
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
    tabButtons: {
      display: "flex",
      gap: "10px",
      marginBottom: "20px",
      borderBottom: "2px solid #ddd",
    },
    tabBtn: {
      backgroundColor: "transparent",
      border: "2px solid transparent",
      padding: "10px 20px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      color: "#666",
      borderBottomColor: "transparent",
      transition: "0.3s",
    },
    tabBtnActive: {
      borderBottomColor: "#007bff",
      color: "#007bff",
    },
    heading: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#333",
      marginBottom: "15px",
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
    formGroup: {
      marginBottom: "15px",
    },
    label: {
      display: "block",
      fontSize: "14px",
      fontWeight: "500",
      color: "#333",
      marginBottom: "6px",
    },
    required: {
      color: "#dc3545",
    },
    input: {
      width: "100%",
      padding: "10px 12px",
      border: "1px solid #ddd",
      borderRadius: "6px",
      fontSize: "14px",
      boxSizing: "border-box",
    },
    inputError: {
      borderColor: "#dc3545",
      backgroundColor: "#fff5f5",
    },
    errorText: {
      color: "#dc3545",
      fontSize: "12px",
      marginTop: "4px",
    },
    fileInput: {
      padding: "10px",
      border: "2px dashed #ddd",
      borderRadius: "6px",
      backgroundColor: "#f9f9f9",
      cursor: "pointer",
      transition: "0.3s",
    },
    fileInputHover: {
      borderColor: "#007bff",
      backgroundColor: "#f0f7ff",
    },
    fileSelected: {
      color: "#155724",
      fontSize: "12px",
      marginTop: "8px",
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
    modalButtons: {
      display: "flex",
      gap: "10px",
      marginTop: "20px",
    },
    primaryBtn: {
      backgroundColor: "#007bff",
      color: "white",
      padding: "10px 20px",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      flex: 1,
    },
    secondaryBtn: {
      backgroundColor: "#6c757d",
      color: "white",
      padding: "10px 20px",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      flex: 1,
    },
  };

  // ===== RENDER =====
  return (
    <div style={styles.container}>
      {/* TABS */}
      <div style={styles.tabButtons}>
        <button
          style={
            activeTab === "pending"
              ? { ...styles.tabBtn, ...styles.tabBtnActive }
              : styles.tabBtn
          }
          onClick={() => setActiveTab("pending")}
        >
          ⏳ Pending Tests ({pendingTests.length})
        </button>
        <button
          style={
            activeTab === "completed"
              ? { ...styles.tabBtn, ...styles.tabBtnActive }
              : styles.tabBtn
          }
          onClick={() => setActiveTab("completed")}
        >
          ✅ Completed Tests ({completedTests.length})
        </button>
      </div>

      {/* LOADING */}
      {loading ? (
        <div style={styles.loadingText}>⏳ Loading lab tests...</div>
      ) : activeTab === "pending" ? (
        <>
          <h3 style={styles.heading}>⏳ Pending Lab Tests - Upload Results</h3>

          {pendingTests.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No pending lab tests</p>
              <p style={{ fontSize: "12px" }}>All tests are completed</p>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Patient</th>
                  <th style={styles.th}>Test Name</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Ordered</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingTests.map((test) => (
                  <tr key={test.lab_result_id}>
                    <td style={styles.td}>
                      {test.Patient?.User?.full_name || "Unknown"}
                    </td>
                    <td style={styles.td}>{test.test_name}</td>
                    <td style={styles.td}>{test.test_category}</td>
                    <td style={styles.td}>
                      {new Date(test.created_at).toLocaleDateString()}
                    </td>
                    <td style={styles.td}>
                      <button
                        style={styles.button}
                        onClick={() => openUploadModal(test)}
                      >
                        📤 Upload
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      ) : (
        <>
          <h3 style={styles.heading}>✅ Completed Lab Tests</h3>

          {completedTests.length === 0 ? (
            <div style={styles.emptyState}>
              <p>No completed lab tests yet</p>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Patient</th>
                  <th style={styles.th}>Test Name</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Completed</th>
                  <th style={styles.th}>Result Status</th>
                </tr>
              </thead>
              <tbody>
                {completedTests.map((test) => (
                  <tr key={test.lab_result_id}>
                    <td style={styles.td}>
                      {test.Patient?.User?.full_name || "Unknown"}
                    </td>
                    <td style={styles.td}>{test.test_name}</td>
                    <td style={styles.td}>{test.test_category}</td>
                    <td style={styles.td}>
                      {new Date(test.updated_at).toLocaleDateString()}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          ...(test.result_status === "normal"
                            ? styles.statusCompleted
                            : {
                                backgroundColor: "#fff3cd",
                                color: "#856404",
                              }),
                        }}
                      >
                        {test.result_status || "Completed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {/* UPLOAD MODAL */}
      {showUploadModal && selectedTest && (
        <div style={styles.modal} onClick={() => !uploading && setShowUploadModal(false)}>
          <div
            style={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "15px" }}>
              📤 Upload Lab Result
            </h3>

            {successMsg && <div style={styles.successMsg}>{successMsg}</div>}
            {errorMsg && <div style={styles.errorMsg}>{errorMsg}</div>}

            <div style={{ marginBottom: "15px", padding: "12px", backgroundColor: "#f0f7ff", borderRadius: "6px", fontSize: "13px" }}>
              <strong>Test:</strong> {selectedTest.test_name}<br/>
              <strong>Patient:</strong> {selectedTest.Patient?.User?.full_name}
            </div>

            <form onSubmit={handleUploadResult}>
              {/* Result Value */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Result Value <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  style={{
                    ...styles.input,
                    ...(uploadErrors.result_value && styles.inputError),
                  }}
                  value={uploadForm.result_value}
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      result_value: e.target.value,
                    })
                  }
                  placeholder="e.g., 150"
                />
                {uploadErrors.result_value && (
                  <div style={styles.errorText}>{uploadErrors.result_value}</div>
                )}
              </div>

              {/* Unit */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Unit <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  style={{
                    ...styles.input,
                    ...(uploadErrors.unit && styles.inputError),
                  }}
                  value={uploadForm.unit}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, unit: e.target.value })
                  }
                  placeholder="e.g., mg/dL"
                />
                {uploadErrors.unit && (
                  <div style={styles.errorText}>{uploadErrors.unit}</div>
                )}
              </div>

              {/* Reference Range */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Reference Range</label>
                <input
                  type="text"
                  style={styles.input}
                  value={uploadForm.reference_range}
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      reference_range: e.target.value,
                    })
                  }
                  placeholder="e.g., 100-125"
                />
              </div>

              {/* Result Status */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Result Status</label>
                <select
                  style={styles.input}
                  value={uploadForm.result_status}
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      result_status: e.target.value,
                    })
                  }
                >
                  <option value="normal">Normal</option>
                  <option value="abnormal">Abnormal</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {/* Notes */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Notes</label>
                <textarea
                  style={{ ...styles.input, minHeight: "80px", fontFamily: "inherit", resize: "vertical" }}
                  value={uploadForm.notes}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, notes: e.target.value })
                  }
                  placeholder="Additional notes or observations"
                />
              </div>

              {/* File Upload */}
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Report File (PDF/Image) <span style={styles.required}>*</span>
                </label>
                <div style={styles.fileInput}>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    style={{ width: "100%", cursor: "pointer" }}
                  />
                </div>
                {uploadFile && (
                  <div style={styles.fileSelected}>
                    ✅ {uploadFile.name} ({(uploadFile.size / 1024).toFixed(2)} KB)
                  </div>
                )}
                {uploadErrors.file && (
                  <div style={styles.errorText}>{uploadErrors.file}</div>
                )}
              </div>

              {/* Buttons */}
              <div style={styles.modalButtons}>
                <button
                  type="submit"
                  style={{
                    ...styles.primaryBtn,
                    ...(uploading && styles.buttonDisabled),
                  }}
                  disabled={uploading}
                >
                  {uploading ? "⏳ Uploading..." : "✅ Upload Result"}
                </button>
                <button
                  type="button"
                  style={styles.secondaryBtn}
                  onClick={() => !uploading && setShowUploadModal(false)}
                  disabled={uploading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLabResultsSection;
