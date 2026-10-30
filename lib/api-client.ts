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

async function request<T>(path: string, options: RequestInit = {}): Promise<{ data: T; meta?: unknown }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`/api/v1${path}`, { ...options, headers, credentials: 'include' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = json?.error || {};
    throw new ApiError(err.message || 'Erro inesperado', res.status, err.code || 'UNKNOWN', err.issues);
  }
  return json;
}

async function upload<T>(path: string, file: File): Promise<{ data: T; meta?: unknown }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`/api/v1${path}`, { method: 'POST', body: formData, credentials: 'include' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = json?.error || {};
    throw new ApiError(err.message || 'Erro inesperado', res.status, err.code || 'UNKNOWN', err.issues);
  }
  return json;
}

/** POST cuja resposta chega aos poucos, com um evento JSON por linha. */
async function stream<E>(path: string, body: unknown, aoEvento: (evento: E) => void): Promise<void> {
  const res = await fetch(`/api/v1${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });
  if (!res.ok || !res.body) {
    const json = await res.json().catch(() => ({}));
    const err = json?.error || {};
    throw new ApiError(err.message || 'Erro inesperado', res.status, err.code || 'UNKNOWN', err.issues);
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let pendente = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return;
    // Uma leitura pode trazer várias linhas, ou só um pedaço da linha.
    const linhas = (pendente + value).split('\n');
    pendente = linhas.pop() ?? '';
    for (const linha of linhas) {
      if (linha) aoEvento(JSON.parse(linha) as E);
    }
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, file: File) => upload<T>(path, file),
  stream: <E>(path: string, body: unknown, aoEvento: (evento: E) => void) => stream<E>(path, body, aoEvento),
};
