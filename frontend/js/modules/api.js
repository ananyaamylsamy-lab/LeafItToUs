const API_URL = "/api";

export const api = {
  // General request method
  async request(endpoint, options = {}) {
    const config = {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  // Auth endpoints
  auth: {
    signup(userData) {
      return api.request("/auth/signup", {
        method: "POST",
        body: JSON.stringify(userData),
      });
    },

    login(credentials) {
      return api.request("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
    },

    logout() {
      return api.request("/auth/logout", {
        method: "POST",
      });
    },

    getCurrentUser() {
      return api.request("/auth/me");
    },

    updateProfile(profileData) {
      return api.request("/auth/profile", {
        method: "PUT",
        body: JSON.stringify(profileData),
      });
    },
  },

  // Diagnoses endpoints
  diagnoses: {
    create(diagnosisData) {
      return api.request("/diagnoses", {
        method: "POST",
        body: JSON.stringify(diagnosisData),
      });
    },

    getAll(filters = {}) {
      const query = new URLSearchParams(filters).toString();
      return api.request(`/diagnoses${query ? `?${query}` : ""}`);
    },

    getById(id) {
      return api.request(`/diagnoses/${id}`);
    },

    update(id, updates) {
      return api.request(`/diagnoses/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
    },

    delete(id) {
      return api.request(`/diagnoses/${id}`, {
        method: "DELETE",
      });
    },

    applyTreatment(diagnosisId, treatmentData) {
      return api.request(`/diagnoses/${diagnosisId}/treatments`, {
        method: "POST",
        body: JSON.stringify(treatmentData),
      });
    },
  },

  // Treatments endpoints
  treatments: {
    create(treatmentData) {
      return api.request("/treatments", {
        method: "POST",
        body: JSON.stringify(treatmentData),
      });
    },

    getAll(filters = {}) {
      const query = new URLSearchParams(filters).toString();
      return api.request(`/treatments${query ? `?${query}` : ""}`);
    },

    getById(id) {
      return api.request(`/treatments/${id}`);
    },

    update(id, updates) {
      return api.request(`/treatments/${id}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
    },

    delete(id) {
      return api.request(`/treatments/${id}`, {
        method: "DELETE",
      });
    },

    rate(id, success) {
      return api.request(`/treatments/${id}/rate`, {
        method: "POST",
        body: JSON.stringify({ success }),
      });
    },
  },
};
