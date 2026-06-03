// src/api.js
import axios from "axios";

const API_URL = "/api";

// ================= AUTH =================
export const registerUser = async (username, email, password) => {
  return axios.post(`${API_URL}/register`, { username, email, password });
};

export const loginUser = async (email, password) => {
  return axios.post(`${API_URL}/login`, { email, password });
};

// ================= AI SUGGESTIONS =================
// 🔹 search + personalization
export const getAiSuggestions = async ({ interests = "", budget = null, location = "" }) => {
  const token = localStorage.getItem("token"); // Παίρνουμε το token
  const res = await axios.post(
    `${API_URL}/ai/suggest`, 
    { interests, budget, location }, // Αφαιρέσαμε το userId!
    { headers: { Authorization: `Bearer ${token}` } } // Στέλνουμε το token στα headers
  );
  return res.data;
};

export const sendMessageToOfflineAi = async (message) => {
  const res = await axios.post(`${API_URL}/ai/offline`, { message });
  return res.data;
};

// ================= ACTIVITIES =================
export const getActivities = async () => {
  const res = await axios.get(`${API_URL}/activities`);
  return res.data;
};

// ================= REVIEWS =================
export const getAllReviews = async () => {
  const res = await axios.get(`${API_URL}/reviews`);
  return res.data;
};

export const getReviewsByActivity = async (activityId) => {
  const res = await axios.get(`${API_URL}/reviews/${activityId}`);
  return res.data;
};

export const addReview = async (activity_id, rating, comment) => {
  const token = localStorage.getItem("token"); // Παίρνουμε το token
  const res = await axios.post(
    `${API_URL}/reviews`, 
    { activity_id, rating, comment }, // Αφαιρέσαμε το user_id!
    { headers: { Authorization: `Bearer ${token}` } } // Στέλνουμε το token στα headers
  );
  return res.data;
};

// ================= PROFILE =================
export const getUserProfile = async (token) => {
  const res = await axios.get(`${API_URL}/user/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const updateUserProfile = async (token, data) => {
  const res = await axios.put(`${API_URL}/user/profile`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

// ================= STATS =================
export const getUserStats = async (token) => {
  const res = await axios.get(`${API_URL}/user/stats`, {   
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};  

// ================= CHAT BOT =================
export const sendMessageToChatbot = async (message) => {
  const res = await axios.post(`${API_URL}/ai/chatbot`, {
    message
  });
  return res.data;
};

// ================= HISTORY =================
export const addToHistory = async (activity_id) => { 
  const token = localStorage.getItem("token");
  if (!token) return;

  return axios.post(`${API_URL}/history`, 
    { activity_id, event: 'view' },
    { headers: { Authorization: `Bearer ${token}` } } 
  );
};

export const getUserHistory = async () => { 
  const token = localStorage.getItem("token");
  if (!token) return [];

  const res = await axios.get(`${API_URL}/history`, { 
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};