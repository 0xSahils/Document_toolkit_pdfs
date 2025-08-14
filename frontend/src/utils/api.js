import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes timeout for large file operations
});

export const pdfApi = {
  merge: async (files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("pdfs", file);
    });

    const response = await api.post("/pdf/merge", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  split: async (file, pages = null) => {
    const formData = new FormData();
    formData.append("pdf", file);
    if (pages && pages.length > 0) {
      formData.append("pages", JSON.stringify(pages));
    }

    const response = await api.post("/pdf/split", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  compress: async (file, quality = 0.7) => {
    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("quality", quality.toString());

    const response = await api.post("/pdf/compress", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  convert: async (file, format = "png") => {
    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("format", format);

    const response = await api.post("/pdf/convert", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getInfo: async (file) => {
    const formData = new FormData();
    formData.append("pdf", file);

    const response = await api.get("/pdf/info", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getHistory: async (page = 1, limit = 10, operation = null) => {
    const params = { page, limit };
    if (operation) params.operation = operation;

    const response = await api.get("/pdf/history", { params });
    return response.data;
  },

  downloadFile: (filename) => {
    return `${API_BASE_URL}/pdf/download/${filename}`;
  },
};

export default api;
