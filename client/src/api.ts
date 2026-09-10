export const API_ROOT = `${(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')}/api`;
const ROOT = API_ROOT;

export const getToken = () => localStorage.getItem('treasury_token');
export const setToken = (v: string) => localStorage.setItem('treasury_token', v);
export const clearToken = () => localStorage.removeItem('treasury_token');

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(ROOT + path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    const errorMsg =
      typeof body.error === 'object'
        ? body.error.message || body.error.code
        : body.error || 'Request failed';
    throw new Error(errorMsg);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function downloadCsv(
  path = '/reports/transactions.csv',
  filename = 'treasury-report.csv'
) {
  const token = getToken();
  const res = await fetch(ROOT + path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Export failed' }));
    throw new Error(typeof err.error === 'object' ? err.error.message : err.error || 'Export failed');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
