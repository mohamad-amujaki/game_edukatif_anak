import bcrypt from 'bcryptjs';

const pepper = () => process.env.PIN_HASH_PEPPER ?? '';

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pepper() + pin, 12);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pepper() + pin, hash);
}

export async function hashAnswer(answer: string): Promise<string> {
  return bcrypt.hash(pepper() + answer.toLowerCase().trim(), 10);
}

export async function verifyAnswer(
  answer: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(pepper() + answer.toLowerCase().trim(), hash);
}
