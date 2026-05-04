import '../server/boot-env';
import { prisma } from '../server/db';
import { runWeeklyParentEmailJob } from '../server/services/weekly-parent-email';

async function main() {
  const r = await runWeeklyParentEmailJob();
  console.log(JSON.stringify(r, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
