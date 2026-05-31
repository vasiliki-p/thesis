// src/api.js
import axios from "axios";

const API_URL = "http://localhost:5000/api";

// ================= AUTH =================
export const registerUser = async (username, email, password) => {
  return axios.post(`${API_URL}/register`, { username, email, password });
};

export const loginUser = async (email, password) => {
  return axios.post(`${API_URL}/login`, { email, password });
};

// ================= AI SUGGESTIONS =================
// 🔹 search + personalization
export const getAiSuggestions = async ({userId = null, interests = "",budget = null,location = ""}) => {
  const res = await axios.post(`${API_URL}/ai/suggest`, {userId,interests,budget,location});
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

export const addReview = async (user_id, activity_id, rating, comment) => {
  const res = await axios.post(`${API_URL}/reviews`, {
    user_id,
    activity_id,
    rating,
    comment
  });
  return res.data;
};

export const sendMessageToOfflineAi = async (message) => {
const res = await axios.post(`${API_URL}/ai/offline`, { message });
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
} ;  

// ================= CHAT BOT =================
export const sendMessageToChatbot = async (message) => {
  const res = await axios.post(`${API_URL}/ai/chatbot`, {
    message
  });
  return res.data;
};

// ================= HISTORY =================
export const addToHistory = async (user_id, activity_id) => {
  // Αν δεν είναι συνδεδεμένος (user_id null), δεν κάνουμε τίποτα
  if (!user_id) return;
  return axios.post(`${API_URL}/history`, { 
    user_id, 
    activity_id, 
    event: 'view' 
  });
};

export const getUserHistory = async (user_id) => {
  const res = await axios.get(`${API_URL}/history/${user_id}`);
  return res.data;
};

