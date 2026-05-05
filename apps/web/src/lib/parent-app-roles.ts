const ADMIN_STAFF = ['super_admin', 'content_editor', 'analyst'] as const;

/** Sesi lebih cocok untuk panel `/admin`, bukan app bermain anak di `/`. */
export function isStaffAdminRole(role: string | null | undefined): boolean {
  return (
    role != null && ADMIN_STAFF.includes(role as (typeof ADMIN_STAFF)[number])
  );
}
