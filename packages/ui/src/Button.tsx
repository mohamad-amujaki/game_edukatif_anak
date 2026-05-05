import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: ReactNode;
  className?: string;
};

export function Button({
  variant = 'primary',
  children,
  className = '',
  ...rest
}: Props) {
  const base =
    'min-h-12 min-w-12 px-5 py-3 rounded-2xl font-semibold font-[family-name:var(--font-display)] text-lg transition active:scale-[0.98] disabled:opacity-50';
  const variants = {
    primary:
      'bg-[var(--color-primary-500)] text-white shadow-md hover:bg-[var(--color-primary-600)]',
    secondary:
      'bg-white border-2 border-[var(--color-primary-500)] text-[var(--color-primary-600)] shadow-sm',
    ghost: 'bg-transparent text-[var(--color-ink)] hover:bg-black/5',
  };
  return (
    <button
      type="button"
      className={`${base} ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
