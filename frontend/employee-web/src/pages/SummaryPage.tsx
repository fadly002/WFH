import { type FormEvent, useEffect, useState } from 'react';
import { Button, Card, ErrorText, Field } from '../components/ui';
import { api, formatDate, formatTime, monthStart, today } from '../lib/api';

interface SummaryRow {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
}

export function SummaryPage() {
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function search(nextFrom = from, nextTo = to) {
    setError(null);
    setLoading(true);
    try {
      const data = await api<{ rows: SummaryRow[] }>(
        `/attendance/summary?from=${nextFrom}&to=${nextTo}`,
      );
      setRows(data.rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat ringkasan');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void search();
  }, []);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void search();
  }

  return (
    <div className="space-y-5">
      <Card>
        <h2 className="font-display text-2xl">Summary absen</h2>
        <p className="text-sm text-muted">Default: awal bulan sampai hari ini.</p>
        <form className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={onSubmit}>
          <Field label="Dari" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Field label="Sampai" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <div className="flex items-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'Mencari…' : 'Cari'}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[520px] text-left">
          <thead className="bg-[#efe6d4] text-sm text-muted">
            <tr>
              <th className="px-5 py-3 font-medium">Tanggal</th>
              <th className="px-5 py-3 font-medium">Masuk</th>
              <th className="px-5 py-3 font-medium">Pulang</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.date} className="border-t border-line">
                <td className="px-5 py-3">{formatDate(row.date)}</td>
                <td className="px-5 py-3">
                  {row.checkIn ? `${row.date} ${formatTime(row.checkIn)}` : '—'}
                </td>
                <td className="px-5 py-3">
                  {row.checkOut ? `${row.date} ${formatTime(row.checkOut)}` : '—'}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="px-5 py-8 text-center text-muted" colSpan={3}>
                  Belum ada data absensi pada rentang ini
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
      <ErrorText message={error} />
    </div>
  );
}
