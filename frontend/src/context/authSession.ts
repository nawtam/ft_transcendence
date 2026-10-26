export interface Moi {
  id: string;
  username: string;
}

export async function getMoi(): Promise<Moi> {
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  if (!res.ok) throw new Error('Non connecté');
  const data = await res.json();
  return { id: String(data.id), username: data.username };
}

export async function refreshSession(): Promise<boolean> {
  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  });
  return res.ok;
}

export async function ensureMoi(): Promise<Moi | null> {
  try {
    return await getMoi();
  } catch {
    if (!(await refreshSession())) return null;
    try {
      return await getMoi();
    } catch {
      return null;
    }
  }
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
}