import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, ErrorText, Field } from '../components/ui';
import { api, setToken } from '../lib/api';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@dexagroup.com');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await api<{ accessToken: string; user: { role: string } }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        },
      );
      if (result.user.role !== 'ADMIN') {
        throw new Error('Portal ini hanya untuk admin HRD');
      }
      setToken(result.accessToken);
      navigate('/karyawan');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <p className="text-xs uppercase tracking-[0.2em] text-teal">Portal HRD</p>
      <h1 className="mt-2 font-display text-4xl">Monitoring karyawan</h1>
      <Card className="mt-8">
        <form className="space-y-4" onSubmit={onSubmit}>
          <Field
            label="Email admin"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <Field
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <ErrorText message={error} />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Memproses…' : 'Masuk'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
