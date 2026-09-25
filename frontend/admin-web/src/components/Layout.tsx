import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { getToken, setToken } from '../lib/api';

interface Notice {
  title: string;
  message: string;
  at: string;
}

export function Layout() {
  const navigate = useNavigate();
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const socket = io(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/notifications`, {
      auth: { token },
    });

    socket.on('profile.updated', (payload: Notice) => {
      setNotice(payload);
      window.setTimeout(() => setNotice(null), 8000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-line bg-navy px-5 py-6 text-white md:min-h-screen md:border-b-0">
        <p className="text-xs uppercase tracking-[0.2em] text-white/60">Dexa Group</p>
        <h1 className="mt-1 font-display text-2xl">HRD Monitor</h1>
        <nav className="mt-6 flex gap-3 md:flex-col">
          <NavLink
            to="/karyawan"
            className={({ isActive }) =>
              `rounded-xl px-3 py-2 text-sm ${isActive ? 'bg-white/15' : 'text-white/70'}`
            }
          >
            Data karyawan
          </NavLink>
          <NavLink
            to="/absensi"
            className={({ isActive }) =>
              `rounded-xl px-3 py-2 text-sm ${isActive ? 'bg-white/15' : 'text-white/70'}`
            }
          >
            Absensi
          </NavLink>
        </nav>
        <button
          className="mt-6 text-sm text-white/70 hover:text-white"
          onClick={() => {
            setToken(null);
            navigate('/login');
          }}
        >
          Keluar
        </button>
      </aside>

      <main className="px-4 py-6 md:px-8">
        {notice ? (
          <div className="mb-4 rounded-2xl border border-clay/30 bg-[#fff4ec] px-4 py-3">
            <p className="text-sm font-semibold text-clay">{notice.title}</p>
            <p className="text-sm text-ink">{notice.message}</p>
          </div>
        ) : null}
        <Outlet />
      </main>
    </div>
  );
}
