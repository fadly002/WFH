import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger';
}) {
  const styles = {
    primary: 'bg-teal text-white hover:bg-teal-dark',
    ghost: 'bg-white/70 text-ink border border-line hover:bg-white',
    danger: 'bg-clay text-white hover:opacity-90',
  }[variant];

  return (
    <button
      className={`rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-muted">{label}</span>
      <input
        className="w-full rounded-2xl border border-line bg-white px-4 py-3 text-ink outline-none focus:border-teal"
        {...props}
      />
    </label>
  );
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-[28px] border border-line bg-card p-5 shadow-[0_18px_40px_rgba(27,36,48,0.06)] ${className}`}>
      {children}
    </section>
  );
}

export function ErrorText({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-2xl bg-[#fde8dc] px-4 py-3 text-sm text-clay">{message}</p>
  );
}
