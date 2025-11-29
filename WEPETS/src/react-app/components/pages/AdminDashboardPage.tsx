

/**
 * @description AdminDashboardPage component that serves as the main admin interface.
 * Auto-discovers all schemas and renders a table for each with full CRUD capabilities.
 * Implements admin guard logic to ensure only the owner can access this page.
 * Supports Add, Export, Edit, Delete operations and pagination for large datasets.
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "@hey-boss/users-service/react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAdminSchemas } from "../hooks/useAdminSchemas";
import { SchemaTable } from "../components/admin/SchemaTable";
import { adminApi } from "../services/adminApi";

export const AdminDashboardPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { schemaList, getSchema, loading: schemasLoading, error: schemasError } = useAdminSchemas();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [schemas, setSchemas] = useState<Record<string, any>>({});

  useEffect(() => {
    const checkAdmin = async () => {
      if (!authLoading && !user) {
        navigate("/login");
        return;
      }

      if (user) {
        try {
          const status = await adminApi.getAdminStatus();
          setIsAdmin(status.isAdmin);
        } catch (err) {
          setIsAdmin(false);
        }
      }
    };
    checkAdmin();
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const loadSchemas = async () => {
      const loaded: Record<string, any> = {};
      for (const tableName of schemaList) {
        const schema = await getSchema(tableName);
        loaded[tableName] = schema;
      }
      setSchemas(loaded);
    };
    if (schemaList.length > 0) {
      loadSchemas();
    }
  }, [schemaList, getSchema]);

  if (authLoading || isAdmin === null || schemasLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-700">Loading Admin Dashboard...</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Not an administrator</h1>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {schemasError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {schemasError}
          </div>
        )}

        {Object.entries(schemas).map(([tableName, schema]) => (
          <SchemaTable key={tableName} tableName={tableName} schema={schema} />
        ))}
      </div>
    </div>
  );
};
  
