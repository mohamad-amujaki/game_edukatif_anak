import { prisma } from '../../server/db';

/** Kosongkan PIN singleton agar tes /parent deterministik walau tes sebelumnya gagal. */
export async function resetParentPinSingleton(): Promise<void> {
  await prisma.parentSettings.update({
    where: { id: 'singleton' },
    data: {
      pinHash: null,
      pinSetupQuestion: null,
      pinSetupAnswerHash: null,
      pinRecoveryTokenHash: null,
      pinRecoveryTokenExpires: null,
    },
  });
}
