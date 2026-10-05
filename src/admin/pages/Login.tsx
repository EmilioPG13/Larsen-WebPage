import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../services/adminApi';
import { loginErrorMessage } from '../services/apiError';
import { roleHome } from '../services/session';
import { useOptionalTheme } from '../../context/ThemeContext';
import { AdminLogo, Alert, Icon, Mark, type MarkName } from '../components/ui/kit';

// A fixed chart for the side panel: the same stitch vocabulary the panel uses for states.
const CHART: (MarkName | null)[] = [
  'dot', 'dot', 'ring', null, 'slash', 'ring', 'dot', null,
  'ring', 'dot', 'dot', 'ring', null, 'dot', 'slash', 'ring',
  null, 'ring', 'slash', 'dot', 'dot', 'ring', null, 'dot',
  'dot', null, 'ring', 'dot', 'ring', 'slash', 'dot', 'ring',
  'slash', 'dot', null, 'ring', 'dot', 'dot', 'ring', null,
  'ring', 'ring', 'dot', 'slash', null, 'ring', 'dot', 'dot',
];

const Login: React.FC = () => {
  const navigate = useNavigate();
  const theme = useOptionalTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user } = await adminApi.login(email, password);
      navigate(roleHome(user?.role ?? 'ADMIN'));
    } catch (err) {
      setError(loginErrorMessage(err, 'Error al iniciar sesión'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adm grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="adm-rail relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        <div className="flex flex-col gap-2">
          <AdminLogo height={44} onDark />
          <div className="text-[13px] text-(--a-rail-muted)">Panel interno</div>
        </div>

        <ul
          aria-hidden="true"
          className="m-0 grid max-w-md list-none grid-cols-8 gap-1 p-0 text-(--a-rail-ink)"
        >
          {CHART.map((mark, index) => (
            <li
              key={index}
              className="flex aspect-square items-center justify-center border border-(--a-rail-line)"
              style={mark === 'dot' ? { background: 'var(--a-rail-hover)' } : undefined}
            >
              {mark && <Mark name={mark} size={22} />}
            </li>
          ))}
        </ul>

        <p className="m-0 max-w-sm text-[13px] text-(--a-rail-muted)">
          Acceso del equipo de Larsen Italiana: inventario, leads y reportes.
        </p>
      </aside>

      <main className="relative flex items-center justify-center px-4 py-10 sm:px-8">
        {theme && (
          <button
            onClick={theme.toggleTheme}
            aria-label={theme.isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="adm-btn adm-btn-sm absolute right-4 top-4 sm:right-8 sm:top-8"
          >
            <Icon name={theme.isDark ? 'sun' : 'moon'} size={16} />
            {theme.isDark ? 'Claro' : 'Oscuro'}
          </button>
        )}

        <div className="w-full max-w-md">
        <div className="mb-6 text-a-navy lg:hidden">
          <div className="flex flex-col gap-2">
            <AdminLogo height={40} onDark={Boolean(theme?.isDark)} />
            <div className="text-[13px] text-a-muted">Panel interno</div>
          </div>
          <ul aria-hidden="true" className="adm-chart mt-4">
            {CHART.slice(0, 8).map((mark, index) => (
              <li key={index} data-mark={mark ?? undefined}>
                {mark && <Mark name={mark} size={14} />}
              </li>
            ))}
          </ul>
        </div>

        <div className="adm-panel">
          <div className="adm-dialog-head">
            <h1 className="adm-dialog-title">Panel de Administración</h1>
            <p className="adm-note">Larsen Italiana</p>
          </div>

          <form onSubmit={handleSubmit} className="adm-dialog-body space-y-5">
            {error && <Alert className="mb-0">{error}</Alert>}

            <div>
              <label htmlFor="email" className="adm-field-label">
                Correo electrónico
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                className="adm-input"
                placeholder="admin@larsenitaliana.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="adm-field-label">
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="adm-input"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={loading} className="adm-btn adm-btn-primary adm-btn-block">
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
