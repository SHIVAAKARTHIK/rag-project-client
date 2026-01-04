// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Basic API Client function with authentication support

export const apiClient = {
  get: async (endpoint: string, token?: string | null) => {
    const headers: HeadersInit = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  },

  post: async (endpoint: string, data: unknown, token?: string | null) => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  },

  delete: async (endpoint: string, token?: string | null) => {
    const headers: HeadersInit = {};

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers,
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  },

  put: async (endpoint: string, data: unknown, token?: string | null) => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  },

  // NEW: Stream method for SSE (Server-Sent Events)
  // Returns raw response for streaming (doesn't call .json())
  stream: async (
    endpoint: string, 
    data: unknown, 
    token?: string | null,
    signal?: AbortSignal
  ) => {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
      signal, // For aborting the stream
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    // Return raw response for streaming (not .json())
    return response;
  },

  uploadToS3: async (url: string, file: File) => {
    const response = await fetch(url, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });

    if (!response.ok) {
      throw new Error(`S3 Upload Error: ${response.status}`);
    }
    return response; // S3 doesn't return JSON
  },
};