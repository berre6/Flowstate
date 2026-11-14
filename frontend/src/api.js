const API_URL = import.meta.env.VITE_API_URL;

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("flowstate_token");

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Bir hata oluştu.");
  }

  return data;
}

export async function registerUser(email, password) {
  return apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function loginUser(email, password) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  const response = await apiRequest("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData,
  });

  localStorage.setItem("flowstate_token", response.access_token);

  return response;
}

export function logoutUser() {
  localStorage.removeItem("flowstate_token");
}