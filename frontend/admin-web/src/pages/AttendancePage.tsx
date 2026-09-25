import { type FormEvent, useEffect, useState } from 'react';
import { Button, Card, ErrorText, Field } from '../components/ui';
import { api, formatTime, monthStart, today } from '../lib/api';

interface Row {
  employeeId: string;
  employeeName: string;
  email: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
}

export function AttendancePage() {
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function search() {
    setError(null);
    setLoading(true);
    try {
      const data = await api<{ rows: Row[] }>(`/admin/attendance?from=${from}&to=${to}`);
      setRows(data.rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat absensi');
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
      <div>
        <h2 className="font-display text-3xl">Absensi karyawan</h2>
        <p className="text-muted">Tampilan read-only seluruh absensi yang sudah disubmit.</p>
      </div>

      <Card>
        <form className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={onSubmit}>
          <Field label="Dari" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Field label="Sampai" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <div className="flex items-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'Memuat…' : 'Filter'}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-paper text-muted">
            <tr>
              <th className="px-4 py-3">Karyawan</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Masuk</th>
              <th className="px-4 py-3">Pulang</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.employeeId}-${row.date}`} className="border-t border-line">
                <td className="px-4 py-3">
                  <p className="font-semibold">{row.employeeName}</p>
                  <p className="text-muted">{row.email}</p>
                </td>
                <td className="px-4 py-3">{row.date}</td>
                <td className="px-4 py-3">{formatTime(row.checkIn)}</td>
                <td className="px-4 py-3">{formatTime(row.checkOut)}</td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-muted" colSpan={4}>
                  Tidak ada data absensi
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
