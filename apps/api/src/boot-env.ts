/**
 * Validasi env produksi sebelum `app` / `auth` dimuat (mencegah crash tanpa pesan jelas di Fly).
 */
if (process.env.NODE_ENV === 'production') {
  const missing: string[] = [];
  if (!process.env.DATABASE_URL?.trim()) missing.push('DATABASE_URL');
  if (
    !process.env.BETTER_AUTH_SECRET ||
    process.env.BETTER_AUTH_SECRET.length < 32
  ) {
    missing.push('BETTER_AUTH_SECRET (minimal 32 karakter)');
  }
  const authUrl = process.env.BETTER_AUTH_URL?.trim();
  if (!authUrl || !/^https?:\/\//i.test(authUrl)) {
    missing.push(
      'BETTER_AUTH_URL (URL publik https, mis. https://game-edukatif-anak.netlify.app)',
    );
  }
  if (!process.env.PIN_HASH_PEPPER?.trim()) {
    missing.push('PIN_HASH_PEPPER');
  }
  if (missing.length > 0) {
    console.error('[boot] Env produksi tidak lengkap:', missing.join('; '));
    console.error(
      '[boot] Contoh: fly secrets set DATABASE_URL="..." BETTER_AUTH_SECRET="..." BETTER_AUTH_URL="..." PIN_HASH_PEPPER="..."',
    );
    process.exit(1);
  }

  const authUrlLower = process.env.BETTER_AUTH_URL?.trim()?.toLowerCase() ?? '';
  if (authUrlLower.includes('.fly.dev') || authUrlLower.includes('localhost')) {
    console.warn(
      '[boot] BETTER_AUTH_URL sebaiknya sama dengan **origin yang dipakai browser** (mis. https://game-edukatif-anak.netlify.app jika frontend Netlify + proxy /api). Jika diisi URL API saja, login/cookie Better Auth sering gagal di produksi.',
    );
  }
  if (
    process.env.DATABASE_URL?.includes('pooled.db.prisma.io') &&
    !process.env.DATABASE_DIRECT_URL?.trim()
  ) {
    console.warn(
      '[boot] DATABASE_URL memakai Prisma Pooled. Set `DATABASE_DIRECT_URL` (URL Direct dari Prisma Console) agar `prisma migrate deploy` di Fly tidak P1001.',
    );
  }
}
