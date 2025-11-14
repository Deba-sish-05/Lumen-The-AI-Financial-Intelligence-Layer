import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000", // your Flask backend URL
  withCredentials: false,
});

// Add Authorization header automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// auto logout on token expiry or unauthorized
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("access_token");
      if(window.location.href !== "/")window.location.href = "/"; // redirect to login
    }
    return Promise.reject(err);
  }
);

export default api;
