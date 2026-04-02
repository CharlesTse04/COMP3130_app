import { useState, useEffect, useCallback } from 'react';
import { fetchSchoolData, SchoolGeoJSON } from '@/services/schoolApi';

export const useSchoolData = (maxFeatures: number = 10) => {
  const [data, setData] = useState<SchoolGeoJSON | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchSchoolData({ maxFeatures });
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch school data');
    } finally {
      setLoading(false);
    }
  }, [maxFeatures]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = () => {
    loadData();
  };

  return {
    data,
    loading,
    error,
    refresh,
  };
};