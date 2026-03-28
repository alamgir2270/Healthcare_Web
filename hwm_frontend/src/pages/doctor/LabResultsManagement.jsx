import React, { useState, useEffect, useCallback } from "react";
import { getAuthHeaders } from "../../utils/auth";

/**
 * ================================
 * LAB RESULTS MANAGEMENT COMPONENT
 * ================================
 * Comprehensive UI for doctors to manage laboratory test results
 * Features:
 * - Request new lab tests (with patient selection)
 * - View pending and completed results
 * - Upload test reports (PDF/images)
 * - Filter by status and test name
 * - Pagination and search
 */

const LabResultsManagement = () => {
  // ===== STATE MANAGEMENT =====
  const [labResults, setLabResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Tab & Filter State
  const [activeTab, setActiveTab] = useState("all"); // all, pending, completed
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal States
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

  // Form States
  const [requestForm, setRequestForm] = useState({
    patient_id: "",
    appointment_id: "",
    test_name: "",
    test_description: "",
    test_category: "Blood Test",
  });

  const [uploadForm, setUploadForm] = useState({
    file: null,
    result_value: "",
    unit: "",
    reference_range: "",
    result_status: "pending",
    notes: "",
  });

  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);

  // ===== API BASE URL =====
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const headers = getAuthHeaders();

  // ===== FETCH LAB RESULTS =====
  const fetchLabResults = useCallback(
    async (page = 1, status = null) => {
      try {
        setLoading(true);
        setError("");

        let url = `${API_BASE}/api/lab-results?page=${page}&limit=10`;

        // Apply filters
        if (status && status !== "all") {
          url += `&status=${status}`;
        }
        if (searchQuery) {
          url += `&test_name=${encodeURIComponent(searchQuery)}`;
        }

        const response = await fetch(url, { headers });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch lab results");
        }

        setLabResults(data.data || []);
        setCurrentPage(data.pagination?.page || 1);
        setTotalPages(data.pagination?.totalPages || 1);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [API_BASE, headers, searchQuery]
  );

  // ===== FETCH PATIENTS (for request form) =====
  const fetchPatients = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/patients`, { headers });
      const data = await response.json();
      setPatients(data.data || []);
    } catch (err) {
      console.error("Error fetching patients:", err);
    }
  }, [API_BASE, headers]);

  // ===== FETCH APPOINTMENTS (when patient selected) =====
  const fetchAppointmentsForPatient = useCallback(
    async (patientId) => {
      try {
        const response = await fetch(
          `${API_BASE}/api/appointments?patient_id=${patientId}`,
          { headers }
        );
        const data = await response.json();
        setAppointments(data.data || []);
      } catch (err) {
        console.error("Error fetching appointments:", err);
      }
    },
    [API_BASE, headers]
  );

  // ===== INITIAL LOAD =====
  useEffect(() => {
    fetchLabResults(1, activeTab);
    fetchPatients();
  }, [activeTab, fetchLabResults, fetchPatients]);

  // ===== CREATE LAB TEST REQUEST =====
  const handleCreateTestRequest = async (e) => {
    e.preventDefault();

    if (!requestForm.patient_id || !requestForm.test_name) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/lab-results`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(requestForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create test request");
      }

      // Reset form and refresh list
      setRequestForm({
        patient_id: "",
        appointment_id: "",
        test_name: "",
        test_description: "",
        test_category: "Blood Test",
      });
      setShowRequestModal(false);
      setSuccessMessage("Lab test request created successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchLabResults(1, activeTab);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ===== UPLOAD REPORT =====
  const handleUploadReport = async (e) => {
    e.preventDefault();

    if (!uploadForm.file) {
      setError("Please select a file to upload");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", uploadForm.file);
      formData.append("result_value", uploadForm.result_value);
      formData.append("unit", uploadForm.unit);
      formData.append("reference_range", uploadForm.reference_range);
      formData.append("result_status", uploadForm.result_status);
      formData.append("notes", uploadForm.notes);

      const response = await fetch(
        `${API_BASE}/api/lab-results/${selectedResult.lab_result_id}/upload`,
        {
          method: "PUT",
          headers: { Authorization: headers.Authorization },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to upload report");
      }

      // Reset and refresh
      setUploadForm({
        file: null,
        result_value: "",
        unit: "",
        reference_range: "",
        result_status: "pending",
        notes: "",
      });
      setShowUploadModal(false);
      setSuccessMessage("Report uploaded successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchLabResults(currentPage, activeTab);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ===== FILTER HELPERS =====
  const filteredResults =
    activeTab === "all"
      ? labResults
      : labResults.filter((r) => r.status === activeTab);

  const testCategories = [
    "Blood Test",
    "Urine Test",
    "Imaging",
    "ECG",
    "X-Ray",
    "Ultrasound",
    "CT Scan",
    "MRI",
    "Other",
  ];

  // ===== RENDER =====
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🧪 Laboratory Results Management</h1>

      {/* Success Message */}
      {successMessage && (
        <div style={styles.successBox}>
          ✓ {successMessage}
          <button
            onClick={() => setSuccessMessage("")}
            style={{ marginLeft: "1rem", background: "none", border: "none", color: "white", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={styles.errorBox}>
          ✗ {error}
          <button
            onClick={() => setError("")}
            style={{ marginLeft: "1rem", background: "none", border: "none", color: "white", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Controls Section */}
      <div style={styles.controlsSection}>
        <div style={styles.searchBox}>
          <input
            type="text"
            placeholder="Search by test name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            style={styles.searchInput}
          />
          <button
            onClick={() => fetchLabResults(1, activeTab)}
            style={styles.searchBtn}
          >
            🔍 Search
          </button>
        </div>

        <button
          onClick={() => setShowRequestModal(true)}
          style={styles.primaryBtn}
        >
          ➕ Request New Test
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={styles.tabNav}>
        <button
          style={{
            ...styles.tabBtn,
            ...(activeTab === "all" && styles.activeTab),
          }}
          onClick={() => setActiveTab("all")}
        >
          All Results ({labResults.length})
        </button>
        <button
          style={{
            ...styles.tabBtn,
            ...(activeTab === "pending" && styles.activeTab),
          }}
          onClick={() => setActiveTab("pending")}
        >
          ⏳ Pending ({labResults.filter((r) => r.status === "pending").length})
        </button>
        <button
          style={{
            ...styles.tabBtn,
            ...(activeTab === "completed" && styles.activeTab),
          }}
          onClick={() => setActiveTab("completed")}
        >
          ✓ Completed ({labResults.filter((r) => r.status === "completed").length})
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={styles.loadingBox}>⏳ Loading lab results...</div>
      )}

      {/* Results Grid */}
      {!loading && filteredResults.length > 0 && (
        <div style={styles.resultsGrid}>
          {filteredResults.map((result) => (
            <LabResultCard
              key={result.lab_result_id}
              result={result}
              onUpload={() => {
                setSelectedResult(result);
                setShowUploadModal(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredResults.length === 0 && (
        <div style={styles.emptyState}>
          <p>📭 No {activeTab !== "all" ? activeTab + " " : ""}lab results found</p>
          <button
            onClick={() => setShowRequestModal(true)}
            style={styles.secondaryBtn}
          >
            Request a Test
          </button>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            style={styles.paginationBtn}
          >
            ← Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            style={styles.paginationBtn}
          >
            Next →
          </button>
        </div>
      )}

      {/* Request Test Modal */}
      {showRequestModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>📝 Request Laboratory Test</h2>
              <button
                onClick={() => setShowRequestModal(false)}
                style={styles.closeBtn}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTestRequest} style={styles.form}>
              <div style={styles.formGroup}>
                <label>Patient *</label>
                <select
                  value={requestForm.patient_id}
                  onChange={(e) => {
                    setRequestForm({ ...requestForm, patient_id: e.target.value });
                    if (e.target.value) {
                      fetchAppointmentsForPatient(e.target.value);
                    }
                  }}
                  style={styles.input}
                  required
                >
                  <option value="">Select Patient</option>
                  {patients.map((p) => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {p.User?.full_name} ({p.patient_id.substring(0, 8)})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label>Appointment (Optional)</label>
                <select
                  value={requestForm.appointment_id}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, appointment_id: e.target.value })
                  }
                  style={styles.input}
                >
                  <option value="">No appointment</option>
                  {appointments.map((a) => (
                    <option key={a.appointment_id} value={a.appointment_id}>
                      {new Date(a.start_time).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label>Test Name *</label>
                <input
                  type="text"
                  value={requestForm.test_name}
                  onChange={(e) =>
                    setRequestForm({ ...requestForm, test_name: e.target.value })
                  }
                  placeholder="e.g., Blood Type, CBC, Glucose"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label>Test Category *</label>
                <select
                  value={requestForm.test_category}
                  onChange={(e) =>
                    setRequestForm({
                      ...requestForm,
                      test_category: e.target.value,
                    })
                  }
                  style={styles.input}
                  required
                >
                  {testCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label>Description (Optional)</label>
                <textarea
                  value={requestForm.test_description}
                  onChange={(e) =>
                    setRequestForm({
                      ...requestForm,
                      test_description: e.target.value,
                    })
                  }
                  placeholder="Additional notes or special instructions..."
                  style={{ ...styles.input, minHeight: "100px" }}
                />
              </div>

              <div style={styles.formActions}>
                <button type="submit" style={styles.primaryBtn}>
                  ✓ Request Test
                </button>
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  style={styles.secondaryBtn}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Report Modal */}
      {showUploadModal && selectedResult && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h2>📤 Upload Test Report</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                style={styles.closeBtn}
              >
                ✕
              </button>
            </div>

            <div style={styles.resultInfo}>
              <p>
                <strong>Test:</strong> {selectedResult.test_name}
              </p>
              <p>
                <strong>Patient:</strong> {selectedResult.Patient?.User?.full_name}
              </p>
              <p>
                <strong>Status:</strong> {selectedResult.status}
              </p>
            </div>

            <form onSubmit={handleUploadReport} style={styles.form}>
              <div style={styles.formGroup}>
                <label>Report File (PDF/Image) *</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, file: e.target.files[0] })
                  }
                  style={styles.input}
                  required
                />
                <p style={{ fontSize: "0.9rem", color: "#666", marginTop: "0.5rem" }}>
                  Max size: 10MB. Allowed: PDF, JPG, PNG
                </p>
              </div>

              <div style={styles.formGroup}>
                <label>Result Status</label>
                <select
                  value={uploadForm.result_status}
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      result_status: e.target.value,
                    })
                  }
                  style={styles.input}
                >
                  <option value="pending">Pending (Awaiting Review)</option>
                  <option value="normal">Normal</option>
                  <option value="abnormal">Abnormal</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div style={styles.twoColumn}>
                <div style={styles.formGroup}>
                  <label>Result Value</label>
                  <input
                    type="text"
                    value={uploadForm.result_value}
                    onChange={(e) =>
                      setUploadForm({
                        ...uploadForm,
                        result_value: e.target.value,
                      })
                    }
                    placeholder="e.g., 120"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label>Unit</label>
                  <input
                    type="text"
                    value={uploadForm.unit}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, unit: e.target.value })
                    }
                    placeholder="e.g., mg/dL"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label>Reference Range</label>
                <input
                  type="text"
                  value={uploadForm.reference_range}
                  onChange={(e) =>
                    setUploadForm({
                      ...uploadForm,
                      reference_range: e.target.value,
                    })
                  }
                  placeholder="e.g., 70-100"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label>Notes</label>
                <textarea
                  value={uploadForm.notes}
                  onChange={(e) =>
                    setUploadForm({ ...uploadForm, notes: e.target.value })
                  }
                  placeholder="Additional clinical notes..."
                  style={{ ...styles.input, minHeight: "80px" }}
                />
              </div>

              <div style={styles.formActions}>
                <button type="submit" style={styles.primaryBtn}>
                  📤 Upload & Complete
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  style={styles.secondaryBtn}
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

/**
 * ================================
 * LAB RESULT CARD COMPONENT
 * ================================
 * Displays individual lab result in card format
 */
const LabResultCard = ({ result, onUpload }) => {
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const headers = getAuthHeaders();

  const handleDownload = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/lab-results/${result.lab_result_id}/download`,
        { headers }
      );

      if (!response.ok) {
        alert(await response.text());
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lab-report-${result.lab_result_id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Error downloading report: " + err.message);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div>
          <h3 style={styles.cardTitle}>{result.test_name}</h3>
          <p style={styles.cardMeta}>
            Category: {result.test_category} | Created:{" "}
            {new Date(result.created_at).toLocaleDateString()}
          </p>
        </div>
        <span
          style={{
            ...styles.badge,
            backgroundColor:
              result.status === "completed" ? "#2ecc71" : "#f39c12",
          }}
        >
          {result.status === "completed" ? "✓ Completed" : "⏳ Pending"}
        </span>
      </div>

      <div style={styles.cardBody}>
        <p>
          <strong>Patient:</strong> {result.Patient?.User?.full_name}
        </p>
        {result.test_description && (
          <p>
            <strong>Description:</strong> {result.test_description}
          </p>
        )}
        {result.result_value && (
          <p>
            <strong>Result:</strong> {result.result_value} {result.unit}
            {result.reference_range && ` (Normal: ${result.reference_range})`}
          </p>
        )}
      </div>

      <div style={styles.cardActions}>
        {result.status === "pending" ? (
          <button onClick={onUpload} style={styles.uploadBtn}>
            📤 Upload Report
          </button>
        ) : (
          <button onClick={handleDownload} style={styles.downloadBtn}>
            📥 Download Report
          </button>
        )}
      </div>
    </div>
  );
};

// ===== STYLES =====
const styles = {
  container: {
    padding: "2rem",
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
  },
  title: {
    fontSize: "2.5rem",
    color: "#333",
    marginBottom: "1.5rem",
  },
  successBox: {
    backgroundColor: "#2ecc71",
    color: "white",
    padding: "1rem",
    borderRadius: "6px",
    marginBottom: "1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorBox: {
    backgroundColor: "#e74c3c",
    color: "white",
    padding: "1rem",
    borderRadius: "6px",
    marginBottom: "1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  controlsSection: {
    display: "flex",
    gap: "1rem",
    marginBottom: "2rem",
    justifyContent: "space-between",
    alignItems: "center",
  },
  searchBox: {
    display: "flex",
    gap: "0.5rem",
    flex: 1,
    maxWidth: "400px",
  },
  searchInput: {
    flex: 1,
    padding: "0.75rem",
    border: "1px solid #ddd",
    borderRadius: "6px",
    fontSize: "1rem",
  },
  searchBtn: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  primaryBtn: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#27ae60",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  secondaryBtn: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#95a5a6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  tabNav: {
    display: "flex",
    gap: "1rem",
    marginBottom: "1.5rem",
    borderBottom: "2px solid #ecf0f1",
  },
  tabBtn: {
    padding: "1rem 1.5rem",
    backgroundColor: "transparent",
    border: "none",
    color: "#666",
    cursor: "pointer",
    borderBottom: "3px solid transparent",
    fontSize: "1rem",
  },
  activeTab: {
    color: "#3498db",
    borderBottomColor: "#3498db",
  },
  loadingBox: {
    textAlign: "center",
    padding: "2rem",
    color: "#666",
    fontSize: "1.1rem",
  },
  resultsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
    gap: "1.5rem",
    marginBottom: "2rem",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    overflow: "hidden",
  },
  cardHeader: {
    padding: "1.5rem",
    borderBottom: "1px solid #ecf0f1",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: {
    margin: "0 0 0.5rem 0",
    color: "#333",
    fontSize: "1.2rem",
  },
  cardMeta: {
    margin: "0",
    color: "#999",
    fontSize: "0.9rem",
  },
  badge: {
    padding: "0.5rem 1rem",
    borderRadius: "20px",
    color: "white",
    fontSize: "0.85rem",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
  cardBody: {
    padding: "1.5rem",
  },
  cardActions: {
    padding: "1rem 1.5rem",
    borderTop: "1px solid #ecf0f1",
    display: "flex",
    gap: "0.5rem",
  },
  uploadBtn: {
    flex: 1,
    padding: "0.75rem",
    backgroundColor: "#e67e22",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  downloadBtn: {
    flex: 1,
    padding: "0.75rem",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  emptyState: {
    textAlign: "center",
    padding: "3rem",
    backgroundColor: "white",
    borderRadius: "8px",
    color: "#666",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "1rem",
    marginTop: "2rem",
  },
  paginationBtn: {
    padding: "0.5rem 1rem",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
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
    borderRadius: "8px",
    padding: "2rem",
    maxWidth: "600px",
    maxHeight: "90vh",
    overflowY: "auto",
    width: "90%",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
  },
  closeBtn: {
    backgroundColor: "transparent",
    border: "none",
    fontSize: "1.5rem",
    cursor: "pointer",
    color: "#666",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  input: {
    padding: "0.75rem",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "1rem",
  },
  twoColumn: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem",
  },
  formActions: {
    display: "flex",
    gap: "1rem",
    justifyContent: "flex-end",
  },
  resultInfo: {
    backgroundColor: "#f5f5f5",
    padding: "1rem",
    borderRadius: "6px",
    marginBottom: "1.5rem",
  },
};

export default LabResultsManagement;
