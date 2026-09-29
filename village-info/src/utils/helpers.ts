import { SESSION_ID_KEY } from '../constants';

export const getSessionId = (): string => {
  let id = localStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
};

export const maskMobile = (mobile: string): string => {
  if (!mobile || mobile.length < 4) return '******';
  return `******${mobile.slice(-4)}`;
};

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('hi-IN');
};

export const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string; errors?: string[] } } };
    return axiosError.response?.data?.message || axiosError.response?.data?.errors?.[0] || 'Something went wrong';
  }
  return 'Something went wrong';
};
