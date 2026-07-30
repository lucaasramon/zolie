'use client';

export class ApiError extends Error {
  code: string;
  status: number;
  issues?: unknown;

  constructor(message: string, status: number, code: string, issues?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.issues = issues;
  }
}

function getToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )zolie_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<{ data: T; meta?: unknown }> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api/v1${path}`, { ...options, headers, credentials: 'include' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = json?.error || {};
    throw new ApiError(err.message || 'Erro inesperado', res.status, err.code || 'UNKNOWN', err.issues);
  }
  return json;
}

async function upload<T>(path: string, file: File): Promise<{ data: T; meta?: unknown }> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`/api/v1${path}`, { method: 'POST', headers, body: formData, credentials: 'include' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = json?.error || {};
    throw new ApiError(err.message || 'Erro inesperado', res.status, err.code || 'UNKNOWN', err.issues);
  }
  return json;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, file: File) => upload<T>(path, file),
};
