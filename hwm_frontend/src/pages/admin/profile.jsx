import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthHeaders, clearAuth } from "../../utils/auth";

const AdminProfile = () => {
  const navigate = useNavigate();
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
    phone: "",
  });

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Show/hide password toggles
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Fetch admin profile on mount
  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const headers = getAuthHeaders();

      if (!headers.Authorization) {
        clearAuth();
        navigate("/login", { state: { message: "Please sign in as admin." } });
        return;
      }

      const resp = await fetch(`${API_BASE}/api/admin/profile`, { headers });
      const data = await resp.json();

      if (resp.ok && data.success) {
        setProfileForm({
          full_name: data.data.full_name || "",
          email: data.data.email || "",
          phone: data.data.phone || "",
        });
      } else {
        setError(data.message || "Failed to load profile");
      }
    } catch (err) {
      console.error("Error fetching admin profile:", err);
      setError(err.message || "Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setError("");
      setSuccess("");

      if (!profileForm.full_name.trim()) {
        setError("Name is required");
        return;
      }

      if (!profileForm.email.includes("@")) {
        setError("Valid email is required");
        return;
      }

      const headers = getAuthHeaders();
      const resp = await fetch(`${API_BASE}/api/admin/profile`, {
        method: "PUT",
        headers,
        body: JSON.stringify(profileForm),
      });

      const data = await resp.json();

      if (resp.ok && data.success) {
        setSuccess("✅ Profile updated successfully!");
        setEditing(false);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      setError(err.message || "Error saving profile");
    }
  };

  const changePassword = async () => {
    try {
      setError("");
      setSuccess("");

      // Validation
      if (!passwordForm.currentPassword) {
        setError("Please enter current password");
        return;
      }

      if (!passwordForm.newPassword) {
        setError("Please enter new password");
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setError("Passwords don't match");
        return;
      }

      // Password strength validation
      const hasUpper = /[A-Z]/.test(passwordForm.newPassword);
      const hasLower = /[a-z]/.test(passwordForm.newPassword);
      const hasNumber = /[0-9]/.test(passwordForm.newPassword);
      const hasMinLength = passwordForm.newPassword.length >= 8;

      if (!hasMinLength || !hasUpper || !hasLower || !hasNumber) {
        setError("Password must be 8+ chars with uppercase, lowercase, and numbers");
        return;
      }

      const headers = getAuthHeaders();
      const resp = await fetch(`${API_BASE}/api/auth/change-password`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await resp.json();

      if (resp.ok) {
        setSuccess("✅ Password changed successfully!");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setChangingPassword(false);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to change password");
      }
    } catch (err) {
      console.error("Error changing password:", err);
      setError(err.message || "Error changing password");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
      {/* Header with back button */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "2rem", gap: "1rem" }}>
        <button
          onClick={() => navigate("/admin/dashboard")}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#f0f0f0",
            border: "1px solid #ddd",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          ← Back to Dashboard
        </button>
        <h1>⚙️ Admin Profile Settings</h1>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#ffebee",
            border: "1px solid #ef5350",
            borderRadius: "4px",
            color: "#c62828",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            padding: "1rem",
            backgroundColor: "#e8f5e9",
            border: "1px solid #4caf50",
            borderRadius: "4px",
            color: "#2e7d32",
            marginBottom: "1rem",
          }}
        >
          {success}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
        {/* PROFILE EDIT SECTION */}
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            padding: "1.5rem",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <h2>👤 Basic Information</h2>

          {!editing ? (
            <>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontWeight: "bold", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                  Full Name
                </label>
                <p style={{ margin: 0, color: "#666", fontSize: "1rem" }}>{profileForm.full_name || "—"}</p>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontWeight: "bold", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                  Email
                </label>
                <p style={{ margin: 0, color: "#666", fontSize: "1rem" }}>{profileForm.email || "—"}</p>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontWeight: "bold", fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                  Phone
                </label>
                <p style={{ margin: 0, color: "#666", fontSize: "1rem" }}>{profileForm.phone || "—"}</p>
              </div>

              <button
                onClick={() => setEditing(true)}
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
                ✏️ Edit Information
              </button>
            </>
          ) : (
            <>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                    fontSize: "1rem",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Enter email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                    fontSize: "1rem",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                  Phone
                </label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                    fontSize: "1rem",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  onClick={saveProfile}
                  style={{
                    padding: "0.6rem 1.2rem",
                    backgroundColor: "#4caf50",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: "bold",
                  }}
                >
                  💾 Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    fetchAdminProfile();
                  }}
                  style={{
                    padding: "0.6rem 1.2rem",
                    backgroundColor: "#999",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: "bold",
                  }}
                >
                  ❌ Cancel
                </button>
              </div>
            </>
          )}
        </div>

        {/* PASSWORD CHANGE SECTION */}
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            padding: "1.5rem",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <h2>🔐 Change Password</h2>

          {!changingPassword ? (
            <button
              onClick={() => setChangingPassword(true)}
              style={{
                padding: "0.6rem 1.2rem",
                backgroundColor: "#ff9800",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: "bold",
              }}
            >
              🔑 Change Password
            </button>
          ) : (
            <>
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                  Current Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    placeholder="Enter current password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      paddingRight: "2.5rem",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      fontSize: "1rem",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    style={{
                      position: "absolute",
                      right: "0.5rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1.2rem",
                      padding: "0.25rem 0.5rem",
                    }}
                  >
                    {showPasswords.current ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                  New Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    placeholder="Min 8 chars, uppercase, lowercase, number"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      paddingRight: "2.5rem",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      fontSize: "1rem",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    style={{
                      position: "absolute",
                      right: "0.5rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1.2rem",
                      padding: "0.25rem 0.5rem",
                    }}
                  >
                    {showPasswords.new ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontWeight: "bold", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                  Confirm New Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    placeholder="Re-enter new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      paddingRight: "2.5rem",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      fontSize: "1rem",
                      boxSizing: "border-box",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    style={{
                      position: "absolute",
                      right: "0.5rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1.2rem",
                      padding: "0.25rem 0.5rem",
                    }}
                  >
                    {showPasswords.confirm ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  onClick={changePassword}
                  style={{
                    padding: "0.6rem 1.2rem",
                    backgroundColor: "#4caf50",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: "bold",
                  }}
                >
                  ✅ Update Password
                </button>
                <button
                  onClick={() => {
                    setChangingPassword(false);
                    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  }}
                  style={{
                    padding: "0.6rem 1.2rem",
                    backgroundColor: "#999",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    fontWeight: "bold",
                  }}
                >
                  ❌ Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
