import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthHeaders, clearAuth } from "../../utils/auth";
import LabResultsSection from "./components/LabResultsSection";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [appointmentStats, setAppointmentStats] = useState(null);
  const [doctorPerformance, setDoctorPerformance] = useState([]);
  const [revenueStats, setRevenueStats] = useState(null);
  const [prescriptionStats, setPrescriptionStats] = useState(null);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [addDocForm, setAddDocForm] = useState({ full_name: "", email: "", specialty: "", password: "" });
  const [addingDoc, setAddingDoc] = useState(false);
  const [addDocMsg, setAddDocMsg] = useState("");
  const [departments, setDepartments] = useState([]);
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptDesc, setNewDeptDesc] = useState("");
  const [deptMode, setDeptMode] = useState("select");
  const [showPassword, setShowPassword] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [editDeptForm, setEditDeptForm] = useState({ name: "", description: "" });
  const [adminDoctors, setAdminDoctors] = useState([]);
  const [billPaymentForm, setBillPaymentForm] = useState({
    paid_amount: 0,
    payment_status: "unpaid",
    payment_method: "",
  });

  // load departments for admin form - remove duplicates
  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    fetch(`${API_BASE}/api/public/departments`)
      .then(r => r.json())
      .then(j => {
        let data = j.data || [];
        
        // Aggressive deduplication: use both ID and name
        const uniqueMap = new Map();
        
        for (const dept of data) {
          // Use only department_id as unique key - simpler and more reliable
          if (!uniqueMap.has(dept.department_id)) {
            uniqueMap.set(dept.department_id, dept);
          }
        }
        
        const uniqueDepts = Array.from(uniqueMap.values());
        
        setDepartments(uniqueDepts);
      })
      .catch(() => {
        setDepartments([]);
      });
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const headers = getAuthHeaders();

      // If there is no Authorization header, user is not authenticated
      if (!headers.Authorization) {
        clearAuth();
        navigate('/login', { state: { message: 'Please sign in.' } });
        return;
      }

      // Define endpoints to call
      const endpoints = [
        "/api/analytics/dashboard",
        "/api/analytics/appointments/stats",
        "/api/analytics/doctors/performance",
        "/api/analytics/revenue",
        "/api/analytics/prescriptions/stats",
      ];

      // Fire requests in parallel
      const fetchPromises = endpoints.map((ep) => {
        const url = `${API_BASE}${ep}`;
        return fetch(url, { headers });
      });

      const responses = await Promise.all(fetchPromises);

      // If any unauthorized, clear and redirect
      if (responses.some((r) => r.status === 401)) {
        clearAuth();
        navigate('/login', { state: { message: 'Session expired — please sign in as admin.' } });
        return;
      }

      // Parse each response robustly
      const parsed = [];
      for (let i = 0; i < responses.length; i++) {
        const res = responses[i];
        const text = await res.text();

        if (!res.ok) {
          const msg = `Analytics endpoint ${endpoints[i]} failed: ${res.status} ${text}`;
          throw new Error(msg);
        }

        // Try parse JSON, fallback to raw text
        try {
          parsed.push(JSON.parse(text));
        } catch (error) { // eslint-disable-line no-unused-vars
          parsed.push({ data: text });
        }
      }

      const [dashData, , doctorData, revenueData, prescData] = parsed;

      setStats(dashData.data?.overview || {});
      setAppointmentStats(dashData.data?.appointmentStats || {});
      setDoctorPerformance((doctorData && doctorData.data) || []);
      setRevenueStats((revenueData && revenueData.data) || {});
      setPrescriptionStats((prescData && prescData.data) || {});

      // Fetch bills
      try {
        const billsResp = await fetch(`${API_BASE}/api/bills`, { headers });
        if (billsResp.ok) {
          const billsData = await billsResp.json();
          setBills(billsData.data || []);
        }
      } catch (error) { // eslint-disable-line no-unused-vars
        // Failed to fetch bills
      }
    } catch (err) {
      setError(err.message || "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const openBillModal = (bill) => {
    setSelectedBill(bill);
    setBillPaymentForm({
      paid_amount: bill.paid_amount || 0,
      payment_status: bill.payment_status || "unpaid",
      payment_method: bill.payment_method || "",
    });
    setShowBillModal(true);
  };

  const updateBillPayment = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const headers = getAuthHeaders();
      
      const resp = await fetch(`${API_BASE}/api/bills/${selectedBill.bill_id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          ...billPaymentForm,
          payment_date: new Date(),
        }),
      });

      if (resp.ok) {
        setShowBillModal(false);
        fetchAnalytics();
      } else {
        const data = await resp.json();
        setError(data.message || "Failed to update bill");
      }
    } catch (err) {
      setError(err.message || "Error updating bill");
    }
  };

  if (loading) {
    return <div style={styles.container}><p>Loading analytics...</p></div>;
  }

  if (error) {
    return (
      <div style={styles.container}>
        <p style={{ color: "red" }}>Error: {error}</p>
        <button onClick={fetchAnalytics}>Retry</button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>📊 Admin Dashboard</h1>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={() => navigate("/admin/profile")}
            style={{
              padding: "0.6rem 1.2rem",
              backgroundColor: "#2196f3",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: "bold",
            }}
          >
            ⚙️ Settings
          </button>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", borderBottom: "2px solid #e0e0e0", flexWrap: "wrap" }}>
        <button
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: activeTab === "overview" ? "#3498db" : "#f0f0f0",
            color: activeTab === "overview" ? "white" : "#333",
            border: "none",
            borderRadius: "6px 6px 0 0",
            cursor: "pointer",
            fontSize: "0.95rem",
            fontWeight: "600",
            transition: "all 0.3s ease",
          }}
          onClick={() => setActiveTab("overview")}
        >
          📊 Overview
        </button>

        <button
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: activeTab === "lab-results" ? "#3498db" : "#f0f0f0",
            color: activeTab === "lab-results" ? "white" : "#333",
            border: "none",
            borderRadius: "6px 6px 0 0",
            cursor: "pointer",
            fontSize: "0.95rem",
            fontWeight: "600",
            transition: "all 0.3s ease",
          }}
          onClick={() => setActiveTab("lab-results")}
        >
          🔬 Lab Results
        </button>

      </div>

      {/* Overview Tab Content */}
      {activeTab === "overview" && (
        <>
      {/* Overview Cards */}
      <div style={styles.cardsGrid}>
        <StatCard label="Total Users" value={stats?.totalUsers || 0} color="#3498db" />
        <StatCard label="Total Doctors" value={stats?.totalDoctors || 0} color="#2ecc71" />
        <StatCard label="Total Patients" value={stats?.totalPatients || 0} color="#e74c3c" />
        <StatCard label="Total Appointments" value={stats?.totalAppointments || 0} color="#f39c12" />
        <StatCard label="Total Revenue" value={`$${Number(stats?.totalRevenue || 0).toFixed(2)}`} color="#9b59b6" />
        <StatCard label="Avg Rating" value={Number(stats?.averageRating || 0).toFixed(1)} color="#1abc9c" icon="⭐" />
      </div>

      {/* Add Doctor Form (Admin) - Modern Card Design */}
      <div style={{ ...styles.section, marginTop: 16, background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e0e0e0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '2px solid #f0f0f0' }}>
          <div style={{ fontSize: '2.5rem' }}>👨‍⚕️</div>
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 4, color: '#333', fontSize: '1.8rem' }}>Create New Doctor Account</h2>
            <p style={{ color: '#666', margin: 0, fontSize: '0.95rem' }}>Add a new doctor to your healthcare system</p>
          </div>
        </div>

        {addDocMsg && (
          <div style={{
            marginBottom: 20,
            padding: 14,
            backgroundColor: addDocMsg.startsWith('✅') ? '#d4edda' : '#f8d7da',
            border: `2px solid ${addDocMsg.startsWith('✅') ? '#28a745' : '#dc3545'}`,
            borderRadius: 8,
            color: addDocMsg.startsWith('✅') ? '#155724' : '#721c24',
            fontSize: '1rem',
            fontWeight: '500'
          }}>
            {addDocMsg}
          </div>
        )}

        {/* Form Grid - Better organized */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {/* Full Name */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ color: '#333', fontSize: '0.95rem', fontWeight: '600', marginBottom: 8, display: 'flex', alignItems: 'center' }}>
              👤 Full Name <span style={{ color: '#ff4444', marginLeft: 4 }}>*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Dr. Ahmed Hassan"
              value={addDocForm.full_name}
              onChange={(e) => setAddDocForm({...addDocForm, full_name: e.target.value})}
              style={{
                padding: 14,
                fontSize: '1rem',
                border: '2px solid #e0e0e0',
                borderRadius: 10,
                backgroundColor: '#fafafa',
                transition: 'all 0.3s',
                outline: 'none',
                fontFamily: 'inherit',
                ':focus': { borderColor: '#667eea', backgroundColor: '#fff' }
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ color: '#333', fontSize: '0.95rem', fontWeight: '600', marginBottom: 8, display: 'flex', alignItems: 'center' }}>
              📧 Email <span style={{ color: '#ff4444', marginLeft: 4 }}>*</span>
            </label>
            <input
              type="email"
              placeholder="e.g., doctor@hospital.com"
              value={addDocForm.email}
              onChange={(e) => setAddDocForm({...addDocForm, email: e.target.value})}
              style={{
                padding: 14,
                fontSize: '1rem',
                border: '2px solid #e0e0e0',
                borderRadius: 10,
                backgroundColor: '#fafafa',
                transition: 'all 0.3s',
                outline: 'none',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          {/* Specialty */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ color: '#333', fontSize: '0.95rem', fontWeight: '600', marginBottom: 8, display: 'flex', alignItems: 'center' }}>
              🏥 Specialty
            </label>
            <input
              type="text"
              placeholder="e.g., Cardiology, Neurology, Pediatrics"
              value={addDocForm.specialty}
              onChange={(e) => setAddDocForm({...addDocForm, specialty: e.target.value})}
              style={{
                padding: 14,
                fontSize: '1rem',
                border: '2px solid #e0e0e0',
                borderRadius: 10,
                backgroundColor: '#fafafa',
                transition: 'all 0.3s',
                outline: 'none',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          {/* Password - REQUIRED */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ color: '#333', fontSize: '0.95rem', fontWeight: '600', marginBottom: 8, display: 'flex', alignItems: 'center' }}>
              🔐 Password <span style={{ color: '#ff4444', marginLeft: 4 }}>*</span>
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Secure password for doctor's first login"
                value={addDocForm.password}
                onChange={(e) => setAddDocForm({...addDocForm, password: e.target.value})}
                style={{
                  padding: 14,
                  paddingRight: 45,
                  fontSize: '1rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: 10,
                  backgroundColor: '#fafafa',
                  transition: 'all 0.3s',
                  outline: 'none',
                  fontFamily: 'inherit',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  background: 'none',
                  border: 'none',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  padding: 0,
                  color: '#999'
                }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <small style={{ color: '#999', marginTop: 6, fontSize: '0.85rem' }}>Min 6 characters. Doctor uses this to log in for the first time.</small>
          </div>
        </div>

        {/* Department Selection - Full Width with Toggle */}
        <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #f0f0f0' }}>
          <label style={{ color: '#333', fontSize: '0.95rem', fontWeight: '600', marginBottom: 14, display: 'flex', alignItems: 'center' }}>
            🏢 Department Selection <span style={{ color: '#ff4444', marginLeft: 4 }}>*</span>
          </label>
          
          {/* Toggle Buttons */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <button
              onClick={() => { setDeptMode('select'); setNewDeptName(''); setNewDeptDesc(''); }}
              style={{
                flex: 1,
                padding: '12px 16px',
                backgroundColor: deptMode === 'select' ? '#667eea' : '#e9ecef',
                color: deptMode === 'select' ? 'white' : '#333',
                border: 'none',
                borderRadius: 8,
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              📋 Select Existing
            </button>
            <button
              onClick={() => { setDeptMode('create'); setAddDocForm({...addDocForm, department_id: ''}); setNewDeptName(''); setNewDeptDesc(''); }}
              style={{
                flex: 1,
                padding: '12px 16px',
                backgroundColor: deptMode === 'create' ? '#667eea' : '#e9ecef',
                color: deptMode === 'create' ? 'white' : '#333',
                border: 'none',
                borderRadius: 8,
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              ➕ Create New
            </button>
          </div>

          {/* Conditional Display */}
          {deptMode === 'select' ? (
            <div style={{ padding: 14, backgroundColor: '#f8f9fa', borderRadius: 10, border: '2px solid #e9ecef' }}>
              <select
                value={addDocForm.department_id || ""}
                onChange={(e) => setAddDocForm({...addDocForm, department_id: e.target.value})}
                style={{
                  padding: 12,
                  fontSize: '1rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: 8,
                  backgroundColor: 'white',
                  width: '100%',
                  outline: 'none',
                  fontFamily: 'inherit',
                  cursor: 'pointer'
                }}
              >
                <option value="">-- Select a Department --</option>
                {departments && departments.length > 0 ? (() => {
                  // Double-check deduplication at render time
                  const seenIds = new Set();
                  return departments.filter(d => {
                    if (seenIds.has(d.department_id)) {
                      return false;
                    }
                    seenIds.add(d.department_id);
                    return true;
                  }).map(d => (
                    <option key={d.department_id} value={d.department_id}>
                      {d.name} {d.doctors_count ? `(${d.doctors_count} doctors)` : ''}
                    </option>
                  ));
                })() : <option disabled>No departments available</option>}
              </select>
              <small style={{display: 'block', marginTop: 8, color: '#999'}}>Choose from existing departments in your system</small>
            </div>
          ) : (
            <div style={{ padding: 14, backgroundColor: '#f0f4ff', borderRadius: 10, border: '2px solid #d4deff' }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ color: '#333', fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: 6 }}>Department Name</label>
                <input
                  type="text"
                  placeholder="e.g., Cardiology, Neurology, Pediatrics"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  style={{
                    padding: 12,
                    fontSize: '1rem',
                    border: '2px solid #d4deff',
                    borderRadius: 8,
                    backgroundColor: 'white',
                    width: '100%',
                    outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'all 0.3s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#d4deff'}
                />
              </div>
              <div>
                <label style={{ color: '#333', fontSize: '0.85rem', fontWeight: '600', display: 'block', marginBottom: 6 }}>Description/Speciality</label>
                <textarea
                  placeholder="e.g., General healthcare and preventive medicine"
                  value={newDeptDesc}
                  onChange={(e) => setNewDeptDesc(e.target.value)}
                  style={{
                    padding: 12,
                    fontSize: '1rem',
                    border: '2px solid #d4deff',
                    borderRadius: 8,
                    backgroundColor: 'white',
                    width: '100%',
                    outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'all 0.3s',
                    resize: 'vertical',
                    minHeight: '80px'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#d4deff'}
                />
              </div>
              <small style={{display: 'block', marginTop: 8, color: '#999'}}>Enter a new department name to create it</small>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
          <button
            onClick={() => {
              setAddDocForm({ full_name: '', email: '', specialty: '', password: '' });
              setNewDeptName('');
              setAddDocMsg('');
            }}
            disabled={addingDoc}
            style={{
              padding: '12px 24px',
              backgroundColor: '#f0f0f0',
              color: '#333',
              border: '2px solid #ddd',
              borderRadius: 8,
              fontSize: '1rem',
              fontWeight: '600',
              cursor: addingDoc ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              opacity: addingDoc ? 0.5 : 1
            }}
          >
            🔄 Clear Form
          </button>

          <button
            onClick={async () => {
              setAddingDoc(true);
              setAddDocMsg('');
              setError('');
              try {
                const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                const headers = getAuthHeaders();
                const payload = { ...addDocForm, sendReset: false };
                if (newDeptName && !payload.department_id) {
                  payload.department_name = newDeptName;
                  if (newDeptDesc) payload.department_description = newDeptDesc;
                }
                const resp = await fetch(`${API_BASE}/api/admin/doctors`, {
                  method: 'POST',
                  headers,
                  body: JSON.stringify(payload)
                });
                const data = await resp.json();
                if (resp.ok) {
                  setAddDocMsg('✅ Doctor created successfully!');
                  setAddDocForm({ full_name: '', email: '', specialty: '', password: '' });
                  setNewDeptName('');
                  setNewDeptDesc('');
                  // Reload departments with deduplication
                  fetch(`${API_BASE}/api/public/departments`)
                    .then(r => r.json())
                    .then(j => {
                      const data = j.data || [];
                      const uniqueMap = new Map();
                      const jsonStrings = new Set();
                      for (const dept of data) {
                        const key = `${dept.department_id}||${dept.name}`.toLowerCase();
                        if (!jsonStrings.has(key)) {
                          jsonStrings.add(key);
                          uniqueMap.set(dept.department_id, dept);
                        }
                      }
                      const uniqueDepts = Array.from(uniqueMap.values());
                      setDepartments(uniqueDepts);
                    })
                    .catch(() => {});
                  fetchAnalytics();
                } else {
                  setAddDocMsg('❌ Error: ' + (data.message || 'Failed to create doctor'));
                }
              } catch (e) {
                setAddDocMsg('❌ Error: ' + e.message);
              } finally {
                setAddingDoc(false);
              }
            }}
              disabled={addingDoc || !addDocForm.full_name || !addDocForm.email || !addDocForm.password || (!addDocForm.department_id && !newDeptName) || (deptMode === 'create' && !newDeptDesc)}
            style={{
              padding: '12px 28px',
                backgroundColor: addingDoc || !addDocForm.full_name || !addDocForm.email || !addDocForm.password || (!addDocForm.department_id && !newDeptName) || (deptMode === 'create' && !newDeptDesc) ? '#ccc' : '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: '1rem',
              fontWeight: '600',
              cursor: addingDoc || !addDocForm.full_name || !addDocForm.email || !addDocForm.password || (!addDocForm.department_id && !newDeptName) || (deptMode === 'create' && !newDeptDesc) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              boxShadow: addingDoc || !addDocForm.full_name || !addDocForm.email || !addDocForm.password || (!addDocForm.department_id && !newDeptName) || (deptMode === 'create' && !newDeptDesc) ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.4)'
            }}
          >
            {addingDoc ? '⏳ Creating...' : '✓ Create Doctor Account'}
          </button>
        </div>
      </div>

      {/* Manage Departments Section */}
      <div style={{ ...styles.section, marginTop: 16, background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #e0e0e0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '2px solid #f0f0f0' }}>
          <div style={{ fontSize: '2.5rem' }}>🏥</div>
          <div>
            <h2 style={{ marginTop: 0, marginBottom: 4, color: '#333', fontSize: '1.8rem' }}>Manage Departments</h2>
            <p style={{ color: '#666', margin: 0, fontSize: '0.95rem' }}>Click on a department to view and edit details</p>
          </div>
        </div>

        {departments && departments.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
            {departments.map((dept) => (
              <button
                key={dept.department_id}
                onClick={async () => {
                  setSelectedDept(dept);
                  setEditDeptForm({ name: dept.name || "", description: dept.description || "" });
                  setShowDeptModal(true);
                  // Load full doctor details for admin (do not rely on public payload)
                  try {
                    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                    const headers = getAuthHeaders();
                    const doctors = dept.Doctors || [];
                    const detailed = [];
                    for (const d of doctors) {
                      const id = d.doctor_id || d.id;
                      if (!id) continue;
                      try {
                        const resp = await fetch(`${API_BASE}/api/doctors/${id}`, { headers });
                        const json = await resp.json();
                        if (resp.ok && json.data) detailed.push(json.data);
                      } catch (error) { // eslint-disable-line no-unused-vars
                        // Failed loading doctor - silently ignore
                      }
                    }
                    setAdminDoctors(detailed);
                  } catch (error) { // eslint-disable-line no-unused-vars
                    setAdminDoctors([]);
                  }
                }}
                style={{
                  padding: 14,
                  backgroundColor: '#f0f7ff',
                  border: '2px solid #d4deff',
                  borderRadius: 8,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => { e.target.style.backgroundColor = '#e8f1ff'; e.target.style.borderColor = '#667eea'; }}
                onMouseLeave={(e) => { e.target.style.backgroundColor = '#f0f7ff'; e.target.style.borderColor = '#d4deff'; }}
              >
                <h4 style={{ marginTop: 0, marginBottom: 6, color: '#333', fontSize: '1rem' }}>{dept.name}</h4>
                <p style={{ margin: 0, color: '#666', fontSize: '0.8rem', height: '25px', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                  {dept.description ? dept.description.substring(0, 45) + (dept.description.length > 45 ? '...' : '') : <em style={{ color: '#aaa' }}>No info yet</em>}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <p style={{ color: '#999', textAlign: 'center' }}>No departments available</p>
        )}
      </div>

      {/* Edit Department Modal */}
      {showDeptModal && selectedDept && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 24,
            maxWidth: 500,
            width: '90%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: 20, color: '#333' }}>📋 {selectedDept.name}</h2>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8, color: '#333' }}>Department Name</label>
              <input
                type="text"
                value={editDeptForm.name}
                onChange={(e) => setEditDeptForm({ ...editDeptForm, name: e.target.value })}
                style={{
                  width: '100%',
                  padding: 12,
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: 8, color: '#333' }}>Description/Specialty</label>
              <textarea
                value={editDeptForm.description}
                onChange={(e) => setEditDeptForm({ ...editDeptForm, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: 12,
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  fontSize: '1rem',
                  minHeight: 100,
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
                placeholder="e.g., General healthcare and preventive medicine"
              />
            </div>

            {/* Doctors list (admin-only full info + edit) */}
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ marginTop: 0, marginBottom: 8 }}>Doctors in this Department</h3>
              {adminDoctors && adminDoctors.length > 0 ? (
                adminDoctors.map((doc) => (
                  <div key={doc.doctor_id} style={{ padding: 10, border: '1px solid #eee', borderRadius: 8, marginBottom: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <input
                        value={doc.User?.full_name || ''}
                        onChange={(e) => setAdminDoctors(adminDoctors.map(d => d.doctor_id === doc.doctor_id ? { ...d, User: { ...d.User, full_name: e.target.value } } : d))}
                        style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd' }}
                      />
                      <input
                        value={doc.User?.email || ''}
                        onChange={(e) => setAdminDoctors(adminDoctors.map(d => d.doctor_id === doc.doctor_id ? { ...d, User: { ...d.User, email: e.target.value } } : d))}
                        style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd' }}
                      />
                      <input
                        value={doc.User?.phone || ''}
                        onChange={(e) => setAdminDoctors(adminDoctors.map(d => d.doctor_id === doc.doctor_id ? { ...d, User: { ...d.User, phone: e.target.value } } : d))}
                        style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd' }}
                      />
                      <input
                        value={doc.specialty || ''}
                        onChange={(e) => setAdminDoctors(adminDoctors.map(d => d.doctor_id === doc.doctor_id ? { ...d, specialty: e.target.value } : d))}
                        style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd' }}
                      />
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                      <button
                        onClick={async () => {
                          try {
                            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                            const headers = getAuthHeaders();
                            const body = {
                              specialty: doc.specialty,
                              email: doc.User?.email,
                              full_name: doc.User?.full_name,
                              phone: doc.User?.phone,
                            };
                            const resp = await fetch(`${API_BASE}/api/doctors/${doc.doctor_id}`, {
                              method: 'PATCH',
                              headers,
                              body: JSON.stringify(body)
                            });
                            const j = await resp.json();
                            if (resp.ok) {
                              alert('✅ Doctor updated');
                              // refresh adminDoctors entry
                              setAdminDoctors(adminDoctors.map(d => d.doctor_id === doc.doctor_id ? j.data : d));
                            } else {
                              alert('❌ ' + (j.message || 'Failed'));
                            }
                          } catch (e) {
                            alert('Error: ' + e.message);
                          }
                        }}
                        style={{ padding: 8, backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: 6 }}
                      >
                        Save Doctor
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#666' }}>No doctors in this department</p>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={async () => {
                  try {
                    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                    const headers = getAuthHeaders();
                    const resp = await fetch(`${API_BASE}/api/admin/departments/${selectedDept.department_id}`, {
                      method: 'PUT',
                      headers,
                      body: JSON.stringify(editDeptForm)
                    });
                    const data = await resp.json();
                    if (data.success) {
                      alert('✅ Department updated!');
                      setShowDeptModal(false);
                      // Reload departments
                      fetch(`${API_BASE}/api/public/departments`)
                        .then(r => r.json())
                        .then(j => {
                          const depts = j.data || [];
                          const uniqueMap = new Map();
                          for (const d of depts) {
                            if (!uniqueMap.has(d.department_id)) {
                              uniqueMap.set(d.department_id, d);
                            }
                          }
                          setDepartments(Array.from(uniqueMap.values()));
                        });
                    } else {
                      alert('❌ Failed: ' + data.message);
                    }
                  } catch (err) {
                    alert('Error: ' + err.message);
                  }
                }}
                style={{
                  flex: 1,
                  padding: 12,
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                💾 Save
              </button>
              <button
                onClick={() => setShowDeptModal(false)}
                style={{
                  flex: 1,
                  padding: 12,
                  backgroundColor: '#999',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Statistics */}
      {appointmentStats && (
        <div style={styles.section}>
          <h2>📅 Appointment Statistics</h2>
          <div style={styles.statsGrid}>
            <div style={styles.stat}>
              <p style={styles.statLabel}>Scheduled</p>
              <p style={styles.statValue}>{appointmentStats.scheduled}</p>
            </div>
            <div style={styles.stat}>
              <p style={styles.statLabel}>Completed</p>
              <p style={styles.statValue}>{appointmentStats.completed}</p>
            </div>
            <div style={styles.stat}>
              <p style={styles.statLabel}>Cancelled</p>
              <p style={styles.statValue}>{appointmentStats.cancelled}</p>
            </div>
            <div style={styles.stat}>
              <p style={styles.statLabel}>No-Show</p>
              <p style={styles.statValue}>{appointmentStats.noShow}</p>
            </div>
            <div style={styles.stat}>
              <p style={styles.statLabel}>Completion Rate</p>
              <p style={styles.statValue}>{appointmentStats.completionRate}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Statistics */}
      {prescriptionStats && prescriptionStats.totalPrescriptions !== undefined && (
        <div style={styles.section}>
          <h2>💊 Prescription Statistics</h2>
          <div style={styles.statsGrid}>
            <div style={styles.stat}>
              <p style={styles.statLabel}>Total Prescriptions</p>
              <p style={styles.statValue}>{prescriptionStats.totalPrescriptions}</p>
            </div>
            <div style={styles.stat}>
              <p style={styles.statLabel}>Active</p>
              <p style={styles.statValue}>{prescriptionStats.activePrescriptions}</p>
            </div>
            <div style={styles.stat}>
              <p style={styles.statLabel}>Completed</p>
              <p style={styles.statValue}>{prescriptionStats.completedPrescriptions}</p>
            </div>
          </div>
          {prescriptionStats.topMedications && prescriptionStats.topMedications.length > 0 && (
            <div>
              <h3>Top 5 Medications</h3>
              <ul style={styles.list}>
                {prescriptionStats.topMedications.slice(0, 5).map((med, idx) => (
                  <li key={idx}>{med.medication_name} - {med.count} prescriptions</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Revenue Statistics */}
      {revenueStats && revenueStats.totalRevenue !== undefined && (
        <div style={styles.section}>
          <h2>💰 Revenue Statistics</h2>
          <div style={styles.statsGrid}>
            <div style={styles.stat}>
              <p style={styles.statLabel}>Total Revenue</p>
              <p style={styles.statValue}>৳{Number(revenueStats.totalRevenue || 0).toFixed(2)}</p>
            </div>
            <div style={styles.stat}>
              <p style={styles.statLabel}>Total Bills</p>
              <p style={styles.statValue}>{revenueStats.totalBills}</p>
            </div>
            <div style={styles.stat}>
              <p style={styles.statLabel}>Average Bill</p>
              <p style={styles.statValue}>৳{Number(revenueStats.averageBillAmount || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bills Management */}
      {bills.length > 0 && (
        <div style={styles.section}>
          <h2>💵 Bills Management</h2>
          <div style={{ ...styles.statsGrid, marginBottom: "1rem" }}>
            <div style={styles.stat}>
              <p style={styles.statLabel}>Total Bills</p>
              <p style={styles.statValue}>{bills.length}</p>
            </div>
            <div style={styles.stat}>
              <p style={styles.statLabel}>Unpaid</p>
              <p style={{ ...styles.statValue, color: "#e74c3c" }}>{bills.filter(b => b.payment_status === "unpaid").length}</p>
            </div>
            <div style={styles.stat}>
              <p style={styles.statLabel}>Partial</p>
              <p style={{ ...styles.statValue, color: "#f39c12" }}>{bills.filter(b => b.payment_status === "partial").length}</p>
            </div>
            <div style={styles.stat}>
              <p style={styles.statLabel}>Paid</p>
              <p style={{ ...styles.statValue, color: "#2ecc71" }}>{bills.filter(b => b.payment_status === "paid").length}</p>
            </div>
          </div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Total Amount</th>
                <th>Paid Amount</th>
                <th>Status</th>
                <th>Issued Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bills.slice(0, 10).map((bill, idx) => (
                <tr key={idx}>
                  <td>{bill.Patient?.User?.full_name || "N/A"}</td>
                  <td>৳{parseFloat(bill.total_amount || 0).toFixed(2)}</td>
                  <td>৳{parseFloat(bill.paid_amount || 0).toFixed(2)}</td>
                  <td style={{
                    color: bill.payment_status === "paid" ? "#2ecc71" :
                           bill.payment_status === "partial" ? "#f39c12" : "#e74c3c"
                  }}>
                    {bill.payment_status}
                  </td>
                  <td>{new Date(bill.issue_date).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => openBillModal(bill)}
                      style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: "#3498db",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                      }}
                    >
                      Update Payment
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Doctor Performance */}
      {doctorPerformance.length > 0 && (
        <div style={styles.section}>
          <h2>👨‍⚕️ Doctor Performance</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Specialty</th>
                <th>Total Appointments</th>
                <th>Completed</th>
                <th>Completion Rate</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {doctorPerformance.map((doc, idx) => (
                <tr key={idx}>
                  <td>{doc.name || "N/A"}</td>
                  <td>{doc.specialty}</td>
                  <td>{doc.totalAppointments}</td>
                  <td>{doc.completedAppointments}</td>
                  <td>{doc.completionRate}%</td>
                  <td>⭐ {doc.averageRating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

        </>
      )}

      {/* Lab Results Tab */}
      {activeTab === "lab-results" && (
        <LabResultsSection />
      )}



      {/* Bill Payment Modal */}
      {showBillModal && selectedBill && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <h3 style={{ marginTop: 0 }}>Update Bill Payment</h3>
            <div style={{ marginBottom: "1rem" }}>
              <p><strong>Patient:</strong> {selectedBill.Patient?.User?.full_name || "N/A"}</p>
              <p><strong>Total Amount:</strong> ৳{parseFloat(selectedBill.total_amount || 0).toFixed(2)}</p>
              <p><strong>Current Paid:</strong> ৳{parseFloat(selectedBill.paid_amount || 0).toFixed(2)}</p>
              <p><strong>Balance Due:</strong> ৳{(parseFloat(selectedBill.total_amount || 0) - parseFloat(selectedBill.paid_amount || 0)).toFixed(2)}</p>
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.25rem" }}>Amount Paid</label>
              <input
                type="number"
                value={billPaymentForm.paid_amount}
                onChange={(e) => setBillPaymentForm({ ...billPaymentForm, paid_amount: parseFloat(e.target.value) })}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ddd" }}
              />
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.25rem" }}>Payment Status</label>
              <select
                value={billPaymentForm.payment_status}
                onChange={(e) => setBillPaymentForm({ ...billPaymentForm, payment_status: e.target.value })}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ddd" }}
              >
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div style={{ marginBottom: "0.75rem" }}>
              <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.25rem" }}>Payment Method</label>
              <input
                type="text"
                value={billPaymentForm.payment_method}
                onChange={(e) => setBillPaymentForm({ ...billPaymentForm, payment_method: e.target.value })}
                placeholder="e.g., Cash, Card, UPI"
                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #ddd" }}
              />
            </div>

            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowBillModal(false)}
                style={{ padding: "0.5rem 1rem", backgroundColor: "#999", color: "white", border: "none", borderRadius: "4px" }}
              >
                Cancel
              </button>
              <button
                onClick={updateBillPayment}
                style={{ padding: "0.5rem 1rem", backgroundColor: "#2ecc71", color: "white", border: "none", borderRadius: "4px" }}
              >
                Update Payment
              </button>
            </div>
          </div>
        </div>
      )}

      <button onClick={fetchAnalytics} style={styles.refreshBtn}>🔄 Refresh Data</button>
    </div>
  );
};

const StatCard = ({ label, value, color, icon }) => (
  <div style={{ ...styles.card, borderLeft: `5px solid ${color}` }}>
    <p style={styles.cardLabel}>{icon} {label}</p>
    <p style={styles.cardValue}>{value}</p>
  </div>
);

const styles = {
  container: {
    padding: "2rem",
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
    backgroundColor: "white",
    padding: "1rem",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
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
    marginBottom: "0.5rem",
  },
  cardValue: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "#333",
  },
  section: {
    backgroundColor: "white",
    padding: "2rem",
    borderRadius: "8px",
    marginBottom: "2rem",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "1rem",
    marginBottom: "1rem",
  },
  stat: {
    backgroundColor: "#f9f9f9",
    padding: "1rem",
    borderRadius: "4px",
    textAlign: "center",
  },
  statLabel: {
    fontSize: "0.85rem",
    color: "#666",
    marginBottom: "0.5rem",
  },
  statValue: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "#333",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "1rem",
  },
  list: {
    listStyle: "none",
    padding: "1rem",
    backgroundColor: "#f9f9f9",
    borderRadius: "4px",
  },
  logoutBtn: {
    padding: "0.5rem 1rem",
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1rem",
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
};

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
    maxWidth: 500,
    backgroundColor: "white",
    borderRadius: 8,
    padding: "1.5rem",
    boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
  },
};

export default AdminDashboard;
