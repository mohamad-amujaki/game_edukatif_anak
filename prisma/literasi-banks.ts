/**
 * Bank konten literasi (≥20 kombinasi per level/mode) untuk seed — konsisten dengan PRD-feature-literasi-question-bank.md
 */

function shuffleDeterministic<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (seed * 31 + i * 17) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type SusunQ = {
  gambarKey: string;
  gambarLabel: string;
  targetKata: string;
  sukuKataKepingan: string[];
};

export function susun2(
  gambarKey: string,
  gambarLabel: string,
  a: string,
  b: string,
  d1: string,
  d2: string,
  seed: number,
): SusunQ {
  const chips = shuffleDeterministic([a, b, d1, d2], seed);
  return {
    gambarKey,
    gambarLabel,
    targetKata: `${a} ${b}`,
    sukuKataKepingan: chips,
  };
}

/** Target tiga suku kata + satu keping pengganggu (empat keping total). */
export function susun3plus(
  gambarKey: string,
  gambarLabel: string,
  a: string,
  b: string,
  c: string,
  distractor: string,
  seed: number,
): SusunQ {
  const chips = shuffleDeterministic([a, b, c, distractor], seed);
  return {
    gambarKey,
    gambarLabel,
    targetKata: `${a} ${b} ${c}`,
    sukuKataKepingan: chips,
  };
}

/** TK literasi-1: cocokkan huruf–gambar (20 pasangan unik, huruf kapital). */
export function tkLiterasi1Pairs() {
  return [
    { huruf: 'A', gambarKey: 'apel', gambarLabel: 'Apel' },
    { huruf: 'B', gambarKey: 'bola', gambarLabel: 'Bola' },
    { huruf: 'C', gambarKey: 'cangkir', gambarLabel: 'Cangkir' },
    { huruf: 'D', gambarKey: 'daun', gambarLabel: 'Daun' },
    { huruf: 'E', gambarKey: 'eskrim', gambarLabel: 'Es krim' },
    { huruf: 'F', gambarKey: 'foto', gambarLabel: 'Foto' },
    { huruf: 'G', gambarKey: 'gajah', gambarLabel: 'Gajah' },
    { huruf: 'H', gambarKey: 'hati', gambarLabel: 'Hati' },
    { huruf: 'I', gambarKey: 'ikan', gambarLabel: 'Ikan' },
    { huruf: 'J', gambarKey: 'jeruk', gambarLabel: 'Jeruk' },
    { huruf: 'K', gambarKey: 'kucing', gambarLabel: 'Kucing' },
    { huruf: 'L', gambarKey: 'labu', gambarLabel: 'Labu' },
    { huruf: 'M', gambarKey: 'meja', gambarLabel: 'Meja' },
    { huruf: 'N', gambarKey: 'nanas', gambarLabel: 'Nanas' },
    { huruf: 'O', gambarKey: 'orang', gambarLabel: 'Orang' },
    { huruf: 'P', gambarKey: 'pisang', gambarLabel: 'Pisang' },
    { huruf: 'R', gambarKey: 'rumah', gambarLabel: 'Rumah' },
    { huruf: 'S', gambarKey: 'sekolah', gambarLabel: 'Sekolah' },
    { huruf: 'T', gambarKey: 'tidur', gambarLabel: 'Tidur' },
    { huruf: 'U', gambarKey: 'ular', gambarLabel: 'Ular' },
  ] as const;
}

/** TK literasi-2: dua suku kata + dua pengganggu. */
export function tkLiterasi2SusunQuestions(): SusunQ[] {
  return [
    susun2('bola', 'Bola', 'BO', 'LA', 'MA', 'PA', 1),
    susun2('rumah', 'Rumah', 'RU', 'MAH', 'BU', 'SAH', 2),
    susun2('pisang', 'Pisang', 'PI', 'SANG', 'SA', 'LANG', 3),
    susun2('jeruk', 'Jeruk', 'JE', 'RUK', 'RU', 'KUK', 4),
    susun2('apel', 'Apel', 'A', 'PEL', 'PAL', 'PIL', 5),
    susun2('kucing', 'Kucing', 'KU', 'CING', 'CA', 'ING', 6),
    susun2('ikan', 'Ikan', 'I', 'KAN', 'KA', 'MAN', 7),
    susun2('bebek', 'Bebek', 'BE', 'BEK', 'BA', 'CAK', 8),
    susun2('mobil', 'Mobil', 'MO', 'BIL', 'MI', 'LAK', 9),
    susun2('ayam', 'Ayam', 'A', 'YAM', 'AH', 'YUM', 10),
    susun2('bunga', 'Bunga', 'BU', 'NGA', 'BA', 'NGI', 11),
    susun2('meja', 'Meja', 'ME', 'JA', 'MI', 'JU', 12),
    susun2('kursi', 'Kursi', 'KUR', 'SI', 'KO', 'SA', 13),
    susun2('bintang', 'Bintang', 'BIN', 'TANG', 'TUNG', 'TENG', 14),
    susun2('hati', 'Hati', 'HA', 'TI', 'HU', 'TE', 15),
    susun2('pisang', 'Pisang', 'PI', 'SANG', 'PU', 'SONG', 16),
    susun2('jeruk', 'Jeruk', 'JE', 'RUK', 'JO', 'REK', 17),
    susun2('rumah', 'Rumah', 'RU', 'MAH', 'RI', 'MOH', 18),
    susun2('bola', 'Bola', 'BO', 'LA', 'BE', 'LI', 19),
    susun2('ikan', 'Ikan', 'I', 'KAN', 'U', 'KIN', 20),
  ];
}

/** TK literasi-3: tema rumah & sekitar. */
export function tkLiterasi3SusunQuestions(): SusunQ[] {
  return [
    susun2('meja', 'Meja', 'ME', 'JA', 'KA', 'LA', 101),
    susun2('kursi', 'Kursi', 'KUR', 'SI', 'LU', 'MI', 102),
    susun2('pisang', 'Pisang', 'PI', 'SANG', 'PU', 'SING', 103),
    susun2('apel', 'Apel', 'A', 'PEL', 'E', 'POL', 104),
    susun2('jeruk', 'Jeruk', 'JE', 'RUK', 'JU', 'ROK', 105),
    susun2('rumah', 'Rumah', 'RU', 'MAH', 'RA', 'MUH', 106),
    susun2('kucing', 'Kucing', 'KU', 'CING', 'KI', 'CONG', 107),
    susun2('ayam', 'Ayam', 'A', 'YAM', 'I', 'YOM', 108),
    susun2('bunga', 'Bunga', 'BU', 'NGA', 'BI', 'NGE', 109),
    susun2('meja', 'Meja', 'ME', 'JA', 'MA', 'JI', 110),
    susun2('kursi', 'Kursi', 'KUR', 'SI', 'KAR', 'SO', 111),
    susun2('bola', 'Bola', 'BO', 'LA', 'BU', 'LO', 112),
    susun2('mobil', 'Mobil', 'MO', 'BIL', 'MA', 'BEL', 113),
    susun2('pisang', 'Pisang', 'PI', 'SANG', 'PE', 'SENG', 114),
    susun2('bintang', 'Bintang', 'BIN', 'TANG', 'BEN', 'TING', 115),
    susun2('hati', 'Hati', 'HA', 'TI', 'HI', 'TA', 116),
    susun2('rumah', 'Rumah', 'RU', 'MAH', 'RE', 'MIH', 117),
    susun2('cangkir', 'Cangkir', 'CANG', 'KIR', 'KOR', 'KAR', 118),
    susun2('jeruk', 'Jeruk', 'JE', 'RUK', 'JI', 'RAK', 119),
    susun2('ikan', 'Ikan', 'I', 'KAN', 'O', 'KON', 120),
  ];
}

/** SD1 literasi-1: campuran dua dan tiga suku kata. */
export function sd1Literasi1SusunQuestions(): SusunQ[] {
  return [
    susun2('mobil', 'Mobil', 'MO', 'BIL', 'LA', 'TI', 201),
    susun3plus('sekolah', 'Sekolah', 'SE', 'KO', 'LAH', 'PA', 202),
    susun2('rumah', 'Rumah', 'RU', 'MAH', 'BU', 'SAH', 203),
    susun2('pisang', 'Pisang', 'PI', 'SANG', 'PU', 'SONG', 204),
    susun2('jeruk', 'Jeruk', 'JE', 'RUK', 'JO', 'REK', 205),
    susun2('apel', 'Apel', 'A', 'PEL', 'I', 'PAL', 206),
    susun3plus('perahu', 'Perahu', 'PE', 'RA', 'HU', 'BU', 207),
    susun2('ayam', 'Ayam', 'A', 'YAM', 'U', 'YUM', 208),
    susun2('kucing', 'Kucing', 'KU', 'CING', 'KI', 'KANG', 209),
    susun2('ikan', 'Ikan', 'I', 'KAN', 'U', 'KIN', 210),
    susun2('bebek', 'Bebek', 'BE', 'BEK', 'BA', 'BIK', 211),
    susun2('meja', 'Meja', 'ME', 'JA', 'MI', 'JU', 212),
    susun2('kursi', 'Kursi', 'KUR', 'SI', 'KAR', 'SU', 213),
    susun2('bunga', 'Bunga', 'BU', 'NGA', 'BI', 'NGI', 214),
    susun2('bintang', 'Bintang', 'BIN', 'TANG', 'BEN', 'TING', 215),
    susun3plus('sekolah', 'Sekolah', 'SE', 'KO', 'LAH', 'SI', 216),
    susun2('mobil', 'Mobil', 'MO', 'BIL', 'ME', 'BAL', 217),
    susun2('rumah', 'Rumah', 'RU', 'MAH', 'RO', 'MOH', 218),
    susun2('nanas', 'Nanas', 'NA', 'NAS', 'NO', 'NES', 219),
    susun2('pisang', 'Pisang', 'PI', 'SANG', 'PE', 'SENG', 220),
  ];
}

/** SD1 literasi-2: kata lebih panjang (utama tiga suku + variasi dua suku kompleks). */
export function sd1Literasi2SusunQuestions(): SusunQ[] {
  return [
    susun3plus('sekolah', 'Sekolah', 'SE', 'KO', 'LAH', 'PA', 301),
    susun3plus('perahu', 'Perahu', 'PE', 'RA', 'HU', 'BU', 302),
    susun3plus('pelangi', 'Pelangi', 'PE', 'LANG', 'I', 'U', 303),
    susun3plus('sekolah', 'Sekolah', 'SE', 'KO', 'LAH', 'TI', 304),
    susun2('mobil', 'Mobil', 'MO', 'BIL', 'MI', 'MAL', 305),
    susun3plus('pisang', 'Pisang', 'PI', 'SANG', 'PU', 'SUNG', 306),
    susun2('rumah', 'Rumah', 'RU', 'MAH', 'MU', 'MO', 307),
    susun2('jeruk', 'Jeruk', 'JE', 'RUK', 'JO', 'RAK', 308),
    susun2('apel', 'Apel', 'A', 'PEL', 'E', 'POL', 309),
    susun3plus('sekolah', 'Sekolah', 'SE', 'KO', 'LAH', 'NA', 310),
    susun2('kucing', 'Kucing', 'KU', 'CING', 'KI', 'CONG', 311),
    susun2('ikan', 'Ikan', 'I', 'KAN', 'O', 'KON', 312),
    susun2('bebek', 'Bebek', 'BE', 'BEK', 'BI', 'BAK', 313),
    susun3plus('perahu', 'Perahu', 'PE', 'RA', 'HU', 'HI', 314),
    susun3plus('pelangi', 'Pelangi', 'PE', 'LANG', 'I', 'E', 315),
    susun2('meja', 'Meja', 'ME', 'JA', 'MA', 'JI', 316),
    susun2('kursi', 'Kursi', 'KUR', 'SI', 'KO', 'SO', 317),
    susun2('bintang', 'Bintang', 'BIN', 'TANG', 'BUN', 'TING', 318),
    susun2('nanas', 'Nanas', 'NA', 'NAS', 'NI', 'NIS', 319),
    susun3plus('pelangi', 'Pelangi', 'PE', 'LANG', 'I', 'O', 320),
  ];
}

type BacaQ = {
  kalimat: string;
  audioKey: string;
  gambarBenar: string;
  gambarSalah: string[];
};

/** SD1 literasi-3: baca kalimat pendek + pilih gambar (dua distraktor). */
export function sd1Literasi3BacaQuestions(): BacaQ[] {
  return [
    {
      kalimat: 'Adik makan pisang',
      audioKey: '',
      gambarBenar: 'pisang',
      gambarSalah: ['tidur', 'main'],
    },
    {
      kalimat: 'Ayam di kebun',
      audioKey: '',
      gambarBenar: 'kebun',
      gambarSalah: ['kandang', 'rumah'],
    },
    {
      kalimat: 'Kucing minum susu',
      audioKey: '',
      gambarBenar: 'kucing',
      gambarSalah: ['ikan', 'bebek'],
    },
    {
      kalimat: 'Bola warna merah',
      audioKey: '',
      gambarBenar: 'bola',
      gambarSalah: ['pisang', 'jeruk'],
    },
    {
      kalimat: 'Ikan berenang di air',
      audioKey: '',
      gambarBenar: 'ikan',
      gambarSalah: ['kucing', 'bebek'],
    },
    {
      kalimat: 'Bebek berjalan di halaman',
      audioKey: '',
      gambarBenar: 'bebek',
      gambarSalah: ['ayam', 'ikan'],
    },
    {
      kalimat: 'Jeruk rasanya asam',
      audioKey: '',
      gambarBenar: 'jeruk',
      gambarSalah: ['apel', 'pisang'],
    },
    {
      kalimat: 'Apel warna merah',
      audioKey: '',
      gambarBenar: 'apel',
      gambarSalah: ['jeruk', 'nanas'],
    },
    {
      kalimat: 'Rumah ada pintunya',
      audioKey: '',
      gambarBenar: 'rumah',
      gambarSalah: ['sekolah', 'mobil'],
    },
    {
      kalimat: 'Mobil berwarna biru',
      audioKey: '',
      gambarBenar: 'mobil',
      gambarSalah: ['bola', 'jeruk'],
    },
    {
      kalimat: 'Sekolah tempat belajar',
      audioKey: '',
      gambarBenar: 'sekolah',
      gambarSalah: ['rumah', 'kebun'],
    },
    {
      kalimat: 'Meja untuk belajar',
      audioKey: '',
      gambarBenar: 'meja',
      gambarSalah: ['kursi', 'cangkir'],
    },
    {
      kalimat: 'Kursi untuk duduk',
      audioKey: '',
      gambarBenar: 'kursi',
      gambarSalah: ['meja', 'tidur'],
    },
    {
      kalimat: 'Bunga di dalam vas',
      audioKey: '',
      gambarBenar: 'bunga',
      gambarSalah: ['daun', 'jeruk'],
    },
    {
      kalimat: 'Bintang terlihat malam',
      audioKey: '',
      gambarBenar: 'bintang',
      gambarSalah: ['kucing', 'ikan'],
    },
    {
      kalimat: 'Nanas rasanya manis',
      audioKey: '',
      gambarBenar: 'nanas',
      gambarSalah: ['pisang', 'jeruk'],
    },
    {
      kalimat: 'Gajah hidungnya panjang',
      audioKey: '',
      gambarBenar: 'gajah',
      gambarSalah: ['ular', 'kucing'],
    },
    {
      kalimat: 'Ular melata di tanah',
      audioKey: '',
      gambarBenar: 'ular',
      gambarSalah: ['ikan', 'bebek'],
    },
    {
      kalimat: 'Orang sedang berlari',
      audioKey: '',
      gambarBenar: 'orang',
      gambarSalah: ['tidur', 'main'],
    },
    {
      kalimat: 'Daun berwarna hijau',
      audioKey: '',
      gambarBenar: 'daun',
      gambarSalah: ['bunga', 'apel'],
    },
  ];
}
