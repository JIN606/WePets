

/**
 * @description Admin API service for handling all backend calls related to admin functionality.
 * Provides methods for schema discovery, CRUD operations, file uploads, and CSV exports.
 * This service centralizes all admin-related API calls for easy management and reusability.
 */

const API_BASE = "";

interface AdminStatus {
  isAdmin: boolean;
}

interface Schema {
  $id: string;
  type: string;
  title: string;
  description?: string;
  required?: string[];
  properties: Record<string, any>;
}

interface TableRow {
  id: number | string;
  [key: string]: any;
}

interface CreateRowPayload {
  [key: string]: any;
}

interface UpdateRowPayload {
  [key: string]: any;
}

export const adminApi = {
  async getAdminStatus(): Promise<AdminStatus> {
    const res = await fetch(`${API_BASE}/api/admin/status`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to check admin status");
    return res.json();
  },

  async listSchemas(): Promise<string[]> {
    const res = await fetch(`${API_BASE}/api/admin/schemas`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to list schemas");
    return res.json();
  },

  async getSchema(tableName: string): Promise<Schema> {
    const res = await fetch(`${API_BASE}/api/admin/schemas/${tableName}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Failed to get schema for ${tableName}`);
    return res.json();
  },

  async getTableData(
    tableName: string,
    params?: {
      page?: number;
      limit?: number;
      sort?: string;
      [key: string]: any;
    }
  ): Promise<{ results: TableRow[]; total: number }> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, String(value));
        }
      });
    }
    const res = await fetch(
      `${API_BASE}/api/tables/${tableName}?${query.toString()}`,
      {
        credentials: "include",
      }
    );
    if (!res.ok) throw new Error(`Failed to get table data for ${tableName}`);
    return res.json();
  },

  async createRow(tableName: string, data: CreateRowPayload): Promise<any> {
    const res = await fetch(`${API_BASE}/api/tables/${tableName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || `Failed to create row in ${tableName}`);
    }
    return res.json();
  },

  async updateRow(
    tableName: string,
    id: number | string,
    data: UpdateRowPayload
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/api/tables/${tableName}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(
        error.error || `Failed to update row ${id} in ${tableName}`
      );
    }
    return res.json();
  },

  async deleteRow(tableName: string, id: number | string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/tables/${tableName}/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(
        error.error || `Failed to delete row ${id} in ${tableName}`
      );
    }
    return res.json();
  },

  async uploadMedia(file: File): Promise<{ media_url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/api/upload/media`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to upload media");
    return res.json();
  },

  async uploadFile(file: File): Promise<{ file_url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/api/upload/file`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!res.ok) throw new Error("Failed to upload file");
    return res.json();
  },

  async exportTableCSV(
    tableName: string,
    params?: {
      sort?: string;
      [key: string]: any;
    }
  ): Promise<Blob> {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, String(value));
        }
      });
    }
    const res = await fetch(
      `${API_BASE}/api/tables/${tableName}/export?${query.toString()}`,
      {
        credentials: "include",
      }
    );
    if (!res.ok) throw new Error(`Failed to export CSV for ${tableName}`);
    return res.blob();
  },
};
  
