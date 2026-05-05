import '../apps/api/src/boot-env';
import { prisma } from '../apps/api/src/db';
import { runWeeklyParentEmailJob } from '../apps/api/src/services/weekly-parent-email';

async function main() {
  const r = await runWeeklyParentEmailJob();
  console.log(JSON.stringify(r, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
