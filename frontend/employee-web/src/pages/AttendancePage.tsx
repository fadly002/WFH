import { useEffect, useMemo, useState } from 'react';
import { Button, Card, ErrorText } from '../components/ui';
import { api, formatTime, today } from '../lib/api';

interface SummaryRow {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
}

export function AttendancePage() {
  const [now, setNow] = useState(new Date());
  const [row, setRow] = useState<SummaryRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<'MASUK' | 'PULANG' | null>(null);

  async function loadToday() {
    const data = await api<{ rows: SummaryRow[] }>(
      `/attendance/summary?from=${today()}&to=${today()}`,
    );
    setRow(data.rows[0] ?? { date: today(), checkIn: null, checkOut: null });
  }

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    loadToday().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Gagal memuat absensi');
    });
    return () => window.clearInterval(timer);
  }, []);

  const clock = useMemo(
    () =>
      now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    [now],
  );

  async function clockAction(type: 'MASUK' | 'PULANG') {
    setError(null);
    setLoading(type);
    try {
      await api('/attendance/clock', {
        method: 'POST',
        body: JSON.stringify({ type }),
      });
      await loadToday();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal absen');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden bg-[linear-gradient(135deg,#0f6b63,#163a3a)] text-white">
        <p className="text-sm text-white/70">Hari ini</p>
        <p className="font-display text-5xl tracking-tight">{clock}</p>
        <p className="mt-2 text-white/80">
          {now.toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <p className="text-sm text-muted">Absen masuk</p>
          <p className="mt-2 font-display text-3xl">{formatTime(row?.checkIn ?? null)}</p>
          <Button
            className="mt-4"
            disabled={Boolean(row?.checkIn) || loading !== null}
            onClick={() => clockAction('MASUK')}
          >
            {loading === 'MASUK' ? 'Menyimpan…' : 'Absen masuk'}
          </Button>
        </Card>
        <Card>
          <p className="text-sm text-muted">Absen pulang</p>
          <p className="mt-2 font-display text-3xl">{formatTime(row?.checkOut ?? null)}</p>
          <Button
            variant="ghost"
            className="mt-4"
            disabled={!row?.checkIn || Boolean(row?.checkOut) || loading !== null}
            onClick={() => clockAction('PULANG')}
          >
            {loading === 'PULANG' ? 'Menyimpan…' : 'Absen pulang'}
          </Button>
        </Card>
      </div>
      <ErrorText message={error} />
    </div>
  );
}
