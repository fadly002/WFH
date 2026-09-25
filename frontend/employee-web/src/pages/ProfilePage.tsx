import { type FormEvent, useEffect, useState } from 'react';
import { Button, Card, ErrorText, Field } from '../components/ui';
import { api, assetUrl } from '../lib/api';

interface Profile {
  id: string;
  name: string;
  email: string;
  position: string;
  phone: string;
  photoUrl: string | null;
}

export function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<Profile>('/employees/me')
      .then((data) => {
        setProfile(data);
        setPhone(data.phone);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Gagal memuat profil');
      });
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const form = new FormData();
      if (phone && phone !== profile?.phone) form.append('phone', phone);
      if (password) form.append('password', password);
      if (photo) form.append('photo', photo);

      const updated = await api<Profile>('/employees/me', {
        method: 'PATCH',
        formData: form,
      });
      setProfile(updated);
      setPassword('');
      setPhoto(null);
      setSuccess('Profil berhasil diperbarui');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan profil');
    } finally {
      setLoading(false);
    }
  }

  if (!profile) {
    return <p className="text-muted">Memuat profil…</p>;
  }

  return (
    <div className="grid gap-5 md:grid-cols-[280px_1fr]">
      <Card className="text-center">
        <img
          src={assetUrl(profile.photoUrl) ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=0F6B63&color=fff`}
          alt={profile.name}
          className="mx-auto h-32 w-32 rounded-full object-cover"
        />
        <h2 className="mt-4 font-display text-2xl">{profile.name}</h2>
        <p className="text-sm text-teal">{profile.position}</p>
        <p className="mt-1 text-sm text-muted">{profile.email}</p>
      </Card>

      <Card>
        <h3 className="font-display text-xl">Ubah data akun</h3>
        <p className="mt-1 text-sm text-muted">
          Foto, nomor handphone, dan password dapat diubah. Admin akan mendapat notifikasi.
        </p>
        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <Field label="Nama" value={profile.name} disabled />
          <Field label="Email perusahaan" value={profile.email} disabled />
          <Field label="Posisi" value={profile.position} disabled />
          <Field
            label="Nomor handphone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
          <Field
            label="Password baru"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Kosongkan jika tidak diubah"
          />
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-muted">Foto karyawan</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
            />
          </label>
          <ErrorText message={error} />
          {success ? <p className="text-sm text-teal">{success}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? 'Menyimpan…' : 'Simpan perubahan'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
