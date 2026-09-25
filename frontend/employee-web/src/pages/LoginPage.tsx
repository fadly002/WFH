import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, ErrorText, Field } from '../components/ui';
import { api, setToken } from '../lib/api';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('budi.santoso@dexagroup.com');
  const [password, setPassword] = useState('Karyawan123!');
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
      if (result.user.role !== 'EMPLOYEE') {
        throw new Error('Gunakan portal HRD untuk akun admin');
      }
      setToken(result.accessToken);
      navigate('/absen');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <p className="text-xs uppercase tracking-[0.22em] text-teal">Portal Karyawan</p>
      <h1 className="mt-2 font-display text-4xl leading-tight">Masuk untuk absen WFH</h1>
      <p className="mt-3 text-muted">Gunakan email perusahaan dan password akun Anda.</p>

      <Card className="mt-8">
        <form className="space-y-4" onSubmit={onSubmit}>
          <Field
            label="Email perusahaan"
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
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Memproses…' : 'Masuk'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
