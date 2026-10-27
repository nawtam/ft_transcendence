import { Navigate } from 'react-router-dom';
import { useEffect, useState, type ReactNode } from 'react';
import { ensureMoi } from '../context/authSession';

export default function RequireAuth({ children }: { children: ReactNode }) {
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    ensureMoi().then((moi) => {
      if (!cancelled) setOk(!!moi);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (ok === null) return null;
  if (!ok) return <Navigate to="/connexion" replace />;
  return children;
}