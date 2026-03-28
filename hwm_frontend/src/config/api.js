// Frontend API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  SIGNUP: `${API_BASE_URL}/api/auth/signup`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  
  // Appointments
  APPOINTMENTS: `${API_BASE_URL}/api/appointments`,
  GET_APPOINTMENT: (id) => `${API_BASE_URL}/api/appointments/${id}`,
  
  // Doctors
  DOCTORS: `${API_BASE_URL}/api/doctors`,
  GET_DOCTOR: (id) => `${API_BASE_URL}/api/doctors/${id}`,
  
  // Patients
  PATIENTS: `${API_BASE_URL}/api/patients`,
  GET_PATIENT: (id) => `${API_BASE_URL}/api/patients/${id}`,
  
  // Bills
  BILLS: `${API_BASE_URL}/api/bills`,
  GET_BILL: (id) => `${API_BASE_URL}/api/bills/${id}`,
  
  // Lab Results
  LAB_RESULTS: `${API_BASE_URL}/api/lab-results`,
  GET_LAB_RESULT: (id) => `${API_BASE_URL}/api/lab-results/${id}`,
  
  // Prescriptions
  PRESCRIPTIONS: `${API_BASE_URL}/api/prescriptions`,
  GET_PRESCRIPTION: (id) => `${API_BASE_URL}/api/prescriptions/${id}`,
};

export default API_BASE_URL;
