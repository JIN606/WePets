

/**
 * @description Custom hook to fetch and cache all schemas from the backend.
 * Provides methods to list all schemas and get individual schema details.
 * Implements caching to avoid redundant API calls and improve performance.
 */

import { useState, useEffect } from "react";
import { adminApi } from "../services/adminApi";

interface Schema {
  $id: string;
  type: string;
  title: string;
  description?: string;
  required?: string[];
  properties: Record<string, any>;
}

export const useAdminSchemas = () => {
  const [schemaList, setSchemaList] = useState<string[]>([]);
  const [schemaCache, setSchemaCache] = useState<Record<string, Schema>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchemas = async () => {
      try {
        setLoading(true);
        const list = await adminApi.listSchemas();
        setSchemaList(list);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load schemas");
      } finally {
        setLoading(false);
      }
    };
    fetchSchemas();
  }, []);

  const getSchema = async (tableName: string): Promise<Schema> => {
    if (schemaCache[tableName]) {
      return schemaCache[tableName];
    }
    const schema = await adminApi.getSchema(tableName);
    setSchemaCache((prev) => ({ ...prev, [tableName]: schema }));
    return schema;
  };

  return { schemaList, getSchema, loading, error };
};
  
