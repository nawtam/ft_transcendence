export interface Moi {
    id: string;
    username: string;
  }
  
  export async function getMoi(): Promise<Moi> {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (!res.ok) {
      throw new Error('Non connecté');
    }
    const data = await res.json();
    return { id: String(data.id), username: data.username };
  }