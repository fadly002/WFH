import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { setToken } from '../lib/api';

const links = [
  { to: '/profil', label: 'Profil' },
  { to: '/absen', label: 'Absen' },
  { to: '/summary', label: 'Summary' },
];

export function Layout() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 pb-24 pt-6 md:pb-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-teal">Dexa Group</p>
          <h1 className="font-display text-2xl text-ink">Absensi WFH</h1>
        </div>
        <button
          className="text-sm font-semibold text-muted hover:text-ink"
          onClick={() => {
            setToken(null);
            navigate('/login');
          }}
        >
          Keluar
        </button>
      </header>

      <Outlet />

      <nav className="fixed inset-x-0 bottom-0 border-t border-line bg-card/95 px-4 py-3 backdrop-blur md:static md:mt-8 md:rounded-full md:border">
        <div className="mx-auto flex max-w-md justify-around">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold ${
                  isActive ? 'bg-teal text-white' : 'text-muted'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
