import type { PrismaClient } from '@prisma/client';
import { prisma } from './db';

/** Model delegates only — safe for interactive `$transaction` callbacks. */
export type DbClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends' | '$use'
>;

export function defaultDb(db?: DbClient | PrismaClient): DbClient {
  return (db ?? prisma) as DbClient;
}
