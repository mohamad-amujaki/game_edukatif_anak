import type { Track } from '@prisma/client';
import { prisma } from '../db';

function maskEmail(email: string): string {
  const [u, d] = email.split('@');
  if (!d || !u) return '***';
  const head = u.slice(0, Math.min(2, u.length));
  return `${head}***@${d}`;
}

async function buildChildSummary(childId: string): Promise<string> {
  const child = await prisma.childProfile.findUnique({
    where: { id: childId },
  });
  if (!child) return '';

  const [xp, streak, prog, actRows, masterRows] = await Promise.all([
    prisma.xpLog.aggregate({
      where: { childId },
      _sum: { amount: true },
    }),
    prisma.dailyStreak.findUnique({ where: { childId } }),
    prisma.progress.findMany({ where: { childId } }),
    prisma.activityDefinition.findMany({
      where: { level: { ageMode: child.ageMode } },
      select: { id: true, level: { select: { track: true } } },
    }),
    prisma.levelMastery.findMany({
      where: {
        childId,
        isMastered: true,
        level: { ageMode: child.ageMode },
      },
      include: { level: { select: { track: true } } },
    }),
  ]);

  const tracks: Track[] = ['literasi', 'math'];
  const masteredByTrack: Record<Track, number> = { literasi: 0, math: 0 };
  for (const m of masterRows) {
    masteredByTrack[m.level.track]++;
  }

  const lines: string[] = [];
  lines.push(`<h2 style="margin:16px 0 8px">${child.name}</h2>`);
  lines.push('<ul>');
  lines.push(`<li>Total XP: <strong>${xp._sum.amount ?? 0}</strong></li>`);
  lines.push(
    `<li>Streak: <strong>${streak?.currentStreak ?? 0}</strong> hari (terpanjang ${streak?.longestStreak ?? 0})</li>`,
  );
  lines.push(
    `<li>Aktivitas pernah selesai (≥1★): <strong>${prog.filter((p) => p.firstCompletedAt).length}</strong></li>`,
  );

  for (const track of tracks) {
    const actIds = new Set(
      actRows.filter((a) => a.level.track === track).map((a) => a.id),
    );
    const starsIn = prog.filter((p) => actIds.has(p.activityId));
    const avg =
      starsIn.length === 0
        ? 0
        : starsIn.reduce((s, p) => s + p.bestStars, 0) / starsIn.length;
    const label = track === 'literasi' ? 'Literasi' : 'Matematika';
    lines.push(
      `<li>${label}: rata-rata ⭐ <strong>${(Math.round(avg * 10) / 10).toFixed(1)}</strong> · level selesai sempurna: <strong>${masteredByTrack[track]}</strong></li>`,
    );
  }
  lines.push('</ul>');
  return lines.join('\n');
}

/**
 * Kirim satu email ringkasan untuk semua profil anak (singleton orang tua).
 * Membutuhkan `RESEND_API_KEY` dan `RESEND_FROM` (domain terverifikasi di Resend).
 */
export async function runWeeklyParentEmailJob(): Promise<{
  ok: boolean;
  sent: boolean;
  reason?: string;
}> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) {
    return {
      ok: true,
      sent: false,
      reason: 'RESEND_API_KEY atau RESEND_FROM tidak disetel',
    };
  }

  const settings = await prisma.parentSettings.findUnique({
    where: { id: 'singleton' },
  });
  if (!settings?.weeklyEmailOptIn || !settings.parentEmail?.trim()) {
    return {
      ok: true,
      sent: false,
      reason: 'Email mingguan nonaktif atau email kosong',
    };
  }

  const to = settings.parentEmail.trim();
  const children = await prisma.childProfile.findMany({
    orderBy: { createdAt: 'asc' },
  });
  if (children.length === 0) {
    return { ok: true, sent: false, reason: 'Belum ada profil anak' };
  }

  const blocks: string[] = [];
  for (const ch of children) {
    blocks.push(await buildChildSummary(ch.id));
  }

  const html = `
<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:16px">
  <h1>Ringkasan mingguan</h1>
  <p>Hai! Berikut cuplikan progres anak di aplikasi.</p>
  ${blocks.join('\n')}
  <p style="margin-top:24px;font-size:13px;color:#666">Email otomatis — Anda bisa mematikan ini di pengaturan area orang tua.</p>
</body></html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: 'Ringkasan mingguan — progres anak',
      html,
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    console.error('[weekly-parent-email] Resend error', res.status, t);
    return { ok: false, sent: false, reason: `Resend ${res.status}` };
  }

  console.info(
    '[weekly-parent-email] sent to',
    maskEmail(to),
    'children=',
    children.length,
  );
  return { ok: true, sent: true };
}
