/** Kunci gambar seed → emoji untuk UI tanpa asset raster */
export const ILLUSTRATION_EMOJI: Record<string, string> = {
  apel: '🍎',
  bola: '⚽',
  cangkir: '☕',
  meja: '🪑',
  kursi: '🪑',
  pisang: '🍌',
  tidur: '😴',
  main: '⚽',
  kebun: '🌳',
  kandang: '🏠',
  rumah: '🏠',
  mobil: '🚗',
  sekolah: '🏫',
  ayam: '🐔',
  bebek: '🦆',
  ikan: '🐟',
  kupu: '🦋',
  jeruk: '🍊',
  bunga: '🌸',
  kucing: '🐱',
  bintang: '⭐',
  hati: '❤️',
};

export function emojiForKey(key: string): string {
  return ILLUSTRATION_EMOJI[key] ?? '❓';
}
