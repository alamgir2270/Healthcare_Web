import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthHeaders } from "../../utils/auth";
import DoctorSelector from "../../components/DoctorSelector";
import PatientLabResults from "./LabResults";

const PatientDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [patientData, setPatientData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [bills, setBills] = useState([]);
  const [healthStatuses, setHealthStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showDoctorSelector, setShowDoctorSelector] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ payment_method: "Card" });

  const fetchPatientData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const headers = getAuthHeaders();

      // Fetch patient profile first
      const patientResponse = await fetch(`${API_BASE}/api/patients/me`, { headers });
      if (patientResponse?.ok) {
        const patientDataObj = await patientResponse.json();
        setPatientData(patientDataObj.data || {});
      } else {
        setPatientData({});
      }

      // Fetch appointments, prescriptions, bills
      const [appointResponse, prescResponse, billResponse, healthResponse] = await Promise.all([
        fetch(`${API_BASE}/api/appointments`, { headers }).catch(e => ({ ok: false })),
        fetch(`${API_BASE}/api/prescriptions`, { headers }).catch(e => ({ ok: false })),
        fetch(`${API_BASE}/api/bills`, { headers }).catch(e => ({ ok: false })),
        fetch(`${API_BASE}/api/health-status`, { headers }).catch(e => ({ ok: false })),
      ]);

      if (appointResponse?.ok) {
        const appointData = await appointResponse.json();
        setAppointments(appointData.data || []);
      }

      if (prescResponse?.ok) {
        const prescData = await prescResponse.json();
        setPrescriptions(prescData.data || []);
      }

      if (billResponse?.ok) {
        const billData = await billResponse.json();
        setBills(billData.data || []);
      }

      if (healthResponse?.ok) {
        const healthData = await healthResponse.json();
        setHealthStatuses(healthData.data || []);
      }
    } catch (err) {
      console.error("Error fetching patient data:", err);
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const headers = getAuthHeaders();
      fetch(`${API_BASE}/api/patients/ensure`, { method: "POST", headers });
    } catch (e) {
      console.warn("Could not ensure patient profile");
    }
    fetchPatientData();
  }, [fetchPatientData]);

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const initProfileFormFromData = (pd) => {
    if (!pd) return;
    setProfileForm({
      dob: pd.dob || "",
      gender: pd.gender || "",
      address: pd.address || "",
      insurance_info: pd.insurance_info || "",
      mobile: pd.User?.phone || "",
      patient_id: pd.patient_id,
    });
  };

  const cancelEditProfile = () => {
    initProfileFormFromData(patientData || {});
    setEditingProfile(false);
  };

  const openPaymentModal = (bill) => {
    setSelectedBill(bill);
    setPaymentForm({ payment_method: "Card" });
    setShowPaymentModal(true);
  };

  const payBill = async () => {
    if (!selectedBill) return;
    
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const headers = getAuthHeaders();
      
      const balanceDue = parseFloat(selectedBill.total_amount) - parseFloat(selectedBill.paid_amount || 0);
      
      const response = await fetch(`${API_BASE}/api/bills/${selectedBill.bill_id}/pay`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          amount_paid: balanceDue,
          payment_method: paymentForm.payment_method || "Card"
        })
      });

      if (response.ok) {
        alert("✅ Payment successful! Your bill has been paid.");
        setShowPaymentModal(false);
        setSelectedBill(null);
        fetchPatientData();
      } else {
        const errorData = await response.json();
        alert(`❌ Payment failed: ${errorData.message}`);
      }
    } catch (err) {
      console.error("Payment error:", err);
      alert(`❌ Error processing payment: ${err.message}`);
    }
  };

  // Upcoming appointments
  const upcomingAppointments = appointments
    .filter((apt) => new Date(apt.start_time) > new Date())
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    .slice(0, 3);

  // Active prescriptions
  const activePrescriptions = prescriptions.slice(0, 3);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ fontSize: "1.2rem", color: "#666" }}>⏳ Loading your health information...</p>
          <p style={{ color: "#999", marginTop: "1rem" }}>This may take a few seconds</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1>👋 Welcome, {patientData?.User?.full_name || user?.full_name || "Patient"}</h1>
          <p style={{ color: "#666", marginTop: "0.5rem" }}>Your Health Dashboard</p>
        </div>
        <button onClick={logout} style={styles.logoutBtn}>Logout</button>
      </div>

      {error && (
        <div style={styles.errorBox}>
          ⚠️ {error}
          <button onClick={fetchPatientData} style={{ marginLeft: "1rem" }}>Retry</button>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={styles.tabNav}>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === "overview" && styles.activeTab) }}
          onClick={() => setActiveTab("overview")}
        >
          📋 Overview
        </button>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === "appointments" && styles.activeTab) }}
          onClick={() => setActiveTab("appointments")}
        >
          📅 Appointments
        </button>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === "prescriptions" && styles.activeTab) }}
          onClick={() => setActiveTab("prescriptions")}
        >
          💊 Prescriptions
        </button>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === "bills" && styles.activeTab) }}
          onClick={() => setActiveTab("bills")}
        >
          💰 Bills
        </button>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === "lab-results" && styles.activeTab) }}
          onClick={() => setActiveTab("lab-results")}
        >
          🔬 Lab Results
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div>
          {/* Profile Card */}
          <div style={{ ...styles.section, backgroundColor: "#e3f2fd", borderLeft: "5px solid #2196f3", marginBottom: "2rem" }}>
            <h2>👤 Your Health Profile</h2>
            {patientData ? (
              <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
                {/* Profile Image */}
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 120, height: 120, backgroundColor: "#ccc", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#666", fontSize: "3rem", marginBottom: "1rem" }}>👤</div>
                  <button onClick={() => { initProfileFormFromData(patientData); setEditingProfile(true); }} style={{ padding: "0.5rem 1rem", backgroundColor: "#2196f3", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>✏️ Edit</button>
                </div>

                {/* Profile Details */}
                <div style={{ flex: 1 }}>
                  {!editingProfile ? (
                    <div>
                      <p style={{ margin: "0 0 0.5rem 0" }}><strong>Name:</strong> {patientData?.User?.full_name || user?.full_name || "N/A"}</p>
                      <p style={{ margin: "0 0 0.5rem 0" }}><strong>Email:</strong> {patientData?.User?.email || user?.email || "N/A"}</p>
                      <p style={{ margin: "0 0 0.5rem 0" }}><strong>Mobile:</strong> {patientData?.User?.phone || "Not set"}</p>
                      <p style={{ margin: "0 0 0.5rem 0" }}><strong>DOB:</strong> {patientData?.dob || "Not set"}</p>
                      <p style={{ margin: "0 0 0.5rem 0" }}><strong>Gender:</strong> {patientData?.gender || "Not set"}</p>
                      <p style={{ margin: "0 0 0.5rem 0" }}><strong>Address:</strong> {patientData?.address || "Not set"}</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Date of Birth</label>
                        <input type="date" value={profileForm.dob || ""} onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })} style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Gender</label>
                        <select value={profileForm.gender || ""} onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })} style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }}>
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Address</label>
                        <input value={profileForm.address || ""} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} placeholder="Address" style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>Mobile</label>
                        <input type="tel" value={profileForm.mobile || ""} onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })} placeholder="+1234567890" style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }} />
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={async () => {
                          try {
                            const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
                            const headers = getAuthHeaders();
                            const payload = { ...profileForm, phone: profileForm.mobile || undefined };
                            const resp = await fetch(`${API_BASE}/api/patients/${profileForm.patient_id}`, {
                              method: "PATCH",
                              headers,
                              body: JSON.stringify(payload),
                            });
                            if (resp.ok) {
                              const data = await resp.json();
                              setPatientData(data.data);
                              setEditingProfile(false);
                            } else {
                              alert("Failed to save");
                            }
                          } catch (e) {
                            alert(e.message);
                          }
                        }} style={{ padding: "0.5rem 1rem", backgroundColor: "#4caf50", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>✓ Save</button>
                        <button onClick={cancelEditProfile} style={{ padding: "0.5rem 1rem", backgroundColor: "#f44336", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}>✗ Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p>Loading profile...</p>
            )}
          </div>

          {/* Quick Stats */}
          <div style={styles.cardsGrid}>
            <StatCard icon="📅" label="Upcoming Appointments" value={upcomingAppointments.length} color="#3498db" />
            <StatCard icon="💊" label="Active Prescriptions" value={activePrescriptions.length} color="#2ecc71" />
            <StatCard icon="💰" label="Pending Bills" value={bills.filter(b => b.payment_status !== "paid").length} color="#f39c12" />
          </div>

          {/* Upcoming Appointments */}
          {upcomingAppointments.length > 0 && (
            <div style={styles.section}>
              <h2>📅 Upcoming Appointments</h2>
              {upcomingAppointments.map((apt, idx) => (
                <AppointmentCard key={idx} appointment={apt} />
              ))}
            </div>
          )}

          {/* Active Prescriptions */}
          {activePrescriptions.length > 0 && (
            <div style={styles.section}>
              <h2>💊 Active Prescriptions</h2>
              {activePrescriptions.map((presc, idx) => (
                <PrescriptionCard key={idx} prescription={presc} />
              ))}
            </div>
          )}


          {/* Quick Actions */}
          <div style={styles.section}>
            <h2>⚡ Quick Actions</h2>
            <div style={styles.actionGrid}>
              <ActionButton icon="📅" label="Book Appointment" color="#3498db" onClick={() => setShowDoctorSelector(true)} />
              <ActionButton icon="📊" label="View Medical History" color="#e74c3c" />
              <ActionButton icon="💬" label="Message Doctor" color="#2ecc71" />
              <ActionButton icon="⚙️" label="Update Profile" color="#f39c12" onClick={() => { initProfileFormFromData(patientData); setEditingProfile(true); }} />
            </div>
          </div>
        </div>
      )}

      {/* Appointments Tab */}
      {activeTab === "appointments" && (
        <div style={styles.section}>
          <h2>📅 All Appointments</h2>
          {appointments.length > 0 ? (
            <div>
              {appointments.map((apt, idx) => (
                <AppointmentCard key={idx} appointment={apt} />
              ))}
              <button onClick={() => setShowDoctorSelector(true)} style={{ marginTop: "1rem", padding: "0.75rem 1.5rem", backgroundColor: "#3498db", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>+ Book Another</button>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <p style={styles.emptyState}>No appointments scheduled yet.</p>
              <button onClick={() => setShowDoctorSelector(true)} style={{ marginTop: "1rem", padding: "0.75rem 1.5rem", backgroundColor: "#3498db", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>📅 Book First Appointment</button>
            </div>
          )}
        </div>
      )}

      {/* Prescriptions Tab */}
      {activeTab === "prescriptions" && (
        <div style={styles.section}>
          <h2>💊 All Prescriptions</h2>
          {prescriptions.length > 0 ? (
            <div>
              {prescriptions.map((presc, idx) => (
                <PrescriptionCard key={idx} prescription={presc} />
              ))}
            </div>
          ) : (
            <p style={styles.emptyState}>No prescriptions on file.</p>
          )}
        </div>
      )}

      {/* Bills Tab */}
      {activeTab === "bills" && (
        <div style={styles.section}>
          <h2>💰 Bills</h2>
          {bills.length > 0 ? (
            <div>
              {bills.map((bill, idx) => (
                <BillCard key={idx} bill={bill} onPay={openPaymentModal} />
              ))}
            </div>
          ) : (
            <p style={styles.emptyState}>No bills on file.</p>
          )}
        </div>
      )}

      {/* Lab Results Tab */}
      {activeTab === "lab-results" && (
        <PatientLabResults />
      )}

      {/* Refresh Button */}
      <button onClick={fetchPatientData} style={styles.refreshBtn}>🔄 Refresh Data</button>

      {/* Payment Modal */}
      {showPaymentModal && selectedBill && (() => {
        const isConsultation = selectedBill.fee_type === "consultation" || (selectedBill.appointment_id && !selectedBill.lab_result_id);
        const isLabTest = selectedBill.fee_type === "lab_test" || (selectedBill.lab_result_id && !selectedBill.appointment_id);
        
        return (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <h3 style={{ marginTop: 0 }}>
              💳 Pay Your Bill - {isConsultation ? "👨‍⚕️ Doctor Consultation" : "🔬 Lab Test"}
            </h3>
            <div style={{ marginBottom: "1.5rem" }}>
              <p style={{backgroundColor: isConsultation ? "#e8f8f5" : "#fdf2e9", padding: "10px", borderRadius: "6px", color: isConsultation ? "#186a3b" : "#7d3c02"}}>
                <strong>{isConsultation ? "💊 Doctor's Consultation Fee" : "🧪 Laboratory Testing Fee"}</strong>
              </p>
              <p><strong>Bill ID:</strong> {selectedBill.bill_id?.substring(0, 8)}</p>
              <p><strong>Total Amount:</strong> ৳{parseFloat(selectedBill.total_amount || 0).toFixed(2)}</p>
              <p><strong>Already Paid:</strong> ৳{parseFloat(selectedBill.paid_amount || 0).toFixed(2)}</p>
              <p style={{fontSize: "1.1rem", color: "#e74c3c", fontWeight: "bold"}}>
                <strong>Balance Due:</strong> ৳{(parseFloat(selectedBill.total_amount || 0) - parseFloat(selectedBill.paid_amount || 0)).toFixed(2)}
              </p>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.5rem" }}>Payment Method</label>
              <select
                value={paymentForm.payment_method}
                onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "4px", border: "1px solid #ddd", fontSize: "1rem" }}
              >
                <option value="Card">💳 Credit/Debit Card</option>
                <option value="Cash">💵 Cash</option>
                <option value="Check">📋 Check</option>
                <option value="Bank Transfer">🏦 Bank Transfer</option>
                <option value="Online">📱 Online Payment</option>
              </select>
            </div>

            <div style={{ backgroundColor: "#f0f8ff", padding: "1rem", borderRadius: "4px", marginBottom: "1rem", borderLeft: "4px solid #3498db" }}>
              <p style={{margin: "0", fontSize: "0.9rem", color: "#333"}}>
                ⚠️ <strong>Note:</strong> Full payment of ৳{(parseFloat(selectedBill.total_amount || 0) - parseFloat(selectedBill.paid_amount || 0)).toFixed(2)} is required. Partial payments are not allowed.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{ padding: "0.75rem 1.5rem", backgroundColor: "#999", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "1rem" }}
              >
                Cancel
              </button>
              <button
                onClick={payBill}
                style={{ padding: "0.75rem 1.5rem", backgroundColor: "#2ecc71", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "1rem", fontWeight: "bold" }}
              >
                ✓ Complete Payment
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Doctor Selector Modal */}
      {showDoctorSelector && (
        <DoctorSelector
          onClose={() => setShowDoctorSelector(false)}
          onBookingSuccess={() => {
            setTimeout(() => fetchPatientData(), 1000);
          }}
        />
      )}
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div style={{ ...styles.card, borderLeft: `5px solid ${color}` }}>
    <p style={{ fontSize: "2rem", margin: "0 0 0.5rem 0" }}>{icon}</p>
    <p style={styles.cardLabel}>{label}</p>
    <p style={styles.cardValue}>{value}</p>
  </div>
);

const AppointmentCard = ({ appointment }) => (
  <div style={styles.itemCard}>
    <div style={styles.itemHeader}>
      <div>
        <h3 style={styles.itemTitle}>Dr. {appointment.doctor?.User?.full_name || "Doctor"}</h3>
        <p style={styles.itemMeta}>📅 {new Date(appointment.start_time).toLocaleDateString()} at {new Date(appointment.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
      </div>
      <span style={{ ...styles.badge, backgroundColor: appointment.status === "completed" ? "#2ecc71" : "#3498db" }}>{appointment.status}</span>
    </div>
    {appointment.notes && <p style={styles.itemDescription}>{appointment.notes}</p>}
  </div>
);

const PrescriptionCard = ({ prescription }) => {
  const isActive = new Date(prescription.end_date || prescription.end_at || new Date()) > new Date();
  return (
    <div style={styles.itemCard}>
      <div style={styles.itemHeader}>
        <div>
          <h3 style={styles.itemTitle}>💊 {prescription.medication_name}</h3>
          <p style={styles.itemMeta}>Dosage: {prescription.dosage} | Frequency: {prescription.frequency}</p>
        </div>
        <span style={{ ...styles.badge, backgroundColor: isActive ? "#2ecc71" : "#95a5a6" }}>{isActive ? "Active" : "Completed"}</span>
      </div>
    </div>
  );
};

const BillCard = ({ bill, onPay }) => {
  // Determine fee type based on fee_type field, or by checking appointment_id vs lab_result_id
  const isConsultation = bill.fee_type === "consultation" || (bill.appointment_id && !bill.lab_result_id);
  const isLabTest = bill.fee_type === "lab_test" || (bill.lab_result_id && !bill.appointment_id);
  
  return (
  <div style={styles.itemCard}>
    <div style={styles.itemHeader}>
      <div>
        <h3 style={styles.itemTitle}>
          {isConsultation ? "👨‍⚕️ Doctor Consultation" : "🔬 Lab Test"} 
          #{bill.bill_id?.substring(0, 8)}
        </h3>
        <p style={styles.itemMeta}>
          {isConsultation ? "💊 Doctor's Consultation Fee" : "🧪 Laboratory Testing Fee"}
        </p>
        <p style={styles.itemMeta}>Amount: BDT {bill.total_amount}</p>
        <p style={styles.itemMeta}>Paid: BDT {bill.paid_amount}</p>
        {bill.payment_status !== "paid" && (
          <p style={styles.itemMeta} style={{color: "#e74c3c", fontWeight: "bold"}}>
            Balance Due: BDT {(parseFloat(bill.total_amount) - parseFloat(bill.paid_amount || 0)).toFixed(2)}
          </p>
        )}
      </div>
      <div style={{display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem"}}>
        <span style={{ ...styles.badge, backgroundColor: bill.payment_status === "paid" ? "#2ecc71" : "#e74c3c" }}>{bill.payment_status}</span>
        {bill.payment_status !== "paid" && (
          <button 
            onClick={() => onPay(bill)}
            style={{padding: "0.5rem 1rem", backgroundColor: "#3498db", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem"}}
          >
            💳 Pay Now
          </button>
        )}
      </div>
    </div>
  </div>
  );
};

const ActionButton = ({ icon, label, color, onClick }) => (
  <button onClick={onClick} style={{ ...styles.actionBtn, backgroundColor: color, color: "white" }}>
    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{icon}</div>
    {label}
  </button>
);

const modalStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000
  },
  modal: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
    maxWidth: "500px",
    width: "90%",
    maxHeight: "80vh",
    overflowY: "auto"
  }
};

const styles = {
  container: { padding: "2rem", backgroundColor: "#f5f5f5", minHeight: "100vh", fontFamily: "Arial, sans-serif" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", backgroundColor: "white", padding: "2rem", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" },
  logoutBtn: { padding: "0.75rem 1.5rem", backgroundColor: "#e74c3c", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "1rem" },
  errorBox: { backgroundColor: "#ffe6e6", color: "#c0392b", padding: "1rem", borderRadius: "4px", marginBottom: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" },
  tabNav: { display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "2px solid #ecf0f1", overflowX: "auto" },
  tabBtn: { padding: "1rem 1.5rem", backgroundColor: "transparent", border: "none", color: "#666", cursor: "pointer", fontSize: "1rem", borderBottom: "3px solid transparent", transition: "all 0.3s", whiteSpace: "nowrap" },
  activeTab: { color: "#3498db", borderBottomColor: "#3498db" },
  cardsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2rem" },
  card: { backgroundColor: "white", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" },
  cardLabel: { fontSize: "0.9rem", color: "#666", margin: "0" },
  cardValue: { fontSize: "2rem", fontWeight: "bold", color: "#333", margin: "0.5rem 0 0 0" },
  section: { backgroundColor: "white", padding: "2rem", borderRadius: "8px", marginBottom: "2rem", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" },
  itemCard: { backgroundColor: "#f9f9f9", padding: "1.5rem", borderRadius: "6px", marginBottom: "1rem", borderLeft: "4px solid #3498db" },
  itemHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" },
  itemTitle: { margin: "0 0 0.5rem 0", color: "#333", fontSize: "1.1rem" },
  itemMeta: { margin: "0.25rem 0", color: "#666", fontSize: "0.9rem" },
  itemDescription: { color: "#555", fontSize: "0.95rem", marginTop: "0.5rem" },
  badge: { padding: "0.5rem 1rem", borderRadius: "20px", color: "white", fontSize: "0.85rem", fontWeight: "bold", textTransform: "capitalize" },
  actionGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" },
  actionBtn: { padding: "1.5rem", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "1rem", display: "flex", flexDirection: "column", alignItems: "center", transition: "transform 0.2s" },
  refreshBtn: { padding: "0.75rem 1.5rem", backgroundColor: "#3498db", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "1rem" },
  emptyState: { textAlign: "center", color: "#999", padding: "2rem", fontSize: "1.1rem" },
};

export default PatientDashboard;
