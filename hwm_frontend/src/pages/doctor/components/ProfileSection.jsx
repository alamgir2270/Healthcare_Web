import React, { useState, useMemo, useEffect } from "react";
import { getAuthHeaders } from "../../../utils/auth";

const ProfileSection = ({ doctorStats, styles, onProfileUpdate }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    specialty: doctorStats?.specialty || "",
    license_no: doctorStats?.license_no || "",
    available_days: doctorStats?.available_days || "",
    available_hours: doctorStats?.available_hours || "",
    bio: doctorStats?.bio || "",
    phone: doctorStats?.phone || "",
  });

  // Sync profileForm with doctorStats whenever it changes
  useEffect(() => {
    if (doctorStats) {
      setProfileForm({
        specialty: doctorStats.specialty || "",
        license_no: doctorStats.license_no || "",
        available_days: doctorStats.available_days || "",
        available_hours: doctorStats.available_hours || "",
        bio: doctorStats.bio || "",
        phone: doctorStats.phone || "",
      });
    }
  }, [doctorStats]);

  // Shuffle function to randomize information display
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Create shuffled information array
  const infoArray = useMemo(() => {
    return shuffleArray([
      { label: "👤 Full Name", value: user.full_name || "Not set", key: "name" },
      { label: "📧 Email", value: user.email || "Not set", key: "email" },
      { label: "📱 Phone", value: profileForm.phone || "Not set", key: "phone" },
      { label: "🏢 Department", value: doctorStats?.department || "Not set", key: "dept" },
      { label: "🏥 Specialty", value: profileForm.specialty || "Not set", key: "specialty" },
      { label: "📄 License Number", value: profileForm.license_no || "Not set", key: "license" },
      { label: "📅 Available Days", value: profileForm.available_days || "Not set", key: "days" },
      { label: "⏰ Available Hours", value: profileForm.available_hours || "Not set", key: "hours" },
    ]);
  }, [profileForm, doctorStats, user]);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordMsg, setPasswordMsg] = useState("");
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const saveProfileChanges = async () => {
    try {
      setLoading(true);
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const headers = getAuthHeaders();
      const resp = await fetch(`${API_BASE}/api/doctors/profile`, {
        method: "PUT",
        headers,
        body: JSON.stringify(profileForm),
      });
      if (!resp.ok) throw new Error("Failed to update profile");
      setEditingProfile(false);
      onProfileUpdate?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const savePasswordChanges = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg("❌ Passwords don't match");
      return;
    }
    try {
      const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
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
      setPasswordMsg(data.message || (resp.ok ? "✅ Password updated! Please log in again" : "❌ Failed to update password"));
      if (resp.ok) {
        setTimeout(() => localStorage.clear(), 1000);
      }
    } catch (err) {
      setPasswordMsg("❌ " + err.message);
    }
  };

  return (
    <div style={styles.section}>
      <h2>👨‍⚕️ Doctor Profile</h2>
      
      {error && <div style={{ color: "#e74c3c", marginBottom: "1rem" }}>{error}</div>}

      {editingProfile && (
        <div style={{
          marginTop: "2rem",
          padding: "1.5rem",
          backgroundColor: "#fff",
          border: "1px solid #ddd",
          borderRadius: "4px"
        }}>
          <h4 style={{ marginTop: 0 }}>Edit Your Profile</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "500" }}>Specialty</label>
              <input
                type="text"
                value={profileForm.specialty || ""}
                onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.7rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  boxSizing: "border-box"
                }}
                placeholder="e.g., Cardiology"
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "500" }}>License Number</label>
              <input
                type="text"
                value={profileForm.license_no || ""}
                onChange={(e) => setProfileForm({ ...profileForm, license_no: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.7rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  boxSizing: "border-box"
                }}
                placeholder="Your license number"
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "500" }}>Phone Number</label>
              <input
                type="tel"
                value={profileForm.phone || ""}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.7rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  boxSizing: "border-box"
                }}
                placeholder="e.g., +88018XXXXXXXX"
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "500" }}>Available Days</label>
              <input
                type="text"
                value={profileForm.available_days || ""}
                onChange={(e) => setProfileForm({ ...profileForm, available_days: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.7rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  boxSizing: "border-box"
                }}
                placeholder="e.g., Mon,Tue,Wed,Thu,Fri"
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "500" }}>Available Hours</label>
              <input
                type="text"
                value={profileForm.available_hours || ""}
                onChange={(e) => setProfileForm({ ...profileForm, available_hours: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.7rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  boxSizing: "border-box"
                }}
                placeholder="e.g., 09:00-17:00"
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "500" }}>Biography</label>
              <textarea
                value={profileForm.bio || ""}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                style={{
                  width: "100%",
                  padding: "0.7rem",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                  minHeight: "100px",
                  fontFamily: "inherit"
                }}
                placeholder="Tell about yourself..."
              />
            </div>
            <div style={{ gridColumn: "1 / -1", backgroundColor: "#f5f5f5", padding: "1rem", borderRadius: "4px" }}>
              <h4 style={{ marginTop: 0, marginBottom: "1rem" }}>🔐 Change Email</h4>
              <div>
                <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "500" }}>Current Email</label>
                <input
                  type="email"
                  disabled
                  value={user.email || ""}
                  style={{
                    width: "100%",
                    padding: "0.7rem",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    boxSizing: "border-box",
                    backgroundColor: "#e8e8e8"
                  }}
                />
                <p style={{ fontSize: "0.8rem", color: "#999", margin: "0.3rem 0 0 0" }}>Contact admin to change email</p>
              </div>
            </div>
            <div style={{ gridColumn: "1 / -1", backgroundColor: "#fff3cd", padding: "1rem", borderRadius: "4px", border: "1px solid #ffc107" }}>
              <h4 style={{ marginTop: 0, marginBottom: "1rem" }}>🔒 Change Password</h4>
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "500" }}>Current Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPasswords.current ? "text" : "password"}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.7rem 2.5rem 0.7rem 0.7rem",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      boxSizing: "border-box"
                    }}
                    placeholder="Your current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    style={{
                      position: "absolute",
                      right: "0.7rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1.2rem"
                    }}
                  >
                    {showPasswords.current ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "500" }}>New Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPasswords.new ? "text" : "password"}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.7rem 2.5rem 0.7rem 0.7rem",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      boxSizing: "border-box"
                    }}
                    placeholder="New password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    style={{
                      position: "absolute",
                      right: "0.7rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1.2rem"
                    }}
                  >
                    {showPasswords.new ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", marginBottom: "0.3rem", fontWeight: "500" }}>Confirm Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPasswords.confirm ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.7rem 2.5rem 0.7rem 0.7rem",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      boxSizing: "border-box"
                    }}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    style={{
                      position: "absolute",
                      right: "0.7rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1.2rem"
                    }}
                  >
                    {showPasswords.confirm ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>
              {passwordMsg && (
                <div style={{
                  padding: "0.5rem",
                  borderRadius: "4px",
                  marginBottom: "1rem",
                  backgroundColor: passwordMsg.includes("successfully") ? "#d4edda" : "#f8d7da",
                  color: passwordMsg.includes("successfully") ? "#155724" : "#721c24",
                  fontSize: "0.9rem"
                }}>
                  {passwordMsg}
                </div>
              )}
              <button
                onClick={savePasswordChanges}
                style={{
                  padding: "0.6rem 1.2rem",
                  backgroundColor: "#ff9800",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.9rem"
                }}
              >
                🔄 Update Password
              </button>
            </div>
          </div>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
            <button
              onClick={saveProfileChanges}
              disabled={loading}
              style={{
                padding: "0.7rem 1.5rem",
                backgroundColor: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "0.9rem",
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? "Saving..." : "💾 Save Changes"}
            </button>
            <button
              onClick={() => setEditingProfile(false)}
              style={{
                padding: "0.7rem 1.5rem",
                backgroundColor: "#999",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.9rem"
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!editingProfile && (
        <div>
          <div style={{
            backgroundColor: "#f8f9fa",
            border: "1px solid #dee2e6",
            borderRadius: "8px",
            padding: "2rem",
            marginBottom: "2rem"
          }}>
            {infoArray.map((info) => (
              <div key={info.key} style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.9rem", color: "#888", fontWeight: "600", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                  {info.label}
                </label>
                <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: "bold", color: "#2c3e50" }}>
                  {info.value}
                </p>
              </div>
            ))}

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.9rem", color: "#888", fontWeight: "600", textTransform: "uppercase", marginBottom: "0.5rem" }}>📋 Biography</label>
              <p style={{ margin: 0, fontSize: "1rem", color: "#555", lineHeight: "1.6" }}>
                {profileForm.bio || "No biography added yet"}
              </p>
            </div>
          </div>

          <button
            onClick={() => setEditingProfile(true)}
            style={{
              padding: "0.7rem 1.5rem",
              backgroundColor: "#3498db",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: "bold"
            }}
          >
            ✏️ Edit Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileSection;
