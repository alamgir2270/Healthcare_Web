import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthHeaders } from "../../utils/auth";
import OverviewSection from "./components/OverviewSection";
import AppointmentsSection from "./components/AppointmentsSection";
import PrescriptionsSection from "./components/PrescriptionsSection";
import HealthStatusSection from "./components/HealthStatusSection";
import BillsSection from "./components/BillsSection";
import ProfileSection from "./components/ProfileSection";
import DocLabResultsSection from "./components/LabResultsSection";
import LabTestOrderSection from "./components/LabTestOrderSection";

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [bills, setBills] = useState([]);
  const [doctorStats, setDoctorStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showPrescModal, setShowPrescModal] = useState(false);
  const [prescForm, setPrescForm] = useState({
    patient_id: "",
    appointment_id: "",
    medications: [
      { medication_name: "", dosage: "", frequency: "", notes: "" }
    ],
    advice: "",
    send_pdf: true,
  });
  const [prescLoading, setPrescLoading] = useState(false);
  const [completingAptId, setCompletingAptId] = useState(null);
  const [healthStatuses, setHealthStatuses] = useState([]);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [healthLoading, setHealthLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [healthForm, setHealthForm] = useState({
    systolic_bp: "",
    diastolic_bp: "",
    heart_rate: "",
    temperature: "",
    weight_kg: "",
    height_cm: "",
  });
  const [profileForm, setProfileForm] = useState({
    doctor_id: "",
    specialty: "",
    bio: "",
    available_hours: "",
    available_days: "",
    license_no: "",
    phone: "",
    email: "",
    department: "",
  });

  const fetchDoctorData = useCallback(async () => {
    setError("");
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const headers = getAuthHeaders();

    try {
      // Fetch doctor's appointments, patients, prescriptions, bills, and health status
      const [appointResponse, patientResponse, prescResponse, billResponse, healthResponse] = await Promise.all([
        fetch(`${API_BASE}/api/appointments`, { headers }),
        fetch(`${API_BASE}/api/patients`, { headers }),
        fetch(`${API_BASE}/api/prescriptions`, { headers }),
        fetch(`${API_BASE}/api/bills`, { headers }),
        fetch(`${API_BASE}/api/health-status`, { headers }),
      ]);

      // Appointments
      const appointData = await appointResponse.json();
      const fetchedAppointments = appointData.data || [];
      setAppointments(fetchedAppointments);

      // Patients
      let fetchedPatients = [];
      if (patientResponse.ok) {
        const patientData = await patientResponse.json();
        fetchedPatients = patientData.data || [];
        setPatients(fetchedPatients);
      }

      // Prescriptions
      let fetchedPrescriptions = [];
      if (prescResponse.ok) {
        const prescData = await prescResponse.json();
        fetchedPrescriptions = prescData.data || [];
        setPrescriptions(fetchedPrescriptions);
      }

      // Bills
      if (billResponse.ok) {
        const billData = await billResponse.json();
        setBills(billData.data || []);
      }

      // Health statuses
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealthStatuses(healthData.data || []);
      }

      // Calculate stats using freshly fetched data
      const today = new Date();
      const todayAppointments = fetchedAppointments.filter(
        (apt) => new Date(apt.start_time).toDateString() === today.toDateString()
      ).length;

      setDoctorStats({
        name: user.full_name || "Doctor",
        totalAppointments: fetchedAppointments.length,
        todayAppointments,
        totalPatients: fetchedPatients.length || 0,
        activePrescriptions: fetchedPrescriptions.filter((p) => new Date(p.issued_at) > new Date()).length || 0,
      });

      // Try to fetch current doctor's profile (for image_url etc.)
      try {
        const meResp = await fetch(`${API_BASE}/api/doctors/me`, { headers });
        if (meResp.ok) {
          const meData = await meResp.json();
          const doctorProfileData = meData.data;
          
          // Attach all doctor profile fields to stats
          setDoctorStats((s) => ({
            ...s,
            profile: doctorProfileData,
            specialty: doctorProfileData.specialty || "",
            license_no: doctorProfileData.license_no || "",
            available_days: doctorProfileData.available_days || "",
            available_hours: doctorProfileData.available_hours || "",
            bio: doctorProfileData.bio || "",
            department: doctorProfileData.department || "",
            phone: doctorProfileData.User?.phone || user.phone || "",
          }));
          
          // Initialize profile form with fetched data
          const pd = doctorProfileData;
          setProfileForm({
            doctor_id: pd.doctor_id,
            specialty: pd.specialty || "",
            bio: pd.bio || "",
            available_hours: pd.available_hours || "",
            available_days: pd.available_days || "",
            license_no: pd.license_no || "",
            phone: pd.User?.phone || user.phone || "",
            email: user.email || "",
            department: pd.department || "",
          });
        }
      } catch (e) {
        console.warn("Could not fetch doctor profile:", e.message);
      }
    } catch (err) {
      setError(err.message || "Failed to fetch doctor data");
      console.error("Doctor data error:", err);
    } finally {
      setLoading(false);
    }
  }, [user.full_name]);

  useEffect(() => {
    (async () => {
      // Ensure doctor profile exists on first load
      try {
        const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const headers = getAuthHeaders();
        await fetch(`${API_BASE}/api/doctors/ensure`, { method: "POST", headers });
      } catch (e) {
        console.warn("Could not ensure doctor profile:", e.message);
      }
      fetchDoctorData();
    })();
  }, [fetchDoctorData]);

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const handlePrescribeAppointment = (apt) => {
    // Check if patient has paid their bill
    const patientBills = bills.filter((b) => b.patient_id === apt.patient_id);
    const unpaidBill = patientBills.find((b) => b.payment_status !== "paid");

    if (unpaidBill) {
      setError("⚠️ Payment required! Patient must complete payment before prescription can be sent.");
      return;
    }

    setPrescForm({
      patient_id: apt.patient_id,
      medications: [{ medication_name: "", dosage: "", frequency: "", notes: "" }],
      advice: "",
      send_pdf: true,
    });
    setShowPrescModal(true);
  };

  const createPrescription = async () => {
    if (!prescForm.patient_id) {
      setError("Please select patient");
      return;
    }

    // Check if at least one medication is entered
    const hasValidMeds = prescForm.medications && prescForm.medications.some(m => m && m.medication_name && m.medication_name.trim());
    if (!hasValidMeds) {
      setError("Please enter at least one medication");
      return;
    }

    // Check if patient has paid their bill
    // If appointment is selected, check that specific appointment's bill
    // Otherwise, check if patient has any unpaid bills
    let checkBills = bills.filter(b => b.patient_id === prescForm.patient_id);
    
    if (prescForm.appointment_id) {
      checkBills = bills.filter(b => b.appointment_id === prescForm.appointment_id);
    }
    
    const unpaidBill = checkBills.find(b => b.payment_status !== "paid");
    
    if (unpaidBill) {
      setError("⚠️ Payment required! Patient must complete payment before prescription can be sent.");
      return;
    }

    try {
      setPrescLoading(true);
      setError("");
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const headers = getAuthHeaders();
      const resp = await fetch(`${API_BASE}/api/prescriptions`, {
        method: "POST",
        headers,
        body: JSON.stringify(prescForm),
      });
      const data = await resp.json();
      if (resp.ok) {
        const patientName = patients.find(p => p.patient_id === prescForm.patient_id)?.User?.full_name || "Patient";
        setSuccess(`✅ Prescription sent to ${patientName}!`);
        setTimeout(() => setSuccess(""), 4000);
        setShowPrescModal(false);
        setPrescForm({
          patient_id: "",
          appointment_id: "",
          medications: [
            { medication_name: "", dosage: "", frequency: "", notes: "" }
          ],
          advice: "",
          send_pdf: true
        });
        fetchDoctorData();
      } else {
        setError(data.message || "Failed to send prescription");
      }
    } catch (e) {
      setError(e.message || "Error sending prescription");
    } finally {
      setPrescLoading(false);
    }
  };

  const completeAppointment = async (appointmentId) => {
    const confirmed = window.confirm(
      "Mark this appointment as completed? A bill of BDT 800 will be created for the patient."
    );
    if (!confirmed) return;

    try {
      setCompletingAptId(appointmentId);
      setError("");
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const headers = getAuthHeaders();
      const resp = await fetch(
        `${API_BASE}/api/appointments/${appointmentId}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({ status: "completed" }),
        }
      );
      const data = await resp.json();
      if (resp.ok) {
        setSuccess("✅ Appointment marked as completed! Bill of BDT 800 created for patient.");
        setTimeout(() => setSuccess(""), 4000);
        fetchDoctorData();
      } else {
        setError(data.message || "Failed to complete appointment");
      }
    } catch (e) {
      setError(e.message || "Error completing appointment");
    } finally {
      setCompletingAptId(null);
    }
  };

  // Get today's appointments using start_time
  const todayAppointments = appointments.filter((apt) => {
    const aptDate = new Date(apt.start_time);
    const today = new Date();
    return aptDate.toDateString() === today.toDateString();
  });

  // Get pending appointments (not completed)
  const pendingAppointments = appointments.filter(
    (apt) => apt.status !== "completed"
  );

  const fetchHealthStatuses = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const headers = getAuthHeaders();
      const resp = await fetch(`${API_BASE}/api/health-status`, { headers });
      const data = await resp.json();
      if (resp.ok) {
        setHealthStatuses(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching health statuses:", err);
    }
  };

  const openHealthModal = (patient = null) => {
    setSelectedPatient(patient);
    if (patient) {
      // Pre-fill form with latest health status if available
      const latestHealth = healthStatuses.find(hs => hs.patient_id === patient.patient_id);
      if (latestHealth) {
        setHealthForm({
          systolic_bp: latestHealth.blood_pressure_systolic || "",
          diastolic_bp: latestHealth.blood_pressure_diastolic || "",
          heart_rate: latestHealth.heart_rate || "",
          temperature: latestHealth.temperature || "",
          weight_kg: latestHealth.weight_kg || "",
          height_cm: latestHealth.height_cm || "",
          notes: "",
        });
      } else {
        setHealthForm({
          systolic_bp: "",
          diastolic_bp: "",
          heart_rate: "",
          temperature: "",
          weight_kg: "",
          height_cm: "",
          notes: "",
        });
      }
    }
    setError("");
    setShowHealthModal(true);
  };

  const recordHealthStatus = async () => {
    if (!selectedPatient) {
      setError("Please select a patient");
      return;
    }

    // Validate required fields
    if (!healthForm.systolic_bp || !healthForm.diastolic_bp || !healthForm.heart_rate) {
      setError("Please fill in blood pressure and heart rate");
      return;
    }

    try {
      setHealthLoading(true);
      setError("");
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const headers = getAuthHeaders();

      const healthData = {
        patient_id: selectedPatient.patient_id,
        systolic_bp: parseInt(healthForm.systolic_bp),
        diastolic_bp: parseInt(healthForm.diastolic_bp),
        heart_rate: parseInt(healthForm.heart_rate),
        temperature: healthForm.temperature ? parseFloat(healthForm.temperature) : null,
        weight_kg: healthForm.weight_kg ? parseFloat(healthForm.weight_kg) : null,
        height_cm: healthForm.height_cm ? parseFloat(healthForm.height_cm) : null,
        notes: healthForm.notes || null,
      };

      const resp = await fetch(`${API_BASE}/api/health-status`, {
        method: "POST",
        headers,
        body: JSON.stringify(healthData),
      });
      const data = await resp.json();

      if (resp.ok) {
        setSuccess(`✅ Health status recorded for ${selectedPatient.User?.full_name || "Patient"}!`);
        setTimeout(() => setSuccess(""), 4000);
        setShowHealthModal(false);
        setSelectedPatient(null);
        setHealthForm({
          systolic_bp: "",
          diastolic_bp: "",
          heart_rate: "",
          temperature: "",
          weight_kg: "",
          height_cm: "",
          notes: "",
        });
        fetchHealthStatuses();
      } else {
        setError(data.message || "Failed to record health status");
      }
    } catch (err) {
      setError(err.message || "Error recording health status");
    } finally {
      setHealthLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "excellent": return "#4caf50";
      case "good": return "#8bc34a";
      case "fair": return "#ff9800";
      case "poor": return "#f44336";
      case "critical": return "#d32f2f";
      default: return "#9e9e9e";
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case "low": return "#4caf50";
      case "moderate": return "#ff9800";
      case "high": return "#f44336";
      case "very_high": return "#d32f2f";
      default: return "#9e9e9e";
    }
  };

  if (loading) {
    return <div style={styles.container}><p>Loading your dashboard...</p></div>;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1>👨‍⚕️ Welcome, Dr. {doctorStats?.name}</h1>
          <p style={{ color: "#666", marginTop: "0.5rem" }}>Manage appointments and patient care</p>
        </div>
        <button onClick={logout} style={styles.logoutBtn}>Logout</button>
      </div>

      {error && (
        <div style={styles.errorBox}>
          ⚠️ {error}
          <button onClick={fetchDoctorData} style={{ marginLeft: "1rem" }}>Retry</button>
        </div>
      )}

      {success && (
        <div style={{
          ...styles.errorBox,
          backgroundColor: "#d4edda",
          color: "#155724",
          borderColor: "#c3e6cb",
        }}>
          {success}
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
          style={{ ...styles.tabBtn, ...(activeTab === "patients" && styles.activeTab) }}
          onClick={() => setActiveTab("patients")}
        >
          🧑‍⚕️ Patients
        </button>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === "prescriptions" && styles.activeTab) }}
          onClick={() => setActiveTab("prescriptions")}
        >
          💊 Prescriptions
        </button>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === "health" && styles.activeTab) }}
          onClick={() => setActiveTab("health")}
        >
          🏥 Health Status
        </button>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === "bills" && styles.activeTab) }}
          onClick={() => setActiveTab("bills")}
        >
          💳 Billing
        </button>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === "lab-results" && styles.activeTab) }}
          onClick={() => setActiveTab("lab-results")}
        >
          🔬 Lab Results
        </button>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === "order-lab" && styles.activeTab) }}
          onClick={() => setActiveTab("order-lab")}
        >
          📤 Order Lab Test
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && doctorStats && (
        <>
          <ProfileSection 
            doctorStats={doctorStats}
            styles={styles}
            onProfileUpdate={fetchDoctorData}
          />
          <OverviewSection 
            doctorStats={doctorStats}
            styles={styles}
            onWritePrescription={() => setShowPrescModal(true)}
            onTabChange={setActiveTab}
          />
        </>
      )}

      {/* Appointments Tab */}
      {activeTab === "appointments" && (
        <AppointmentsSection 
          appointments={appointments}
          styles={styles}
          onStatusChange={completeAppointment}
          onCompleteAppointment={completeAppointment}
        />
      )}

      {/* Patients Tab */}
      {activeTab === "patients" && (
        <div style={styles.section}>
          <h2>🧑‍⚕️ My Patients</h2>
          {patients.length > 0 ? (
            <table style={{ ...styles.table, borderSpacing: 0 }}>
              <thead>
                <tr>
                  <th style={styles.th}>Patient</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Date of Birth</th>
                  <th style={styles.th}>Contact</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient, idx) => (
                  <tr key={idx} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: 700 }}>{patient.User?.full_name || "N/A"}</div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>{patient.User?.email || "N/A"}</td>
                    <td style={styles.td}>{patient.dob || "N/A"}</td>
                    <td style={styles.td}>{patient.User?.phone || "N/A"}</td>
                    <td style={styles.td}>
                      <button
                        onClick={() => openHealthModal(patient)}
                        style={{
                          padding: "0.4rem 0.8rem",
                          backgroundColor: "#27ae60",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.8rem",
                        }}
                      >
                        🏥 Health Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={styles.emptyState}>No patients found.</p>
          )}
        </div>
      )}

      {/* Prescriptions Tab */}
      {activeTab === "prescriptions" && (
        <PrescriptionsSection 
          prescriptions={prescriptions}
          styles={styles}
        />
      )}

      {/* Health Status Tab */}
      {activeTab === "health" && (
        <HealthStatusSection 
          healthStatus={healthStatuses[0] || {}}
          styles={styles}
          onHealthUpdate={fetchDoctorData}
        />
      )}
{/* Prescription Modal */}
      {showPrescModal && (
        <div style={modalStyles.overlay}>
          <div style={{ ...modalStyles.modal, maxWidth: "550px" }}>
            <h3 style={{ marginTop: 0, color: "#3498db" }}>💊 Write & Send Prescription</h3>

            {/* Patient Selection */}
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.25rem", fontSize: "14px" }}>
                Patient *
              </label>
              <select
                value={prescForm.patient_id}
                onChange={(e) => {
                  setError("");
                  setPrescForm({ ...prescForm, patient_id: e.target.value });
                }}
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                }}
              >
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p.patient_id} value={p.patient_id}>
                    {p.User?.full_name || p.User?.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Patient Details Badge with Payment & History Status */}
            {prescForm.patient_id && patients.find((p) => p.patient_id === prescForm.patient_id) && (() => {
              const selectedPatient = patients.find((p) => p.patient_id === prescForm.patient_id);
              const patientBills = bills.filter(b => b.patient_id === prescForm.patient_id);
              const unpaidBill = patientBills.find(b => b.payment_status !== "paid");
              const isPaymentDone = patientBills.length > 0 && !unpaidBill;
              const patientName = selectedPatient?.User?.full_name || selectedPatient?.User?.email || "Unknown";
              
              // Get patient's appointment history
              const patientAppointments = appointments
                .filter(a => a.patient_id === prescForm.patient_id && a.status === "completed")
                .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
              const lastAppointment = patientAppointments.length > 0 ? patientAppointments[0] : null;
              
              // Get patient's prescription history
              const patientPrescriptions = prescriptions
                .filter(p => p.patient_id === prescForm.patient_id)
                .sort((a, b) => new Date(b.issued_at) - new Date(a.issued_at));
              const lastPrescription = patientPrescriptions.length > 0 ? patientPrescriptions[0] : null;
              
              return (
                <div style={{ ...styles.patientBadge, borderLeft: `4px solid ${isPaymentDone ? "#3498db" : "#e74c3c"}` }}>
                  <div style={styles.patientBadgeLeft}>
                    <div style={styles.patientAvatar}>👤</div>
                    <div style={styles.patientBasic}>
                      <div style={styles.patientName}>{patientName}</div>
                      <div style={styles.patientMeta}>{selectedPatient?.User?.email || "N/A"}</div>
                      <div style={styles.patientMeta}>{selectedPatient?.dob || "N/A"}</div>
                      <div style={styles.patientMeta}>{selectedPatient?.User?.phone || ""}</div>
                    </div>
                  </div>

                  <div style={styles.patientBadgeRight}>
                    <div style={styles.patientStatusRow}>
                      <div style={styles.patientStatusText}><strong>Payment Status:</strong> {isPaymentDone ? "✅ Paid" : "⚠️ Not Paid"}</div>
                      <div style={{ ...styles.patientFlag, color: isPaymentDone ? "#155724" : "#856404" }}>{isPaymentDone ? "All clear" : "Payment required"}</div>
                    </div>

                    <div style={styles.patientHistoryRow}>
                      {lastAppointment ? (
                        <div style={styles.patientHistoryItem}>📅 Last Appointment: {new Date(lastAppointment.start_time).toLocaleDateString()}</div>
                      ) : (
                        <div style={styles.patientHistoryEmpty}>No past appointments</div>
                      )}

                      {lastPrescription ? (
                        <div style={styles.patientHistoryItem}>💊 Last Prescription: {new Date(lastPrescription.issued_at).toLocaleDateString()}</div>
                      ) : (
                        <div style={styles.patientHistoryEmpty}>No previous prescriptions</div>
                      )}
                    </div>

                    <div style={styles.patientWriteDate}>✍️ Writing Prescription: {new Date().toLocaleDateString()}</div>

                    {!isPaymentDone && patientBills.length > 0 && (
                      <div style={styles.patientWarning}>⚠️ Patient must complete payment before prescription can be sent.</div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Appointment/Serial Selection */}
            {prescForm.patient_id && (() => {
              const patientAppointments = appointments.filter(a => a.patient_id === prescForm.patient_id);
              
              return (
                <div style={{ marginBottom: "0.75rem" }}>
                  <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.25rem", fontSize: "14px" }}>
                    📅 Select Appointment/Serial (Optional)
                  </label>
                  <select
                    value={prescForm.appointment_id || ""}
                    onChange={(e) => {
                      const apt = appointments.find(a => a.appointment_id === e.target.value);
                      setPrescForm({
                        ...prescForm,
                        appointment_id: e.target.value,
                        // Optional: auto-fill advice with appointment notes
                        advice: apt?.notes ? `${prescForm.advice} (From appointment: ${apt.notes})` : prescForm.advice,
                      });
                    }}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      fontSize: "14px",
                    }}
                  >
                    <option value="">Not linked to appointment</option>
                    {patientAppointments.map((apt) => (
                      <option key={apt.appointment_id} value={apt.appointment_id}>
                        {new Date(apt.start_time).toLocaleDateString()} at {new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {apt.status}
                      </option>
                    ))}
                  </select>
                  
                  {prescForm.appointment_id && (() => {
                    const selectedApt = appointments.find(a => a.appointment_id === prescForm.appointment_id);
                    const aptBills = bills.filter(b => b.appointment_id === prescForm.appointment_id);
                    const aptBillPaid = aptBills.length > 0 ? aptBills[0].payment_status === "paid" : false;
                    
                    return (
                      <div style={{
                        marginTop: "0.5rem",
                        padding: "0.5rem",
                        backgroundColor: aptBillPaid ? "#d4edda" : "#f8d7da",
                        borderRadius: "4px",
                        fontSize: "12px",
                        color: aptBillPaid ? "#155724" : "#721c24",
                      }}>
                        {aptBillPaid ? "✅ Bill Paid" : "⚠️ Bill Not Paid"} - This serial on {new Date(selectedApt.start_time).toLocaleDateString()}
                      </div>
                    );
                  })()}
                </div>
              );
            })()}

            {/* Multiple Medications */}
            <div style={{ marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label style={{ fontWeight: "bold", fontSize: "14px" }}>💊 Medications *</label>
                <button
                  onClick={() => {
                    setPrescForm({
                      ...prescForm,
                      medications: [
                        ...prescForm.medications,
                        { medication_name: "", dosage: "", frequency: "", notes: "" }
                      ]
                    });
                  }}
                  style={{
                    padding: "0.25rem 0.75rem",
                    fontSize: "12px",
                    backgroundColor: "#27ae60",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  + Add Medicine
                </button>
              </div>

              {prescForm.medications.map((med, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: "#f9f9f9",
                    padding: "0.75rem",
                    borderRadius: "4px",
                    marginBottom: "0.5rem",
                    border: "1px solid #e0e0e0",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <strong style={{ fontSize: "13px" }}>Medicine #{idx + 1}</strong>
                    {prescForm.medications.length > 1 && (
                      <button
                        onClick={() => {
                          setPrescForm({
                            ...prescForm,
                            medications: prescForm.medications.filter((_, i) => i !== idx)
                          });
                        }}
                        style={{
                          padding: "0.25rem 0.5rem",
                          fontSize: "12px",
                          backgroundColor: "#e74c3c",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Medication name *"
                    value={med.medication_name}
                    onChange={(e) => {
                      const newMeds = [...prescForm.medications];
                      newMeds[idx].medication_name = e.target.value;
                      setPrescForm({ ...prescForm, medications: newMeds });
                    }}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      marginBottom: "0.5rem",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      fontSize: "12px",
                    }}
                  />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <input
                      type="text"
                      placeholder="Dosage"
                      value={med.dosage}
                      onChange={(e) => {
                        const newMeds = [...prescForm.medications];
                        newMeds[idx].dosage = e.target.value;
                        setPrescForm({ ...prescForm, medications: newMeds });
                      }}
                      style={{
                        padding: "0.5rem",
                        borderRadius: "4px",
                        border: "1px solid #ddd",
                        fontSize: "12px",
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Frequency"
                      value={med.frequency}
                      onChange={(e) => {
                        const newMeds = [...prescForm.medications];
                        newMeds[idx].frequency = e.target.value;
                        setPrescForm({ ...prescForm, medications: newMeds });
                      }}
                      style={{
                        padding: "0.5rem",
                        borderRadius: "4px",
                        border: "1px solid #ddd",
                        fontSize: "12px",
                      }}
                    />
                  </div>

                  <textarea
                    placeholder="Additional notes (optional)"
                    value={med.notes}
                    onChange={(e) => {
                      const newMeds = [...prescForm.medications];
                      newMeds[idx].notes = e.target.value;
                      setPrescForm({ ...prescForm, medications: newMeds });
                    }}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      minHeight: "40px",
                      fontSize: "12px",
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Advice / Instructions */}
            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.25rem", fontSize: "14px" }}>
                Advice / Instructions
              </label>
              <textarea
                value={prescForm.advice}
                onChange={(e) => setPrescForm({ ...prescForm, advice: e.target.value })}
                placeholder="e.g., Take with food, avoid dairy products, follow up in 2 weeks"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                  minHeight: "60px",
                  fontSize: "14px",
                }}
              />
            </div>

            {/* Send PDF Option */}
            <div style={{ marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                type="checkbox"
                id="send_pdf"
                checked={prescForm.send_pdf}
                onChange={(e) => setPrescForm({ ...prescForm, send_pdf: e.target.checked })}
                style={{ cursor: "pointer" }}
              />
              <label htmlFor="send_pdf" style={{ cursor: "pointer", fontSize: "14px" }}>
                📄 Send PDF to patient
              </label>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowPrescModal(false)}
                disabled={prescLoading}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#999",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: prescLoading ? "not-allowed" : "pointer",
                  opacity: prescLoading ? 0.6 : 1,
                  fontSize: "14px",
                }}
              >
                Cancel
              </button>
              <button
                onClick={createPrescription}
                disabled={prescLoading || !prescForm.patient_id || !prescForm.medications?.some(m => m?.medication_name?.trim())}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#3498db",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor:
                    prescLoading || !prescForm.patient_id || !prescForm.medications?.some(m => m?.medication_name?.trim())
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    prescLoading || !prescForm.patient_id || !prescForm.medications?.some(m => m?.medication_name?.trim())
                      ? 0.6
                      : 1,
                  fontWeight: "bold",
                  fontSize: "14px",
                }}
              >
                {prescLoading ? "Sending..." : "💊 Send Prescription"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Health Status Modal */}
      {showHealthModal && (
        <div style={modalStyles.overlay}>
          <div style={{ ...modalStyles.modal, maxWidth: "700px", borderRadius: "16px", boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)" }}>
            <div style={{
              background: "linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)",
              color: "white",
              padding: "1.5rem",
              borderRadius: "16px 16px 0 0",
              margin: "-1rem -1.25rem 1.5rem -1.25rem"
            }}>
              <h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.5rem" }}>🏥</span>
                {selectedPatient ? `Update Health Status` : "Record New Health Status"}
              </h3>
              <p style={{ margin: "0.5rem 0 0 0", opacity: 0.9, fontSize: "0.95rem" }}>
                {selectedPatient ? `Recording vital signs for ${selectedPatient.User?.full_name}` : "Select a patient and record their vital signs"}
              </p>
            </div>

            {/* Patient Selection (only show if no patient selected) */}
            {!selectedPatient && (
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{
                  display: "block",
                  fontWeight: "600",
                  marginBottom: "0.75rem",
                  color: "#2c3e50",
                  fontSize: "1rem"
                }}>
                  👤 Select Patient
                </label>
                <select
                  value={selectedPatient?.patient_id || ""}
                  onChange={(e) => {
                    const patient = patients.find(p => p.patient_id === e.target.value);
                    setSelectedPatient(patient);
                    setError("");
                  }}
                  style={{
                    width: "100%",
                    padding: "0.875rem",
                    borderRadius: "8px",
                    border: "2px solid #e1e8ed",
                    fontSize: "1rem",
                    backgroundColor: "white",
                    transition: "border-color 0.2s ease",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#3498db"}
                  onBlur={(e) => e.target.style.borderColor = "#e1e8ed"}
                >
                  <option value="">Choose a patient from your list</option>
                  {patients.map((patient) => (
                    <option key={patient.patient_id} value={patient.patient_id}>
                      {patient.User?.full_name} - {patient.User?.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Patient Info Display */}
            {selectedPatient && (
              <div style={{
                background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                padding: "1.25rem",
                borderRadius: "12px",
                marginBottom: "1.5rem",
                border: "1px solid #dee2e6",
                display: "flex",
                alignItems: "center",
                gap: "1rem"
              }}>
                <div style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #3498db 0%, #2980b9 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                  color: "white",
                  boxShadow: "0 4px 12px rgba(52, 152, 219, 0.3)"
                }}>
                  👤
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{
                    margin: "0 0 0.5rem 0",
                    color: "#2c3e50",
                    fontSize: "1.1rem",
                    fontWeight: "600"
                  }}>
                    {selectedPatient.User?.full_name}
                  </h4>
                  <div style={{
                    display: "flex",
                    gap: "1rem",
                    fontSize: "0.9rem",
                    color: "#7f8c8d"
                  }}>
                    <span>📧 {selectedPatient.User?.email}</span>
                    <span>📅 {selectedPatient.dob}</span>
                    <span>⚧ {selectedPatient.gender}</span>
                    <span>🩸 {selectedPatient.blood_type}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Vital Signs Form */}
            <div style={{
              backgroundColor: "#f8f9fa",
              padding: "1.5rem",
              borderRadius: "12px",
              marginBottom: "1.5rem",
              border: "1px solid #e9ecef"
            }}>
              <h4 style={{
                margin: "0 0 1rem 0",
                color: "#2c3e50",
                fontSize: "1.1rem",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}>
                <span>💓</span>
                Vital Signs
              </h4>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
                {/* Blood Pressure */}
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>
                    Blood Pressure <span style={{ color: "#e74c3c" }}>*</span>
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <input
                      type="number"
                      placeholder="Systolic"
                      value={healthForm.systolic_bp}
                      onChange={(e) => setHealthForm({ ...healthForm, systolic_bp: e.target.value })}
                      style={styles.inputField}
                    />
                    <span style={{ fontSize: "1.2rem", color: "#7f8c8d", fontWeight: "600" }}>/</span>
                    <input
                      type="number"
                      placeholder="Diastolic"
                      value={healthForm.diastolic_bp}
                      onChange={(e) => setHealthForm({ ...healthForm, diastolic_bp: e.target.value })}
                      style={styles.inputField}
                    />
                    <span style={{ fontSize: "0.9rem", color: "#7f8c8d", marginLeft: "0.25rem" }}>mmHg</span>
                  </div>
                </div>

                {/* Heart Rate */}
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>
                    Heart Rate <span style={{ color: "#e74c3c" }}>*</span>
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="number"
                      placeholder="72"
                      value={healthForm.heart_rate}
                      onChange={(e) => setHealthForm({ ...healthForm, heart_rate: e.target.value })}
                      style={styles.inputField}
                    />
                    <span style={{ fontSize: "0.9rem", color: "#7f8c8d" }}>bpm</span>
                  </div>
                </div>

                {/* Temperature */}
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Temperature</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="98.6"
                      value={healthForm.temperature}
                      onChange={(e) => setHealthForm({ ...healthForm, temperature: e.target.value })}
                      style={styles.inputField}
                    />
                    <span style={{ fontSize: "0.9rem", color: "#7f8c8d" }}>°F</span>
                  </div>
                </div>

                {/* Weight */}
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Weight</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="70.5"
                      value={healthForm.weight_kg}
                      onChange={(e) => setHealthForm({ ...healthForm, weight_kg: e.target.value })}
                      style={styles.inputField}
                    />
                    <span style={{ fontSize: "0.9rem", color: "#7f8c8d" }}>kg</span>
                  </div>
                </div>

                {/* Height */}
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Height</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="170.5"
                      value={healthForm.height_cm}
                      onChange={(e) => setHealthForm({ ...healthForm, height_cm: e.target.value })}
                      style={styles.inputField}
                    />
                    <span style={{ fontSize: "0.9rem", color: "#7f8c8d" }}>cm</span>
                  </div>
                </div>

                {/* BMI Display */}
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>BMI (Auto-calculated)</label>
                  <div style={{
                    padding: "0.875rem",
                    borderRadius: "8px",
                    backgroundColor: healthForm.weight_kg && healthForm.height_cm ? "#e8f5e8" : "#f8f9fa",
                    border: `2px solid ${healthForm.weight_kg && healthForm.height_cm ? "#27ae60" : "#e1e8ed"}`,
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: healthForm.weight_kg && healthForm.height_cm ? "#27ae60" : "#7f8c8d",
                    textAlign: "center"
                  }}>
                    {healthForm.weight_kg && healthForm.height_cm
                      ? (parseFloat(healthForm.weight_kg) / Math.pow(parseFloat(healthForm.height_cm) / 100, 2)).toFixed(1)
                      : "Enter weight & height"
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "0.75rem",
                color: "#2c3e50",
                fontSize: "1rem"
              }}>
                📝 Clinical Notes & Observations
              </label>
              <textarea
                value={healthForm.notes}
                onChange={(e) => setHealthForm({ ...healthForm, notes: e.target.value })}
                placeholder="Add any clinical observations, symptoms, recommendations, or follow-up notes..."
                style={{
                  width: "100%",
                  padding: "1rem",
                  borderRadius: "8px",
                  border: "2px solid #e1e8ed",
                  minHeight: "100px",
                  fontSize: "1rem",
                  fontFamily: "Arial, sans-serif",
                  resize: "vertical",
                  transition: "border-color 0.2s ease",
                }}
                onFocus={(e) => e.target.style.borderColor = "#3498db"}
                onBlur={(e) => e.target.style.borderColor = "#e1e8ed"}
              />
            </div>

            {/* Action Buttons */}
            <div style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "flex-end",
              paddingTop: "1rem",
              borderTop: "1px solid #e9ecef"
            }}>
              <button
                onClick={() => {
                  setShowHealthModal(false);
                  setSelectedPatient(null);
                  setHealthForm({
                    systolic_bp: "",
                    diastolic_bp: "",
                    heart_rate: "",
                    temperature: "",
                    weight_kg: "",
                    height_cm: "",
                    notes: "",
                  });
                }}
                disabled={healthLoading}
                style={{
                  padding: "0.875rem 1.5rem",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: healthLoading ? "not-allowed" : "pointer",
                  opacity: healthLoading ? 0.6 : 1,
                  fontSize: "1rem",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => !healthLoading && (e.target.style.backgroundColor = "#5a6268")}
                onMouseOut={(e) => !healthLoading && (e.target.style.backgroundColor = "#6c757d")}
              >
                Cancel
              </button>
              <button
                onClick={recordHealthStatus}
                disabled={healthLoading || !selectedPatient || !healthForm.systolic_bp || !healthForm.diastolic_bp || !healthForm.heart_rate}
                style={{
                  padding: "0.875rem 1.5rem",
                  background: "linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: healthLoading || !selectedPatient || !healthForm.systolic_bp || !healthForm.diastolic_bp || !healthForm.heart_rate ? "not-allowed" : "pointer",
                  opacity: healthLoading || !selectedPatient || !healthForm.systolic_bp || !healthForm.diastolic_bp || !healthForm.heart_rate ? 0.6 : 1,
                  fontWeight: "600",
                  fontSize: "1rem",
                  boxShadow: "0 4px 15px rgba(39, 174, 96, 0.3)",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
                onMouseOver={(e) => !healthLoading && !((!selectedPatient || !healthForm.systolic_bp || !healthForm.diastolic_bp || !healthForm.heart_rate)) && (e.target.style.transform = "translateY(-2px)")}
                onMouseOut={(e) => !healthLoading && (e.target.style.transform = "translateY(0)")}
              >
                <span style={{ fontSize: "1.1rem" }}>🏥</span>
                {healthLoading ? "Recording..." : "Record Health Status"}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Bills Tab */}
      {activeTab === "bills" && (
        <BillsSection 
          bills={bills}
          styles={styles}
          onPaymentProcess={fetchDoctorData}
        />
      )}

      {/* Lab Results Tab */}
      {activeTab === "lab-results" && (
        <DocLabResultsSection />
      )}

      {/* Order Lab Test Tab */}
      {activeTab === "order-lab" && (
        <LabTestOrderSection />
      )}

      {/* Refresh Button */}
      <button onClick={fetchDoctorData} style={styles.refreshBtn}>
        🔄 Refresh Data
      </button>
    </div>
  );
};

// Component: Stat Card
const StatCard = ({ icon, label, value, color }) => (
  <div style={{ ...styles.card, borderLeft: `5px solid ${color}` }}>
    <p style={{ fontSize: "2rem", margin: "0 0 0.5rem 0" }}>{icon}</p>
    <p style={styles.cardLabel}>{label}</p>
    <p style={styles.cardValue}>{value}</p>
  </div>
);

// Component: Appointment Card
const AppointmentCard = ({ appointment, detailed, onComplete, onPrescribe, isCompleting, bills = [] }) => {
  // Check patient's bill payment status
  const patientBills = bills.filter(b => b.patient_id === appointment.patient_id);
  const paidBill = patientBills.find(b => b.payment_status === "paid");
  const unpaidBill = patientBills.find(b => b.payment_status !== "paid");
  const isPaymentDone = paidBill && !unpaidBill;
  
  return (
    <div style={styles.itemCard}>
      <div style={styles.itemHeader}>
        <div>
          <h3 style={styles.itemTitle}>
            {appointment.Patient?.User?.full_name || "Patient"}
          </h3>
          <p style={styles.itemMeta}>
            📅 {new Date(appointment.start_time).toLocaleDateString()} at{" "}
            {new Date(appointment.start_time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          {/* Show payment status */}
          {patientBills.length > 0 && (
            <p style={{
              ...styles.itemMeta,
              color: isPaymentDone ? "#27ae60" : "#e74c3c",
              fontWeight: "bold",
              marginTop: "0.25rem",
            }}>
              {isPaymentDone ? "✅ Payment Complete" : "⚠️ Payment Pending"}
            </p>
          )}
        </div>
        <span
          style={{
            ...styles.badge,
            backgroundColor:
              appointment.status === "completed"
                ? "#2ecc71"
                : appointment.status === "scheduled"
                ? "#3498db"
                : "#e74c3c",
          }}
        >
          {appointment.status}
        </span>
      </div>
      {(detailed || appointment.notes) && (
        <p style={styles.itemDescription}>{appointment.notes || "No notes"}</p>
      )}
      {detailed && appointment.status !== "completed" && (
        <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => onComplete && onComplete(appointment.appointment_id)}
            disabled={isCompleting}
            style={{
              flex: 1,
              padding: "0.5rem 1rem",
              backgroundColor: "#27ae60",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isCompleting ? "not-allowed" : "pointer",
              opacity: isCompleting ? 0.6 : 1,
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            {isCompleting ? "Completing..." : "✅ Complete"}
          </button>
          <button
            onClick={() => onPrescribe && onPrescribe()}
            disabled={isCompleting || !isPaymentDone}
            title={!isPaymentDone ? "Patient must complete payment first" : ""}
            style={{
              flex: 1,
              padding: "0.5rem 1rem",
              backgroundColor: isPaymentDone ? "#3498db" : "#999",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: isCompleting || !isPaymentDone ? "not-allowed" : "pointer",
              opacity: isCompleting || !isPaymentDone ? 0.5 : 1,
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            Send Prescription {!isPaymentDone && "- Awaiting Payment"}
          </button>
        </div>
      )}
    </div>
  );
};

// Component: Prescription Card
const PrescriptionCard = ({ prescription }) => {
  const isActive = prescription.issued_at && new Date(prescription.issued_at) > new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);
  const patientName = prescription.patient_snapshot?.name || prescription.Patient?.User?.full_name || "Patient";
  const medications = Array.isArray(prescription.medications) ? prescription.medications : [];

  return (
    <div style={styles.itemCard}>
      <div style={styles.itemHeader}>
        <div>
          <h3 style={styles.itemTitle}>
            📝 {patientName}
          </h3>
          <p style={styles.itemMeta}>
            {prescription.patient_snapshot?.email || prescription.Patient?.User?.email || "N/A"}
          </p>
          
          {/* Medications List */}
          {medications.length > 0 && (
            <div style={{ marginTop: "0.5rem" }}>
              <strong style={{ fontSize: "12px" }}>💊 Medications:</strong>
              {medications.map((med, idx) => (
                <div key={idx} style={{ fontSize: "12px", marginLeft: "0.5rem", marginTop: "0.25rem" }}>
                  • {med.medication_name || med.name} - {med.dosage} {med.frequency && `| ${med.frequency}`}
                </div>
              ))}
            </div>
          )}

          {/* Advice */}
          {prescription.advice && (
            <p style={{ ...styles.itemMeta, marginTop: "0.5rem" }}>
              <strong>📋 Advice:</strong> {prescription.advice}
            </p>
          )}

          <p style={{ ...styles.itemMeta, marginTop: "0.5rem", fontSize: "12px" }}>
            Issued: {new Date(prescription.issued_at).toLocaleDateString()}
          </p>
        </div>
        <span
          style={{
            ...styles.badge,
            backgroundColor: isActive ? "#2ecc71" : "#95a5a6",
          }}
        >
          {isActive ? "Active" : "Past"}
        </span>
      </div>
    </div>
  );
};

// Component: Action Button
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
    backgroundColor: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1200,
    padding: "1rem",
  },
  modal: {
    width: "100%",
    maxWidth: 720,
    backgroundColor: "white",
    borderRadius: 8,
    padding: "1rem 1.25rem",
    boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
    maxHeight: "90vh",
    overflowY: "auto",
  },
};

const styles = {
  container: {
    padding: "2rem",
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  logoutBtn: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  errorBox: {
    backgroundColor: "#ffe6e6",
    color: "#c0392b",
    padding: "1rem",
    borderRadius: "4px",
    marginBottom: "1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tabNav: {
    display: "flex",
    gap: "1rem",
    marginBottom: "2rem",
    borderBottom: "2px solid #ecf0f1",
  },
  tabBtn: {
    padding: "1rem 1.5rem",
    backgroundColor: "transparent",
    border: "none",
    color: "#666",
    cursor: "pointer",
    fontSize: "1rem",
    borderBottom: "3px solid transparent",
    transition: "all 0.3s",
  },
  activeTab: {
    color: "#3498db",
    borderBottomColor: "#3498db",
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
    marginBottom: "2rem",
  },
  card: {
    backgroundColor: "white",
    padding: "1.5rem",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  cardLabel: {
    fontSize: "0.9rem",
    color: "#666",
    margin: "0",
  },
  cardValue: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#333",
    margin: "0.5rem 0 0 0",
  },
  section: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "8px",
    marginBottom: "2rem",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  itemCard: {
    backgroundColor: "#f9f9f9",
    padding: "1.5rem",
    borderRadius: "6px",
    marginBottom: "1rem",
    borderLeft: "4px solid #3498db",
  },
  itemHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1rem",
  },
  itemTitle: {
    margin: "0 0 0.5rem 0",
    color: "#333",
    fontSize: "1.1rem",
  },
  itemMeta: {
    margin: "0.25rem 0",
    color: "#666",
    fontSize: "0.9rem",
  },
  itemDescription: {
    color: "#555",
    fontSize: "0.95rem",
    marginTop: "0.5rem",
  },
  badge: {
    padding: "0.5rem 1rem",
    borderRadius: "20px",
    color: "white",
    fontSize: "0.85rem",
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "1rem",
  },
  actionBtn: {
    padding: "1.5rem",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "1rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    transition: "transform 0.2s",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "1rem",
  },
  th: {
    textAlign: "left",
    padding: "0.75rem",
    borderBottom: "2px solid #eee",
    color: "#333",
    fontSize: "0.95rem",
    backgroundColor: "#fafafa",
  },
  td: {
    padding: "0.75rem",
    borderBottom: "1px solid #f2f2f2",
    verticalAlign: "top",
    fontSize: "0.95rem",
    color: "#444",
  },
  tr: {
    backgroundColor: "transparent",
  },
  refreshBtn: {
    padding: "0.75rem 1.5rem",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1rem",
  },
  emptyState: {
    textAlign: "center",
    color: "#999",
    padding: "2rem",
    fontSize: "1.1rem",
  },
  patientBadge: {
    backgroundColor: "#fff",
    padding: "0.75rem",
    borderRadius: "8px",
    marginBottom: "0.75rem",
    fontSize: "13px",
    display: "flex",
    gap: "1rem",
    alignItems: "flex-start",
  },
  patientBadgeLeft: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
    flex: "0 0 260px",
  },
  patientAvatar: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #e0e0e0",
    fontSize: "1.25rem",
  },
  patientBasic: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  patientName: { fontWeight: "bold", fontSize: "14px" },
  patientMeta: { color: "#666", fontSize: "12px", wordBreak: "break-word" },
  patientBadgeRight: { flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" },
  patientStatusRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  patientStatusText: { fontSize: "13px" },
  patientFlag: { fontSize: "12px", fontWeight: 600 },
  patientHistoryRow: { display: "flex", gap: "1rem", flexWrap: "wrap" },
  patientHistoryItem: { backgroundColor: "#fff", padding: "0.4rem 0.6rem", borderRadius: 6, border: "1px solid #f0f0f0", fontSize: "12px" },
  patientHistoryEmpty: { color: "#999", fontSize: "12px" },
  patientWriteDate: { marginTop: "0.25rem", fontSize: "12px", color: "#444" },
  patientWarning: { marginTop: "0.5rem", color: "#856404", fontSize: "13px" },
  healthMetric: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.75rem",
    backgroundColor: "#f8f9fa",
    borderRadius: "8px",
    border: "1px solid #e9ecef",
  },
  metricIcon: {
    fontSize: "1.5rem",
  },
  metricValue: {
    fontSize: "1.2rem",
    fontWeight: "bold",
    color: "#333",
  },
  metricLabel: {
    fontSize: "0.85rem",
    color: "#666",
    marginTop: "0.25rem",
  },
};

export default DoctorDashboard;

// Small component to update doctor's image via image URL
const DoctorImageUpdater = ({ doctorId, onSaved }) => {
  const [url, setUrl] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  if (!doctorId) return null;

  const save = async () => {
    setLoading(true);
    setMsg("");
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const headers = getAuthHeaders();
      const resp = await fetch(`${API_BASE}/api/doctors/${doctorId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ image_url: url }),
      });
      const data = await resp.json();
      if (resp.ok) {
        setMsg("Saved");
        onSaved?.();
      } else {
        setMsg(data.message || "Failed to save");
      }
    } catch (e) {
      setMsg(e.message || "Error saving");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      <input placeholder="Paste image URL" value={url} onChange={(e) => setUrl(e.target.value)} style={{ width: 260, padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
      <button onClick={save} disabled={loading} style={{ marginLeft: 8, padding: '8px 12px', borderRadius: 6, backgroundColor: '#3498db', color: 'white', border: 'none' }}>{loading ? 'Saving...' : 'Save'}</button>
      {msg && <div style={{ marginTop: 6, color: msg === 'Saved' ? 'green' : 'red' }}>{msg}</div>}
    </div>
  );
};
