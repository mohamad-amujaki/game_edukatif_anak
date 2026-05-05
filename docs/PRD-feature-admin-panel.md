# PRD — Panel Admin (Manajemen Pengguna, Konten, Analytics)

**Versi dokumen**: 1.0
**Status**: Draft produk — siap direview PM, Eng Lead, & Privasi
**Tanggal**: 2026-05-02
**Produk induk**: [PRD.md](PRD.md) — Game Edukatif Anak
**Dependensi PRD**: [PRD-implementation-status.md](PRD-implementation-status.md), [PRD-recommended-backlog-levels-4-10.md](PRD-recommended-backlog-levels-4-10.md)
**Library otentikasi yang dikunci**: **[better-auth](https://www.better-auth.com)** (`better-auth` + `@better-auth/prisma-adapter` + plugin `admin()`)

---

## 1. Ringkasan eksekutif & tujuan

Panel Admin adalah area aplikasi yang dipakai **bukan oleh anak**, melainkan oleh dua kelompok:

1. **Admin Internal** (tim produk/kurikulum/QA): mengelola konten, melihat analytics agregat, mengelola admin lain, dan menjalankan operasi maintenance (audit log, import/export, panic-button konten).
2. **Super-Parent** (orang tua "lanjutan" di device keluarga): perpanjangan area parent saat ini dengan kemampuan tambahan terbatas pada **anak-anak di device-nya** (kelola anak lanjutan + ringkasan analytics anaknya).

**Tujuan bisnis**

- Mempercepat siklus produksi konten (edit bank soal & level tanpa rilis kode).
- Memberi visibilitas perilaku anak (DAU/MAU, retention, completion) untuk keputusan kurikulum & roadmap.
- Memenuhi kewajiban tata kelola: audit jejak perubahan, kontrol akses berbasis peran, kebijakan privasi anak.

**Tujuan kualitas**

- **Aman**: otentikasi & sesi dikelola oleh library yang teruji (better-auth), bukan implementasi tangan.
- **Auditable**: setiap perubahan (admin / super-parent) tercatat dengan diff before/after.
- **Cepat**: dashboard MVP <1.5 detik di SQLite untuk 1k profil.
- **Aman untuk anak**: admin tidak menampilkan PII anak yang tidak perlu (default agregat anonim).

---

## 2. Persona & peran

### 2.1 Admin Internal (akun email + password via better-auth)

| Role better-auth | Persona ringkas | Tanggung jawab |
| --- | --- | --- |
| `super_admin` | Pemilik produk / tech lead | Akses penuh, kelola admin lain, panic-button konten, lihat audit log, atur global settings. |
| `content_editor` | Kurator/penulis kurikulum | Edit level, aktivitas, bank soal; import/export; baca anak (anonim agregat). |
| `analyst` | Riset/PM analitik | Baca analytics & laporan agregat. Tidak mengubah apa pun. |

### 2.2 Super-Parent (PIN existing, bukan akun email)

- Dipromosikan dari area `/parent` lewat flag `ParentSettings.isSuperParent = true`.
- Login tetap memakai PIN existing (lihat [apps/api/src/parent-session.ts](../apps/api/src/parent-session.ts) & [apps/api/src/pin.ts](../apps/api/src/pin.ts)).
- **Tidak** memakai better-auth karena flow PIN-only tanpa email/password — PIN dirancang agar hambatan masuknya rendah untuk orang tua awam.

### 2.3 Yang BUKAN persona panel admin

- Anak (akan tetap memakai dashboard `/dashboard` & `/play/...`).
- Orang tua biasa tanpa flag super-parent.

---

## 3. Lingkup

### 3.1 In-scope (rilis dokumen ini, dipecah jadi gelombang G0..G4 di §12)

- Otentikasi & otorisasi admin internal via **better-auth** + plugin `admin()` (email + password, sesi, kelola admin lain, ban/unban, set role, set password).
- Penegakan permission via middleware Hono `requireAdminRole(roles[])`.
- Halaman `/admin/*` (TanStack Router) dengan layout `AdminShell`.
- CRUD anak lintas device (super_admin), kelola anak super-parent terbatas (lokal device).
- Editor level/aktivitas + **editor bank soal** (operasi item di array `payload.questions`/`payload.pairs`).
- Dashboard analytics dengan **5 metrik MVP** (DAU/MAU, retention D1/D7, completion per level, rata-rata bintang, total play time).
- **Audit log** + helper `recordAudit` untuk semua endpoint tulis admin.
- Pengaturan global aplikasi (mis. default time cap, panic-button "kunci konten").
- Import/export bank soal & konten dalam JSON (CSV opsional fase 2).

### 3.2 Out-of-scope (dokumen ini)

- 2FA admin (dicatat sebagai backlog post-MVP — better-auth punya plugin `twoFactor`).
- Reset password via email/SMTP (dicatat backlog; MVP: super_admin set password admin lain).
- Multi-tenant / multi-organisasi (saat ini single-instance device/keluarga).
- Sentry/observability eksternal (di luar lingkup PRD ini).
- Internasionalisasi panel admin (Bahasa Indonesia saja; pertimbangkan EN sebagai post-MVP).

---

## 4. Matriks izin (RBAC)

Roles `super_admin`, `content_editor`, `analyst` adalah role better-auth (admin plugin). `super_parent` adalah **flag PIN**, bukan role better-auth.

| Kapabilitas | super_admin | content_editor | analyst | super_parent |
| --- | :---: | :---: | :---: | :---: |
| Login `/admin/*` | ✅ | ✅ | ✅ | ❌ (pakai `/parent`) |
| Lihat daftar anak (lintas device) | ✅ | ✅ baca | ✅ baca | ❌ (hanya anak di device) |
| Edit/Hapus profil anak | ✅ | ❌ | ❌ | ✅ (anaknya saja) |
| Reset progress anak | ✅ | ❌ | ❌ | ✅ (anaknya saja) |
| Lihat sesi & detail aktivitas anak | ✅ | ✅ | ✅ | ✅ (anaknya saja) |
| Edit level (judul, urutan, prerequisite) | ✅ | ✅ | ❌ | ❌ |
| Edit aktivitas + payload | ✅ | ✅ | ❌ | ❌ |
| Edit bank soal (CRUD per item) | ✅ | ✅ | ❌ | ❌ |
| Dashboard analytics agregat | ✅ | ✅ ringkas | ✅ penuh | ✅ (anaknya) |
| Pengaturan global aplikasi | ✅ | ❌ | ❌ | ❌ |
| Audit log (lihat semua) | ✅ | ❌ (lihat aksinya sendiri) | ❌ (lihat aksinya sendiri) | ❌ (lihat aksinya sendiri) |
| Import/Export bank/konten | ✅ | ✅ | ❌ | ❌ |
| Kelola admin lain (create/ban/role) | ✅ | ❌ | ❌ | ❌ |
| Impersonasi user lain (off default) | ✅ (toggle) | ❌ | ❌ | ❌ |

Catatan: untuk granularitas lebih halus, gunakan API `access` & `statements` admin plugin better-auth (lihat §6.1).

---

## 5. Arsitektur teknis ringkas

```
Browser
  /admin/* (TanStack Router)
  /parent/* (existing)
        │
        ▼
Vite proxy → Hono API (port 3000)
  /api/auth/*    ← better-auth handler (sign-in, sessions, admin plugin)
  /api/admin/*   ← endpoint domain (anak, konten, bank, analytics, settings, audit, import/export)
  /api/...       ← endpoint gameplay existing (tidak berubah)
        │
        ▼
Prisma → SQLite
  - Tabel auth (User, Session, Account, Verification) — di-generate better-auth
  - Tabel kustom (AuditLog, AdminGlobalSettings) — ditulis manual
  - Tabel domain existing (ChildProfile, LevelDefinition, dll.)
```

---

## 6. Spesifikasi fitur per lingkup

### 6.1 Otentikasi & otorisasi (better-auth)

**Konfigurasi server** (`apps/api/src/auth.ts`):

```ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { prisma } from "./db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "sqlite" }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false, // setelah create-user oleh admin lain, jangan auto-login
  },
  plugins: [
    admin({
      defaultRole: "analyst",
      adminRoles: ["super_admin", "content_editor", "analyst"],
      // impersonationEnabled: false, // diaktifkan eksplisit di env staging saja
    }),
  ],
  session: {
    expiresIn: 60 * 60 * 8, // 8 jam
    updateAge: 60 * 60,     // perpanjang sliding tiap 1 jam
  },
  trustedOrigins: ["http://localhost:5173"],
  secret: process.env.BETTER_AUTH_SECRET,
});
```

**Mount di Hono** ([apps/api/src/app.ts](../apps/api/src/app.ts)):

```ts
import { auth } from "./auth";
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));
```

**Middleware `requireAdminRole`** (file baru `apps/api/src/admin-middleware.ts`):

```ts
import type { Context, Next } from "hono";
import { auth } from "./auth";

export const requireAdminRole = (roles: string[]) =>
  async (c: Context, next: Next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) return c.json({ error: "unauthenticated" }, 401);
    const role = session.user.role;
    if (!role || !roles.includes(role)) return c.json({ error: "forbidden" }, 403);
    c.set("adminUser", session.user);
    c.set("adminSession", session.session);
    await next();
  };
```

**Frontend** (`apps/web/src/lib/auth-client.ts`):

```ts
import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL ?? "/",
  plugins: [adminClient()],
});

export const { signIn, signOut, useSession } = authClient;
```

**Bootstrap admin pertama** (`scripts/admin-create.ts`):

```ts
// pnpm admin:create -- --email a@b.c --password 'StrongPass!' --role super_admin
import { auth } from "../apps/api/src/auth";
const args = parseArgs(process.argv.slice(2));
const u = await auth.api.createUser({
  body: { email: args.email, password: args.password, name: args.name ?? args.email, role: args.role },
});
console.log("Created user:", u.user.id);
```

**Super-parent (PIN, tetap)**: helper `requireSuperParent()` memvalidasi cookie sesi PIN existing dan memeriksa `ParentSettings.isSuperParent === true`.

### 6.2 Manajemen anak

- Daftar anak (lintas device untuk admin internal; hanya device-lokal untuk super-parent).
- Detail anak: ringkasan progres, level mastery, daftar `PlaySession` terbaru, sticker/badge yang sudah didapat.
- Aksi: edit (nama, mode, avatar), hapus, **reset progress** (soft, dengan konfirmasi & audit).
- Filter: aktif dalam X hari, mode TK/SD1, jalur progres tertinggi.

### 6.3 Manajemen konten level/aktivitas

- List level dengan filter `track`, `ageMode`, `order`.
- Edit metadata level: `title`, `description`, `iconKey`, urutan, `voiceOverKeys`.
- Edit `ActivityDefinition`: `title`, `type`, `voiceOverKeys`, `estimatedSec`, `payload` (full JSON, divalidasi via Zod yang ada di [apps/api/src/schemas.ts](../apps/api/src/schemas.ts)).
- **Preview** payload sebelum simpan (rendering ringkas tipe per tipe).

### 6.4 Editor bank soal

- Endpoint granular per item (lihat §6.10) memudahkan UX "tambah/edit/hapus satu kartu" tanpa mengirim seluruh array.
- Validator memastikan setiap item memenuhi skema sesuai `ActivityType` (mis. `HITUNG_BENDA` butuh `gambarKey`, `jumlah`, opsi).
- Indikator "berapa item" + tombol "uji acak 6" untuk mensimulasikan satu sesi.

### 6.5 Dashboard analytics (5 metrik MVP)

| Metrik | Definisi | Sumber data |
| --- | --- | --- |
| DAU / MAU | distinct `childId` di `PlaySession` per hari / 30 hari | `PlaySession` |
| Retention D1/D7 | cohort `ChildProfile.createdAt` → kembali main pada hari ke-1 / ke-7 | `ChildProfile` + `PlaySession` |
| Completion per level | rasio `LevelMastery.isMastered = true` per `LevelDefinition` | `LevelMastery`, `LevelDefinition` |
| Rata-rata bintang per aktivitas | `avg(Progress.bestStars)` group by `activityId` | `Progress` |
| Total play time | sum `PlaySession.durationSec` per hari/30 hari | `PlaySession` |

Caching ringan di sisi handler (5 menit, in-memory) untuk overview agar dashboard tidak menyiksa SQLite.

### 6.6 Pengaturan global aplikasi

`AdminGlobalSettings` (singleton). Field MVP:

- `defaultDailyTimeCapMinutes` — dipakai sebagai default saat `ParentSettings` belum di-set.
- `defaultBreakReminderMinutes` — sda.
- `contentLockedForEdit` — **panic-button**: bila true, semua endpoint tulis konten/bank menolak (kecuali super_admin).

### 6.7 Audit log

`AuditLog` mencatat: actor (admin atau super-parent), aksi, entity, diff before/after, IP, UA. Daftar event minimal:

- `child.delete`, `child.update`, `child.reset-progress`
- `level.update`
- `activity.payload.update`
- `bank.item.create`, `bank.item.update`, `bank.item.delete`, `bank.bulk.replace`
- `settings.update`
- `admin.create`, `admin.role.update`, `admin.ban`, `admin.unban`, `admin.password.set`, `admin.session.revoke`
- `import.run`, `export.run`

UI: tabel paginasi + filter (actor, entity, rentang tanggal); tombol "lihat diff" per baris.

### 6.8 Import/Export

- **Export bank** per aktivitas: `GET /api/admin/export/bank/:activityId` → JSON `{ activity, items }`.
- **Export semua konten**: `GET /api/admin/export/all` → JSON `{ levels, activities, banks }`. Cocok untuk backup & seeding ulang.
- **Import bank**: `POST /api/admin/import/bank` body `{ activityId, items, mode: "replace"|"append" }`. Setiap item divalidasi Zod sebelum tulis. Gagal-cepat dengan daftar error per index.
- CSV opsional di fase 2 (untuk konten teks ringan).

### 6.9 UI/UX & navigasi (`/admin/*`) — lihat §10.

### 6.10 Endpoint Hono (referensi lengkap)

**Diserahkan ke better-auth** (otomatis, tidak ditulis tangan):

| Method | Path | Catatan |
| --- | --- | --- |
| POST | `/api/auth/sign-in/email` | login admin |
| POST | `/api/auth/sign-out` | logout |
| GET  | `/api/auth/get-session` | sesi saat ini |
| POST | `/api/auth/admin/create-user` | super_admin only |
| GET  | `/api/auth/admin/list-users` | super_admin only |
| POST | `/api/auth/admin/set-role` | super_admin only |
| POST | `/api/auth/admin/ban-user` | super_admin only |
| POST | `/api/auth/admin/unban-user` | super_admin only |
| POST | `/api/auth/admin/set-user-password` | super_admin only |
| POST | `/api/auth/admin/remove-user` | super_admin only |
| POST | `/api/auth/admin/revoke-user-sessions` | super_admin only |
| POST | `/api/auth/admin/impersonate-user` | super_admin only, default OFF |
| POST | `/api/auth/admin/stop-impersonating` | sda. |

**Endpoint domain** (`/api/admin/*`, semua dilindungi `requireAdminRole`):

```
# Anak
GET    /api/admin/children?activeWithin=30d&mode=TK&q=nama
GET    /api/admin/children/:id
PATCH  /api/admin/children/:id            { name?, ageMode?, avatarKey? }
DELETE /api/admin/children/:id
POST   /api/admin/children/:id/reset-progress
GET    /api/admin/children/:id/sessions?cursor=

# Konten
GET    /api/admin/levels
PATCH  /api/admin/levels/:id              { title?, description?, iconKey?, order? }
GET    /api/admin/activities/:id
PATCH  /api/admin/activities/:id          { title?, voiceOverKeys?, estimatedSec?, payload? }

# Bank soal (granular)
GET    /api/admin/activities/:id/bank
PUT    /api/admin/activities/:id/bank     { items: [...] }     # ganti seluruh bank (atomic)
POST   /api/admin/activities/:id/bank/items
PATCH  /api/admin/activities/:id/bank/items/:idx
DELETE /api/admin/activities/:id/bank/items/:idx

# Analytics
GET /api/admin/analytics/overview
GET /api/admin/analytics/retention
GET /api/admin/analytics/level-completion
GET /api/admin/analytics/avg-stars
GET /api/admin/analytics/play-time

# Settings global
GET   /api/admin/settings
PATCH /api/admin/settings

# Audit
GET /api/admin/audit-log?cursor=&actor=&actorType=ADMIN|SUPER_PARENT&entityType=&from=&to=  (ISO 8601)

# Import/Export
POST /api/admin/import/bank
GET  /api/admin/export/bank/:activityId
GET  /api/admin/export/all
```

Skema Zod untuk request/response endpoint admin diletakkan di file baru **`apps/api/src/schemas.admin.ts`** agar terpisah dari skema gameplay.

### 6.11 Skema Prisma (final)

Tambahkan ke `prisma/schema.prisma`. Model auth di-generate `npx @better-auth/cli generate`; model `AuditLog` & `AdminGlobalSettings` ditulis manual. Field `isSuperParent` ditambahkan ke `ParentSettings` lewat migration eksplisit.

```prisma
// === auto-generated by @better-auth/cli (admin plugin enabled) ===
model User {
  id            String    @id
  email         String    @unique
  emailVerified Boolean   @default(false)
  name          String
  image         String?
  // dari plugin admin:
  role          String?   // "super_admin" | "content_editor" | "analyst"
  banned        Boolean?  @default(false)
  banReason     String?
  banExpires    DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  sessions      Session[]
  accounts      Account[]
}

model Session {
  id             String   @id
  userId         String
  token          String   @unique
  expiresAt      DateTime
  ipAddress      String?
  userAgent      String?
  impersonatedBy String?  // dari admin plugin
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}

model Account {
  id           String  @id
  userId       String
  accountId    String
  providerId   String  // "credential" untuk email+password
  password     String? // bcrypt — dikelola better-auth
  // ... field OAuth (tidak dipakai sekarang)
  user         User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
}

model Verification {
  id         String   @id
  identifier String
  value      String
  expiresAt  DateTime
  @@index([identifier])
}

// === ditulis manual ===
enum AuditActor {
  ADMIN
  SUPER_PARENT
}

model AuditLog {
  id         String     @id @default(cuid())
  actorType  AuditActor
  actorId    String
  actorEmail String?    // snapshot agar log tetap terbaca walau user dihapus
  action     String     // "child.delete", "activity.payload.update", ...
  entityType String
  entityId   String
  beforeJson String?
  afterJson  String?
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime   @default(now())

  @@index([entityType, entityId])
  @@index([createdAt])
  @@index([actorType, actorId])
}

model AdminGlobalSettings {
  id                          String   @id @default("singleton")
  defaultDailyTimeCapMinutes  Int      @default(30)
  defaultBreakReminderMinutes Int      @default(20)
  contentLockedForEdit        Boolean  @default(false)
  updatedAt                   DateTime @updatedAt
  updatedByUserId             String?
}
```

Migration `ParentSettings`:

```prisma
model ParentSettings {
  // ... field existing ...
  isSuperParent Boolean @default(false) // ditambahkan migration baru
}
```

Catatan:
- `ChildProfile` **tidak** diubah dan **tidak** menjadi `User` better-auth. Anak adalah resource device-lokal tanpa akun email.
- Tabel `User`/`Session`/`Account`/`Verification` dipakai **khusus admin internal**.

---

## 7. Analytics — definisi metrik & sumber data

(Diringkas dari §6.5 + tambahan operasional)

- **Definisi DAU "anak aktif"**: minimal **satu submit aktivitas pada hari itu** (pakai `Progress.lastPlayedAt` atau `PlaySession`). Definisi dapat dikalibrasi setelah 2 minggu data; lihat §15 pertanyaan terbuka.
- **Privasi**: agregat tidak menampilkan nama lengkap. Detail per anak hanya muncul saat membuka halaman detail anak (audit dicatat).
- **Performa**: query agregat memakai indeks yang sudah ada (`Progress.activityId`, `PlaySession.childId+dateKey`, `LevelMastery.childId`). Cache server-side 5 menit untuk overview.

---

## 8. Audit log — skema & event

Skema model lihat §6.11. Helper:

```ts
async function recordAudit(c: Context, params: {
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
}) {
  const adminUser = c.get("adminUser") as { id: string; email: string } | undefined;
  const superParent = c.get("superParent") as { deviceId: string } | undefined;
  await prisma.auditLog.create({
    data: {
      actorType: adminUser ? "ADMIN" : "SUPER_PARENT",
      actorId: adminUser?.id ?? superParent?.deviceId ?? "unknown",
      actorEmail: adminUser?.email ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      beforeJson: params.before ? JSON.stringify(params.before) : null,
      afterJson: params.after ? JSON.stringify(params.after) : null,
      ipAddress: c.req.header("x-forwarded-for") ?? null,
      userAgent: c.req.header("user-agent") ?? null,
    },
  });
}
```

Daftar event terstruktur (lihat §6.7) dipakai sebagai konstanta string `AuditActions` agar typo terhindar.

Retensi default: **180 hari** + cron pembersih bulanan + endpoint `GET /api/admin/export/audit?from=&to=` di fase 2.

---

## 9. Import/Export — format & validasi

**Format export bank**:

```json
{
  "activity": {
    "id": "tk-math-1-act-1",
    "type": "HITUNG_BENDA",
    "title": "Hitung benda di taman"
  },
  "items": [
    { "gambarKey": "apel", "jumlah": 3, "opsi": [2,3,4,5], "jawaban": 3 }
  ],
  "exportedAt": "2026-05-02T01:30:00.000Z",
  "exportedBy": "admin@example.com"
}
```

**Format export all**: `{ levels: [...], activities: [...], banks: [{activityId, items}] }`.

**Import**:
- Mode `"replace"` → atomic; kegagalan validasi membatalkan seluruh batch.
- Mode `"append"` → tambahan di akhir; gagal item tertentu hanya melaporkan, sisanya tetap masuk (opsional, default `replace`).
- Setiap item divalidasi Zod sesuai `ActivityType`. Pesan error mengikuti pola `{ index: 3, path: ["jawaban"], message: "expected number" }`.

---

## 10. UI/UX & navigasi

**Routes** (TanStack Router di [apps/web/src/router.tsx](../apps/web/src/router.tsx)):

```
/admin/login
/admin                         dashboard kartu metrik utama
/admin/children
/admin/children/:id
/admin/content                 daftar level & aktivitas
/admin/content/activities/:id  editor metadata + payload
/admin/banks/:activityId       editor bank (kartu per item)
/admin/analytics
/admin/settings                global settings (super_admin)
/admin/audit                   audit log + filter
/admin/import-export
/admin/users                   kelola admin lain (super_admin)
```

- **Layout `AdminShell`** (`apps/web/src/features/admin/AdminShell.tsx`): top-nav dengan menu role-aware (item disembunyikan jika role tidak punya akses).
- **Guard route**: `beforeLoad` memanggil `authClient.getSession()` — bila tidak ada sesi → redirect `/admin/login`; bila role kurang → render halaman 403.
- **Super-parent**: tetap di `/parent`, dengan tab tambahan `/parent/super` saat `isSuperParent` true. Tidak pernah memakai rute `/admin/*`.
- **Bahasa**: panel admin dalam **Bahasa Indonesia** (konsisten dengan area lain). Kosakata teknis dipertahankan dalam Inggris bila lazim (mis. "DAU", "retention").

---

## 11. Keamanan, privasi, kepatuhan anak

- **Secret**: `BETTER_AUTH_SECRET` (min. 32 karakter acak) wajib di env; tidak pernah di-commit. Rotate prosedur didokumentasikan operasional.
- **Cookie sesi**: better-auth default `SameSite=Lax`, `Secure` di produksi.
- **Sesi**: 8 jam dengan sliding 1 jam; tombol "logout semua sesi" memanggil `authClient.admin.revokeUserSessions` untuk user manapun (super_admin) atau diri sendiri.
- **Brute-force**: andalkan throttling default better-auth + rate-limit Hono di endpoint `/api/auth/sign-in/email` (tambahan).
- **Privasi anak**:
  - Dashboard agregat memakai metrik tanpa nama.
  - Halaman detail anak menunjukkan nama → akses dicatat di audit.
  - Tidak ada pengiriman data anak ke pihak ketiga.
- **Hapus anak**: hard delete `ChildProfile` (cascade ke `Progress`, `LevelMastery`, dll. sesuai schema existing) atau soft-delete? **MVP**: hard delete dengan modal konfirmasi & audit. (Pertimbangan retensi data ada di §15.)
- **Impersonasi**: default OFF; bila diaktifkan staging, sesi impersonasi memiliki banner mencolok dan header `X-Admin-Impersonating`.

---

## 12. Rollout & migrasi (gelombang G0..G4)

| Gelombang | Lingkup |
| --- | --- |
| **G0 — Setup** | `pnpm add better-auth @better-auth/prisma-adapter`; tulis `apps/api/src/auth.ts`; jalankan `npx @better-auth/cli generate --output prisma/schema.prisma`; review diff; `pnpm prisma migrate dev -n add_better_auth`; mount `/api/auth/*`; buat `scripts/admin-create.ts`; smoke test login. |
| **G1 — RBAC + Anak + Audit** | `requireAdminRole`; `AdminShell`; `/admin/login`, `/admin`, `/admin/children` (CRUD + reset progress); `AuditLog` + helper `recordAudit`; `/admin/audit` view dasar. |
| **G2 — Konten + Bank** | `/admin/content`, `/admin/banks/:activityId`; import/export JSON bank. |
| **G3 — Analytics + Settings** | `/admin/analytics` (5 metrik); `/admin/settings` global. |
| **G4 — Admin lain & Super-Parent** | `/admin/users` (memakai `authClient.admin.*`); flag `ParentSettings.isSuperParent` + tab `/parent/super`; (opsional) ekspor CSV. |

**Migrasi data**: tidak ada data legacy admin yang perlu dimigrasikan. Untuk first-deploy, jalankan `pnpm admin:create` membuat satu `super_admin` lalu reset password lewat panel.

---

## 13. Acceptance criteria

1. `pnpm admin:create --email admin@example.com --password 'StrongPass!1' --role super_admin` membuat satu user di tabel `User` dan login `/admin/login` berhasil mengarah ke `/admin`.
2. Sesi better-auth tampak di tabel `Session` dengan `expiresAt` ≈ 8 jam dari sekarang dan `userAgent`/`ipAddress` terisi.
3. Tiga role (`super_admin`, `content_editor`, `analyst`) dapat login dan **hanya** melihat menu sesuai matriks izin §4.
4. Endpoint `/api/admin/*` mengembalikan **401** tanpa sesi, **403** dengan role tidak diizinkan, **200** dengan role yang diizinkan.
5. Editor bank soal menyimpan perubahan ke `ActivityDefinition.payload` (valid Zod), dan permainan langsung memakai bank baru pada sesi berikutnya tanpa restart server.
6. Setiap aksi tulis admin (PATCH/POST/DELETE) tercatat di `AuditLog` dengan `beforeJson`/`afterJson`, `actorEmail`, `ipAddress`, `userAgent`.
7. Dashboard analytics MVP memuat **5 metrik** dalam **<1.5 detik** untuk dataset 1k profil di SQLite (cache aktif).
8. Super-parent dengan PIN tidak dapat mengakses `/admin/*` (return 403); tab `/parent/super` muncul ketika `isSuperParent = true`.
9. Import bank JSON: file valid berhasil; file tidak valid menampilkan error per index dengan path Zod.
10. `super_admin` dapat memanggil `authClient.admin.revokeUserSessions(userId)` dan user yang dimaksud terkena dampak (request berikutnya 401).
11. Toggle `contentLockedForEdit` di global settings menolak (423/403) endpoint tulis konten/bank kecuali bagi `super_admin`.

---

## 14. Risiko & mitigasi

| Risiko | Mitigasi |
| --- | --- |
| Editor bank merusak payload aktivitas | Validasi Zod ketat per `ActivityType` + preview sebelum simpan + audit diff. |
| Sesi admin tertinggal di perangkat keluarga | Default expiry 8 jam + tombol "logout semua sesi" + opsi `super_admin` revoke paksa. |
| Audit log membengkak | Retensi 180 hari + endpoint export + cron pembersih. |
| `BETTER_AUTH_SECRET` bocor → semua sesi bisa dipalsukan | Secret hanya di env, tidak di-commit, prosedur rotate didokumentasikan, monitoring akses sesi tidak biasa. |
| Lock-in better-auth | Skema auth dikelola library; mitigasi → simpan migration Prisma yang dihasilkan ke git, dokumentasikan field plugin agar bisa di-fork bila perlu. |
| Brute-force login | Rate-limit Hono pada `/api/auth/sign-in/email` + lockout user setelah N gagal lewat plugin admin (`ban-user` manual atau policy otomatis fase 2). |
| Privasi anak tertulis di log | Audit menyimpan diff JSON — pastikan tidak menulis field yang tidak perlu (mis. seluruh history); atur whitelist field. |
| Impersonasi disalahgunakan | Default OFF; banner mencolok di UI saat aktif; setiap aksi impersonasi dicatat di `AuditLog` dengan flag khusus. |

---

## 15. Pertanyaan terbuka

1. **Reset password via email**: aktifkan SMTP + plugin `emailVerification` di MVP, atau tunda ke post-MVP? Default dokumen: tunda.
2. **2FA admin**: aktifkan plugin `twoFactor` better-auth segera setelah MVP G1, atau tunda ke G4? Default: tunda hingga G4 lalu opsional.
3. **CSV export/import** di gelombang awal vs JSON saja? Default: JSON saja, CSV fase 2.
4. **Definisi DAU**: minimal satu submit, atau cukup buka aplikasi (event "app_open")? Default: minimal satu submit.
5. **Hapus anak**: hard delete cascade vs soft delete (`deletedAt`)? Default: hard delete + audit. Diskusi privasi & GDPR-ish memutuskan apakah hard delete sah dipertahankan.
6. **Impersonasi user**: aktifkan di staging saja? Default ya. Apakah perlu di produksi untuk dukungan pelanggan? Default tidak.
7. **`adminUserIds` static fallback**: gunakan env var sebagai daftar user ID super-admin "tetap" (anti-lockout) atau cukup percaya DB? Default: tidak — bootstrap script + dokumentasi recovery.
8. **Multi-bahasa panel admin**: perlu EN selain ID? Default tidak untuk MVP.

---

## 16. Lampiran: checklist engineer per gelombang

### G0 — Setup better-auth

- [ ] `pnpm add better-auth @better-auth/prisma-adapter`
- [ ] Tambah env: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- [ ] Buat `apps/api/src/auth.ts` (lihat §6.1)
- [ ] `npx @better-auth/cli generate --output prisma/schema.prisma`
- [ ] Review diff schema; tambah model manual `AuditLog` & `AdminGlobalSettings`; tambah field `isSuperParent` ke `ParentSettings`
- [ ] `pnpm prisma migrate dev -n add_better_auth`
- [ ] Mount `/api/auth/*` di [apps/api/src/app.ts](../apps/api/src/app.ts)
- [ ] Buat `apps/web/src/lib/auth-client.ts`
- [ ] Buat `scripts/admin-create.ts` + skrip `pnpm admin:create`
- [ ] Smoke test: create user → login via `authClient.signIn.email` → `getSession`

### G1 — RBAC + Anak + Audit dasar

- [ ] `apps/api/src/admin-middleware.ts` (`requireAdminRole`, `requireSuperParent`)
- [ ] Helper `recordAudit` + konstanta `AuditActions`
- [ ] `apps/web/src/features/admin/AdminShell.tsx`
- [ ] Routes `/admin/login`, `/admin`, `/admin/children`, `/admin/children/:id`, `/admin/audit`
- [ ] Endpoint `/api/admin/children*` + `/api/admin/audit-log`
- [ ] Guard route TanStack `beforeLoad` cek sesi & role
- [ ] Tes manual matriks izin

### G2 — Konten + Bank + Import/Export

- [ ] Routes `/admin/content`, `/admin/content/activities/:id`, `/admin/banks/:activityId`, `/admin/import-export`
- [ ] Endpoint `/api/admin/levels*`, `/api/admin/activities*`, `/api/admin/activities/:id/bank*`
- [ ] Endpoint import/export JSON
- [ ] Validator Zod per `ActivityType`
- [ ] UI preview payload sebelum simpan

### G3 — Analytics + Settings

- [ ] Endpoint `/api/admin/analytics/*` + cache 5 menit
- [ ] Routes `/admin/analytics`, `/admin/settings`
- [ ] UI grafik sederhana (DAU/MAU bar, retention table, completion bar)
- [ ] Toggle `contentLockedForEdit` + penegakan di endpoint tulis

### G4 — Admin lain + Super-Parent + Polishing

- [ ] Routes `/admin/users` memakai `authClient.admin.listUsers`/`createUser`/`setRole`/`banUser`/`setUserPassword`/`revokeUserSessions`
- [ ] Tab `/parent/super` (guard via `requireSuperParent`)
- [ ] (Opsional) Ekspor CSV
- [ ] (Opsional) Plugin `twoFactor`
- [ ] Audit retensi cron

---

## 17. Status implementasi (audit terhadap repo)

**Kesimpulan: PRD belum 100% terimplementasi.** Yang sudah jalan: autentikasi better-auth; API `/api/admin/*` untuk anak (termasuk detail), konten, bank dengan validasi per jenis aktivitas ([apps/api/src/bank-validation.ts](../apps/api/src/bank-validation.ts)), import/export bank + export all, analytics (bundle + endpoint turunan), settings global + `checkContentLock`, **`GET/PATCH /api/admin/parent-settings`** (hanya `super_admin`) untuk flag **`ParentSettings.isSuperParent`**; UI **Settings** ([AdminSettingsPage.tsx](../apps/web/src/features/admin/AdminSettingsPage.tsx)) memuat blok pengaturan global dan blok PIN/super-orang tua; **lima metrik MVP** di [apps/api/src/services/admin-analytics.ts](../apps/api/src/services/admin-analytics.ts) di dashboard + `/admin/analytics`; UI konten/editor aktivitas/editor bank; halaman **audit** ([AdminAuditPage.tsx](../apps/web/src/features/admin/AdminAuditPage.tsx)) dengan kolom **tipe actor** (`ADMIN`, `SUPER_PARENT`, …), filter waktu (**from**/**to**), dan untuk **super_admin** filter **entityType** / **actorType**; jejak audit super-orang tua di [apps/api/src/audit.ts](../apps/api/src/audit.ts) (`recordSuperParentAudit`) untuk perubahan profil anak / reset progres dari PIN; guard API super-parent [denyUnlessSuperParent](../apps/api/src/parent-super-guard.ts). Yang masih gap utama: preview payload khusus di UI (“kartu per item”), grafik retensi sesuai §10 (opsional), benchmark SLA §13 #7, serta polish matriks analyst vs konten di beberapa endpoint.

| Gelombang | Selesai? | Bukti / gap |
| --- | --- | --- |
| **G0** | **Hampir penuh** | Ada `better-auth`, `apps/api/src/auth.ts`, `disableSignUp: true` (bukan pendaftaran publik), mount `/api/auth/*`, `User`/`Session`/`Account`/`Verification`, [apps/web/src/lib/auth-client.ts](../apps/web/src/lib/auth-client.ts), [scripts/admin-create.ts](../scripts/admin-create.ts) (Prisma + `hashPassword` dari `better-auth/crypto`). Env: [.env.example](../.env.example). Skema auth bisa juga di-regenerate via `pnpm auth:generate`. |
| **G1** | **Sebagian** | Ada [apps/api/src/admin-middleware.ts](../apps/api/src/admin-middleware.ts), [apps/api/src/audit.ts](../apps/api/src/audit.ts), [apps/api/src/admin.ts](../apps/api/src/admin.ts). Nav shell + sidebar role-aware; [router](../apps/web/src/router.tsx) punya **`/admin/children/$childId`** ([AdminChildDetailPage.tsx](../apps/web/src/features/admin/AdminChildDetailPage.tsx)); [AdminAuditPage.tsx](../apps/web/src/features/admin/AdminAuditPage.tsx) fungsional. **Belum / parsial:** checklist §16 menyebut nama `requireSuperParent` — di kode guard bernama **`denyUnlessSuperParent`** ([parent-super-guard.ts](../apps/api/src/parent-super-guard.ts)); matriks analyst vs konten belum dipetakan penuh di semua rute. |
| **G2** | **Sebagian (inti konten/bank kuat)** | Endpoint level/aktivitas/bank/import/export di [apps/api/src/admin.ts](../apps/api/src/admin.ts); validasi bank via [bank-validation.ts](../apps/api/src/bank-validation.ts). UI: [AdminContentPage.tsx](../apps/web/src/features/admin/AdminContentPage.tsx), editor aktivitas/bank, [AdminImportExportPage.tsx](../apps/web/src/features/admin/AdminImportExportPage.tsx) (bukan placeholder). **Belum:** preview payload khusus di UI; editor bank tetap berbasis JSON utuh untuk beberapa kasus. |
| **G3** | **Sebagian** | Analytics + cache seperti sebelumnya; [AdminSettingsPage.tsx](../apps/web/src/features/admin/AdminSettingsPage.tsx) terhubung ke API (global + blok PIN super-orang tua untuk `super_admin`). **Belum:** grafik batang/tabel retensi seperti checklist §16 G3 (opsional). |
| **G4** | **Sebagian** | [AdminUsersPage.tsx](../apps/web/src/features/admin/AdminUsersPage.tsx) memakai better-auth admin API; rute **`/parent/super`** ada di [router](../apps/web/src/router.tsx); flag **`isSuperParent`** dapat diatur dari admin (`/admin/settings`) dan dicek di **`denyUnlessSuperParent`**. **Belum:** ekspor CSV (opsional); plugin 2FA (opsional); audit retensi cron. |

### Acceptance criteria §13 (singkat)

| # | Status | Catatan |
| --- | --- | --- |
| 1 | Sebagian | Bootstrap: `pnpm admin:create -- --email … --password …` (role tetap `super_admin`; tidak ada flag `--role`). |
| 2–4 | Manual | Login & sesi: uji lewat `/admin/login` + cookie. |
| 5 | Parsial | Bank di-validasi per jenis aktivitas di server ([bank-validation.ts](../apps/api/src/bank-validation.ts)); UI tetap banyak berbasis JSON; verifikasi “permainan pakai bank baru tanpa restart server” bersifat manual. |
| 6 | Parsial | `recordAudit` + untuk PIN super-orang tua `recordSuperParentAudit`; tidak semua path diverifikasi E2E. |
| 7 | Sebagian | **Lima metrik MVP** ada di API & UI ([router](../apps/web/src/router.tsx) dashboard + `/admin/analytics`); cache 5 menit. **SLA &lt;1,5 dtk @ 1k profil SQLite** belum diverifikasi otomatis / benchmark. |
| 8 | Parsial | Rute **`/parent/super`** + guard **`denyUnlessSuperParent`** + audit super-parent; **`isSuperParent`** dapat diatur **`super_admin`** lewat **`/admin/settings`** / **`PATCH /api/admin/parent-settings`**. |
| 9 | Tidak | Import JSON error per-index belakangan sesuai PRD. |
| 10 | Manual | Revoke sesi lewat better-auth admin API / UI belum di-shell. |
| 11 | Parsial | `contentLockedForEdit` + 423 untuk non–super_admin pada tulis konten/bank. |

---

*Cara memelihara dokumen ini*: setiap gelombang yang selesai dirilis, perbarui [PRD-implementation-status.md](PRD-implementation-status.md) dan tandai checklist §16 di sini sebagai selesai.
