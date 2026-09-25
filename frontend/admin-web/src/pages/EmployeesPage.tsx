import { type FormEvent, useEffect, useState } from 'react';
import { Button, Card, ErrorText, Field } from '../components/ui';
import { api, assetUrl } from '../lib/api';

interface Employee {
  id: string;
  name: string;
  email: string;
  position: string;
  phone: string;
  photoUrl: string | null;
}

const emptyForm = {
  name: '',
  email: '',
  password: '',
  position: '',
  phone: '',
};

export function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    const data = await api<Employee[]>('/admin/employees');
    setEmployees(data);
  }

  useEffect(() => {
    load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Gagal memuat karyawan');
    });
  }, []);

  function startEdit(employee: Employee) {
    setEditingId(employee.id);
    setForm({
      name: employee.name,
      email: employee.email,
      password: '',
      position: employee.position,
      phone: employee.phone,
    });
    setPhoto(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setPhoto(null);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value) payload.append(key, value);
      });
      if (photo) payload.append('photo', photo);

      if (editingId) {
        await api(`/admin/employees/${editingId}`, { method: 'PATCH', formData: payload });
      } else {
        await api('/admin/employees', { method: 'POST', formData: payload });
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan karyawan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-3xl">Data karyawan</h2>
        <p className="text-muted">Tambah atau perbarui profil karyawan.</p>
      </div>

      <Card>
        <h3 className="font-semibold">{editingId ? 'Ubah karyawan' : 'Tambah karyawan'}</h3>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <Field
            label="Nama"
            value={form.name}
            onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
            required={!editingId}
          />
          <Field
            label="Email perusahaan"
            type="email"
            value={form.email}
            onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
            required={!editingId}
          />
          <Field
            label="Posisi"
            value={form.position}
            onChange={(e) => setForm((c) => ({ ...c, position: e.target.value }))}
            required={!editingId}
          />
          <Field
            label="Nomor handphone"
            value={form.phone}
            onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
            required={!editingId}
          />
          <Field
            label={editingId ? 'Password baru (opsional)' : 'Password'}
            type="password"
            value={form.password}
            onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
            required={!editingId}
          />
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-muted">Foto</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
          </label>
          <div className="md:col-span-2 flex gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan…' : editingId ? 'Simpan perubahan' : 'Tambah karyawan'}
            </Button>
            {editingId ? (
              <Button type="button" variant="ghost" onClick={resetForm}>
                Batal
              </Button>
            ) : null}
          </div>
        </form>
        <div className="mt-3">
          <ErrorText message={error} />
        </div>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead className="bg-paper text-muted">
            <tr>
              <th className="px-4 py-3">Karyawan</th>
              <th className="px-4 py-3">Posisi</th>
              <th className="px-4 py-3">Telepon</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id} className="border-t border-line">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        assetUrl(employee.photoUrl) ??
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=16324F&color=fff`
                      }
                      alt={employee.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold">{employee.name}</p>
                      <p className="text-muted">{employee.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{employee.position}</td>
                <td className="px-4 py-3">{employee.phone}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" onClick={() => startEdit(employee)}>
                    Ubah
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
