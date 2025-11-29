

/**
 * @description Custom hook to manage table data for any schema with pagination, filtering, sorting, and mutations.
 * Provides methods to fetch, create, update, and delete rows, as well as export data to CSV.
 * Implements state management for pagination, filters, and sorting to maintain a clean and reactive UI.
 */

import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../services/adminApi";

interface TableRow {
  id: number | string;
  [key: string]: any;
}

interface UseAdminTableDataParams {
  tableName: string;
  pageSize?: number;
}

export const useAdminTableData = ({
  tableName,
  pageSize = 50,
}: UseAdminTableDataParams) => {
  const [data, setData] = useState<TableRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: pageSize,
        sort,
        ...filters,
      };
      const result = await adminApi.getTableData(tableName, params);
      setData(result.results);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [tableName, page, pageSize, sort, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createRow = async (rowData: Record<string, any>) => {
    await adminApi.createRow(tableName, rowData);
    await fetchData();
  };

  const updateRow = async (id: number | string, rowData: Record<string, any>) => {
    await adminApi.updateRow(tableName, id, rowData);
    await fetchData();
  };

  const deleteRow = async (id: number | string) => {
    await adminApi.deleteRow(tableName, id);
    await fetchData();
  };

  const exportCSV = async () => {
    const blob = await adminApi.exportTableCSV(tableName, { sort, ...filters });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tableName}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return {
    data,
    total,
    page,
    setPage,
    filters,
    setFilters,
    sort,
    setSort,
    loading,
    error,
    createRow,
    updateRow,
    deleteRow,
    exportCSV,
    refresh: fetchData,
  };
};
  
