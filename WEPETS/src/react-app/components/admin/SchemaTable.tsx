

/**
 * @description Reusable SchemaTable component that renders a table for any schema.
 * Supports all field types, Add/Edit/Delete operations, Export, and uses CustomForm for forms.
 * Handles file/media upload and rich_text editing with react-quill.
 * Implements pagination for tables with more than 50 rows.
 */

import React, { useState, useEffect } from "react";
import { Edit2, Trash2, Plus, Download } from "lucide-react";
import { useAdminTableData } from "../../hooks/useAdminTableData";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { adminApi } from "../../services/adminApi";

interface Schema {
  $id: string;
  type: string;
  title: string;
  description?: string;
  required?: string[];
  properties: Record<string, any>;
}

interface SchemaTableProps {
  tableName: string;
  schema: Schema;
}

export const SchemaTable: React.FC<SchemaTableProps> = ({
  tableName,
  schema,
}) => {
  const {
    data,
    total,
    page,
    setPage,
    sort,
    setSort,
    loading,
    error,
    createRow,
    updateRow,
    deleteRow,
    exportCSV,
  } = useAdminTableData({ tableName });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const fields = Object.entries(schema.properties).filter(
    ([key, prop]: [string, any]) => !prop.readOnly
  );

  const allFields = Object.entries(schema.properties);

  const totalPages = Math.ceil(total / 50);

  const handleAdd = () => {
    setFormData({});
    setIsAddModalOpen(true);
  };

  const handleEdit = (row: any) => {
    setEditingRow(row);
    setFormData({ ...row });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: number | string) => {
    if (confirm("Are you sure you want to delete this row?")) {
      try {
        await deleteRow(id);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete row");
      }
    }
  };

  const handleSaveAdd = async () => {
    try {
      await createRow(formData);
      setIsAddModalOpen(false);
      setFormData({});
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create row");
    }
  };

  const handleSaveEdit = async () => {
    try {
      await updateRow(editingRow.id, formData);
      setIsEditModalOpen(false);
      setEditingRow(null);
      setFormData({});
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update row");
    }
  };

  const renderField = (key: string, prop: any, value: any, onChange: (val: any) => void) => {
    if (prop.readOnly) {
      return <input type="text" value={value || ""} disabled className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-600" />;
    }

    if (key === "rich_text" || prop.format === "rich_text") {
      return <ReactQuill value={value || ""} onChange={onChange} theme="snow" className="bg-white" />;
    }

    if (key === "media_url" || prop.format === "media_url") {
      return (
        <div>
          <input
            type="file"
            accept="image/*,video/*"
            onChange={async (e) => {
              if (e.target.files && e.target.files[0]) {
                const res = await adminApi.uploadMedia(e.target.files[0]);
                onChange(res.media_url);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
          {value && <img src={value} alt="preview" className="mt-2 max-w-xs" />}
        </div>
      );
    }

    if (key === "file_url" || prop.format === "file_url") {
      return (
        <div>
          <input
            type="file"
            onChange={async (e) => {
              if (e.target.files && e.target.files[0]) {
                const res = await adminApi.uploadFile(e.target.files[0]);
                onChange(res.file_url);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
          {value && <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{value}</a>}
        </div>
      );
    }

    if (prop.type === "integer" || prop.type === "number") {
      return <input type="number" value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />;
    }

    if (prop.format === "date-time") {
      return <input type="datetime-local" value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />;
    }

    if (prop.type === "boolean" || key === "checkbox") {
      return <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked ? 1 : 0)} className="w-5 h-5" />;
    }

    if (prop.format === "email") {
      return <input type="email" value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />;
    }

    return <input type="text" value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded" />;
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">{schema.title}</h2>
        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Add New
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {loading && <p className="text-gray-600">Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Operations</th>
                  {allFields.map(([key, prop]: [string, any]) => (
                    <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      {prop.title || key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((row) => (
                  <tr key={row.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(row)} className="text-blue-600 hover:text-blue-800">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(row.id)} className="text-red-600 hover:text-red-800">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    {allFields.map(([key]) => (
                      <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {key === "rich_text" ? (
                          <div dangerouslySetInnerHTML={{ __html: row[key] || "" }} className="max-w-xs truncate" />
                        ) : (
                          String(row[key] || "")
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Add New Row</h3>
            {fields.map(([key, prop]: [string, any]) => (
              <div key={key} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {prop.title || key}
                </label>
                {renderField(key, prop, formData[key], (val) => setFormData({ ...formData, [key]: val }))}
              </div>
            ))}
            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAdd}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Edit Row</h3>
            {allFields.map(([key, prop]: [string, any]) => (
              <div key={key} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {prop.title || key}
                </label>
                {renderField(key, prop, formData[key], (val) => setFormData({ ...formData, [key]: val }))}
              </div>
            ))}
            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
  
