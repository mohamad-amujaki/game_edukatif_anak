/**
 * Bank literasi Level 4–10 (≥20 entri per level) — melengkapi literasi-banks.ts
 */

import {
  type SusunQ,
  sd1Literasi3BacaQuestions,
  susun2,
  susun3plus,
  tkLiterasi1Pairs,
} from './literasi-banks';

type BacaQ = {
  kalimat: string;
  audioKey: string;
  gambarBenar: string;
  gambarSalah: string[];
};

/** TK literasi 4 — tema hewan & alam */
export function tkLiterasi4SusunQuestions(): SusunQ[] {
  return [
    susun2('bebek', 'Bebek', 'BE', 'BEK', 'BI', 'BAK', 401),
    susun2('ikan', 'Ikan', 'I', 'KAN', 'U', 'KIN', 402),
    susun2('kucing', 'Kucing', 'KU', 'CING', 'KI', 'KANG', 403),
    susun2('ayam', 'Ayam', 'A', 'YAM', 'O', 'YOM', 404),
    susun2('gajah', 'Gajah', 'GA', 'JAH', 'JU', 'JIH', 405),
    susun2('ular', 'Ular', 'U', 'LAR', 'LA', 'LIR', 406),
    susun2('kupu', 'Kupu', 'KU', 'PU', 'PO', 'PI', 407),
    susun2('jeruk', 'Jeruk', 'JE', 'RUK', 'JO', 'RAK', 408),
    susun2('pisang', 'Pisang', 'PI', 'SANG', 'PU', 'SUNG', 409),
    susun2('apel', 'Apel', 'A', 'PEL', 'E', 'PAL', 410),
    susun2('nanas', 'Nanas', 'NA', 'NAS', 'NO', 'NIS', 411),
    susun2('bunga', 'Bunga', 'BU', 'NGA', 'BI', 'NGO', 412),
    susun2('daun', 'Daun', 'DA', 'UN', 'DI', 'DON', 413),
    susun2('meja', 'Meja', 'ME', 'JA', 'MI', 'JU', 414),
    susun2('bola', 'Bola', 'BO', 'LA', 'BU', 'LI', 415),
    susun2('rumah', 'Rumah', 'RU', 'MAH', 'RI', 'MOH', 416),
    susun2('mobil', 'Mobil', 'MO', 'BIL', 'ME', 'MAL', 417),
    susun3plus('sekolah', 'Sekolah', 'SE', 'KO', 'LAH', 'PA', 418),
    susun3plus('perahu', 'Perahu', 'PE', 'RA', 'HU', 'BU', 419),
    susun3plus('pelangi', 'Pelangi', 'PE', 'LANG', 'I', 'U', 420),
  ];
}

/** TK literasi 5 — tema sekolah (gambar: gunakan kunci yang ada di emoji-map + buku/pensil/gunting) */
export function tkLiterasi5SusunQuestions(): SusunQ[] {
  return [
    susun2('buku', 'Buku', 'BU', 'KU', 'BA', 'KO', 501),
    susun2('meja', 'Meja', 'ME', 'JA', 'MA', 'JI', 502),
    susun2('kursi', 'Kursi', 'KUR', 'SI', 'SU', 'SO', 503),
    susun2('pensil', 'Pensil', 'PEN', 'SIL', 'SOL', 'SAL', 504),
    susun2('gunting', 'Gunting', 'GUN', 'TING', 'TUNG', 'TANG', 505),
    susun3plus('sekolah', 'Sekolah', 'SE', 'KO', 'LAH', 'NA', 506),
    susun2('mobil', 'Mobil', 'MO', 'BIL', 'MI', 'BEL', 507),
    susun2('bola', 'Bola', 'BO', 'LA', 'BE', 'LO', 508),
    susun2('apel', 'Apel', 'A', 'PEL', 'I', 'POL', 509),
    susun2('jeruk', 'Jeruk', 'JE', 'RUK', 'JU', 'ROK', 510),
    susun2('pisang', 'Pisang', 'PI', 'SANG', 'PE', 'SENG', 511),
    susun2('rumah', 'Rumah', 'RU', 'MAH', 'RO', 'MUH', 512),
    susun2('ayam', 'Ayam', 'A', 'YAM', 'U', 'YUM', 513),
    susun2('ikan', 'Ikan', 'I', 'KAN', 'O', 'KON', 514),
    susun2('kucing', 'Kucing', 'KU', 'CING', 'KA', 'KUNG', 515),
    susun2('bunga', 'Bunga', 'BU', 'NGA', 'BO', 'NGI', 516),
    susun2('bintang', 'Bintang', 'BIN', 'TANG', 'BUN', 'TING', 517),
    susun3plus('perahu', 'Perahu', 'PE', 'RA', 'HU', 'HI', 518),
    susun3plus('pelangi', 'Pelangi', 'PE', 'LANG', 'I', 'E', 519),
    susun2('nanas', 'Nanas', 'NA', 'NAS', 'NI', 'NOS', 520),
  ];
}

/** TK literasi 6 — variasi suku kata */
export function tkLiterasi6SusunQuestions(): SusunQ[] {
  return [
    susun2('cangkir', 'Cangkir', 'CANG', 'KIR', 'KOR', 'KAR', 601),
    susun2('tidur', 'Tidur', 'TI', 'DUR', 'TU', 'TOR', 602),
    susun2('main', 'Main', 'MA', 'IN', 'MI', 'MAN', 603),
    susun2('hati', 'Hati', 'HA', 'TI', 'HU', 'TA', 604),
    susun2('foto', 'Foto', 'FO', 'TO', 'FA', 'TU', 605),
    susun2('orang', 'Orang', 'O', 'RANG', 'U', 'RING', 606),
    susun2('labu', 'Labu', 'LA', 'BU', 'LU', 'BI', 607),
    susun2('eskrim', 'Es krim', 'ES', 'KRIM', 'IS', 'KRAM', 608),
    susun2('kursi', 'Kursi', 'KUR', 'SI', 'KAR', 'SA', 609),
    susun2('meja', 'Meja', 'ME', 'JA', 'MA', 'JI', 610),
    susun2('pisang', 'Pisang', 'PI', 'SANG', 'PU', 'SONG', 611),
    susun2('jeruk', 'Jeruk', 'JE', 'RUK', 'JO', 'REK', 612),
    susun2('apel', 'Apel', 'A', 'PEL', 'E', 'PIL', 613),
    susun2('bola', 'Bola', 'BO', 'LA', 'BU', 'LO', 614),
    susun2('rumah', 'Rumah', 'RU', 'MAH', 'RI', 'MIH', 615),
    susun3plus('sekolah', 'Sekolah', 'SE', 'KO', 'LAH', 'SI', 616),
    susun3plus('mobil', 'Mobil', 'MO', 'BIL', 'LA', 'TI', 617),
    susun3plus('perahu', 'Perahu', 'PE', 'RA', 'HU', 'HO', 618),
    susun3plus('pelangi', 'Pelangi', 'PE', 'LANG', 'I', 'O', 619),
    susun2('bebek', 'Bebek', 'BE', 'BEK', 'BA', 'BIK', 620),
  ];
}

/** TK literasi 7 — baca kalimat sangat pendek */
export function tkLiterasi7BacaQuestions(): BacaQ[] {
  return [
    {
      kalimat: 'Ini apel merah',
      audioKey: '',
      gambarBenar: 'apel',
      gambarSalah: ['jeruk', 'pisang'],
    },
    {
      kalimat: 'Kucing tidur',
      audioKey: '',
      gambarBenar: 'tidur',
      gambarSalah: ['main', 'bola'],
    },
    {
      kalimat: 'Bebek berenang',
      audioKey: '',
      gambarBenar: 'bebek',
      gambarSalah: ['ikan', 'ayam'],
    },
    {
      kalimat: 'Bola bundar',
      audioKey: '',
      gambarBenar: 'bola',
      gambarSalah: ['apel', 'jeruk'],
    },
    {
      kalimat: 'Rumah besar',
      audioKey: '',
      gambarBenar: 'rumah',
      gambarSalah: ['sekolah', 'mobil'],
    },
    {
      kalimat: 'Ikan di air',
      audioKey: '',
      gambarBenar: 'ikan',
      gambarSalah: ['bebek', 'kucing'],
    },
    {
      kalimat: 'Pisang kuning',
      audioKey: '',
      gambarBenar: 'pisang',
      gambarSalah: ['nanas', 'jeruk'],
    },
    {
      kalimat: 'Ayam berkokok',
      audioKey: '',
      gambarBenar: 'ayam',
      gambarSalah: ['bebek', 'ikan'],
    },
    {
      kalimat: 'Jeruk kecil',
      audioKey: '',
      gambarBenar: 'jeruk',
      gambarSalah: ['apel', 'nanas'],
    },
    {
      kalimat: 'Mobil jalan',
      audioKey: '',
      gambarBenar: 'mobil',
      gambarSalah: ['bola', 'rumah'],
    },
    {
      kalimat: 'Bunga indah',
      audioKey: '',
      gambarBenar: 'bunga',
      gambarSalah: ['daun', 'apel'],
    },
    {
      kalimat: 'Meja kayu',
      audioKey: '',
      gambarBenar: 'meja',
      gambarSalah: ['kursi', 'cangkir'],
    },
    {
      kalimat: 'Nanas manis',
      audioKey: '',
      gambarBenar: 'nanas',
      gambarSalah: ['pisang', 'apel'],
    },
    {
      kalimat: 'Ular panjang',
      audioKey: '',
      gambarBenar: 'ular',
      gambarSalah: ['ikan', 'kucing'],
    },
    {
      kalimat: 'Gajah besar',
      audioKey: '',
      gambarBenar: 'gajah',
      gambarSalah: ['kucing', 'bebek'],
    },
    {
      kalimat: 'Daun hijau',
      audioKey: '',
      gambarBenar: 'daun',
      gambarSalah: ['bunga', 'pisang'],
    },
    {
      kalimat: 'Es krim dingin',
      audioKey: '',
      gambarBenar: 'eskrim',
      gambarSalah: ['apel', 'nanas'],
    },
    {
      kalimat: 'Orang berlari',
      audioKey: '',
      gambarBenar: 'orang',
      gambarSalah: ['tidur', 'main'],
    },
    {
      kalimat: 'Sekolah ramai',
      audioKey: '',
      gambarBenar: 'sekolah',
      gambarSalah: ['rumah', 'kebun'],
    },
    {
      kalimat: 'Bintang terang',
      audioKey: '',
      gambarBenar: 'bintang',
      gambarSalah: ['kucing', 'ikan'],
    },
  ];
}

/** TK literasi 8 */
export function tkLiterasi8SusunQuestions(): SusunQ[] {
  return [
    susun2('jeruk', 'Jeruk', 'JE', 'RUK', 'JO', 'RAK', 801),
    susun2('pisang', 'Pisang', 'PI', 'SANG', 'PU', 'SONG', 802),
    susun2('apel', 'Apel', 'A', 'PEL', 'I', 'PAL', 803),
    susun2('nanas', 'Nanas', 'NA', 'NAS', 'NO', 'NES', 804),
    susun2('rumah', 'Rumah', 'RU', 'MAH', 'MO', 'MIH', 805),
    susun3plus('sekolah', 'Sekolah', 'SE', 'KO', 'LAH', 'SI', 806),
    susun3plus('perahu', 'Perahu', 'PE', 'RA', 'HU', 'BU', 807),
    susun3plus('pelangi', 'Pelangi', 'PE', 'LANG', 'I', 'U', 808),
    susun2('mobil', 'Mobil', 'MO', 'BIL', 'ME', 'BAL', 809),
    susun2('bola', 'Bola', 'BO', 'LA', 'BU', 'LO', 810),
    susun2('ayam', 'Ayam', 'A', 'YAM', 'U', 'YUM', 811),
    susun2('ikan', 'Ikan', 'I', 'KAN', 'O', 'KON', 812),
    susun2('kucing', 'Kucing', 'KU', 'CING', 'KI', 'CONG', 813),
    susun2('bebek', 'Bebek', 'BE', 'BEK', 'BI', 'BAK', 814),
    susun2('meja', 'Meja', 'ME', 'JA', 'MI', 'JU', 815),
    susun2('kursi', 'Kursi', 'KUR', 'SI', 'KO', 'SO', 816),
    susun2('bunga', 'Bunga', 'BU', 'NGA', 'BI', 'NGE', 817),
    susun2('bintang', 'Bintang', 'BIN', 'TANG', 'BEN', 'TING', 818),
    susun2('hati', 'Hati', 'HA', 'TI', 'HU', 'TE', 819),
    susun3plus('sekolah', 'Sekolah', 'SE', 'KO', 'LAH', 'NA', 820),
  ];
}

/** TK literasi 10 — ulangan susun (kombinasi berbeda dari level 4) */
export function tkLiterasi10SusunQuestions(): SusunQ[] {
  return [
    susun2('apel', 'Apel', 'A', 'PEL', 'I', 'PAL', 1001),
    susun2('jeruk', 'Jeruk', 'JE', 'RUK', 'JO', 'REK', 1002),
    susun2('pisang', 'Pisang', 'PI', 'SANG', 'PU', 'SUNG', 1003),
    susun2('nanas', 'Nanas', 'NA', 'NAS', 'NI', 'NIS', 1004),
    susun2('rumah', 'Rumah', 'RU', 'MAH', 'RO', 'MOH', 1005),
    susun3plus('sekolah', 'Sekolah', 'SE', 'KO', 'LAH', 'PA', 1006),
    susun3plus('mobil', 'Mobil', 'MO', 'BIL', 'ME', 'BAL', 1007),
    susun3plus('perahu', 'Perahu', 'PE', 'RA', 'HU', 'HO', 1008),
    susun3plus('pelangi', 'Pelangi', 'PE', 'LANG', 'I', 'O', 1009),
    susun2('bola', 'Bola', 'BO', 'LA', 'BE', 'LI', 1010),
    susun2('ayam', 'Ayam', 'A', 'YAM', 'U', 'YUM', 1011),
    susun2('ikan', 'Ikan', 'I', 'KAN', 'O', 'KON', 1012),
    susun2('kucing', 'Kucing', 'KU', 'CING', 'KA', 'KUNG', 1013),
    susun2('bebek', 'Bebek', 'BE', 'BEK', 'BA', 'BIK', 1014),
    susun2('meja', 'Meja', 'ME', 'JA', 'MI', 'JU', 1015),
    susun2('kursi', 'Kursi', 'KUR', 'SI', 'SU', 'SO', 1016),
    susun2('bunga', 'Bunga', 'BU', 'NGA', 'BI', 'NGO', 1017),
    susun2('bintang', 'Bintang', 'BIN', 'TANG', 'BUN', 'TING', 1018),
    susun2('hati', 'Hati', 'HA', 'TI', 'HI', 'TA', 1019),
    susun2('daun', 'Daun', 'DA', 'UN', 'DI', 'DON', 1020),
  ];
}

/** TK literasi 9 — ulangan huruf–gambar (bank sama dengan level 1, judul level berbeda). */
export function tkLiterasi9HurufPairs() {
  return tkLiterasi1Pairs();
}

/** SD1 literasi 4 — susun kata */
export function sd1Literasi4SusunQuestions(): SusunQ[] {
  return [
    susun3plus('sekolah', 'Sekolah', 'SE', 'KO', 'LAH', 'PA', 1401),
    susun3plus('perahu', 'Perahu', 'PE', 'RA', 'HU', 'BU', 1402),
    susun3plus('pelangi', 'Pelangi', 'PE', 'LANG', 'I', 'U', 1403),
    susun2('mobil', 'Mobil', 'MO', 'BIL', 'MI', 'MAL', 1404),
    susun2('rumah', 'Rumah', 'RU', 'MAH', 'RO', 'MOH', 1405),
    susun2('pisang', 'Pisang', 'PI', 'SANG', 'PU', 'SONG', 1406),
    susun2('jeruk', 'Jeruk', 'JE', 'RUK', 'JO', 'REK', 1407),
    susun2('apel', 'Apel', 'A', 'PEL', 'E', 'POL', 1408),
    susun2('ayam', 'Ayam', 'A', 'YAM', 'U', 'YUM', 1409),
    susun2('ikan', 'Ikan', 'I', 'KAN', 'O', 'KON', 1410),
    susun2('kucing', 'Kucing', 'KU', 'CING', 'KI', 'CONG', 1411),
    susun2('bebek', 'Bebek', 'BE', 'BEK', 'BA', 'BIK', 1412),
    susun2('meja', 'Meja', 'ME', 'JA', 'MI', 'JU', 1413),
    susun2('kursi', 'Kursi', 'KUR', 'SI', 'SU', 'SO', 1414),
    susun2('bunga', 'Bunga', 'BU', 'NGA', 'BI', 'NGE', 1415),
    susun2('bintang', 'Bintang', 'BIN', 'TANG', 'BUN', 'TING', 1416),
    susun3plus('sekolah', 'Sekolah', 'SE', 'KO', 'LAH', 'SI', 1417),
    susun3plus('mobil', 'Mobil', 'MO', 'BIL', 'LA', 'TI', 1418),
    susun3plus('perahu', 'Perahu', 'PE', 'RA', 'HU', 'HI', 1419),
    susun3plus('pelangi', 'Pelangi', 'PE', 'LANG', 'I', 'E', 1420),
  ];
}

function sd1BacaExtendedPool(): BacaQ[] {
  const base = sd1Literasi3BacaQuestions();
  const dup = (prefix: string): BacaQ[] =>
    base.map((q) => ({
      ...q,
      kalimat: `${prefix}${q.kalimat}`,
    }));
  return [...base, ...dup('Teman: '), ...dup('Cerita: '), ...dup('')];
}

/** SD1 literasi 5 — baca kalimat */
export function sd1Literasi5BacaQuestions(): BacaQ[] {
  return sd1BacaExtendedPool().slice(0, 20);
}

/** SD1 literasi 6 — baca kalimat */
export function sd1Literasi6BacaQuestions(): BacaQ[] {
  return sd1BacaExtendedPool().slice(20, 40);
}

/** SD1 literasi 7 — susun */
export function sd1Literasi7SusunQuestions(): SusunQ[] {
  return [
    susun3plus('sekolah', 'Sekolah', 'SE', 'KO', 'LAH', 'NA', 1701),
    susun3plus('perahu', 'Perahu', 'PE', 'RA', 'HU', 'HO', 1702),
    susun3plus('pelangi', 'Pelangi', 'PE', 'LANG', 'I', 'O', 1703),
    susun2('buku', 'Buku', 'BU', 'KU', 'BA', 'KO', 1704),
    susun2('pensil', 'Pensil', 'PEN', 'SIL', 'SOL', 'SAL', 1705),
    susun2('gunting', 'Gunting', 'GUN', 'TING', 'TUNG', 'TANG', 1706),
    susun2('mobil', 'Mobil', 'MO', 'BIL', 'ME', 'BAL', 1707),
    susun2('rumah', 'Rumah', 'RU', 'MAH', 'RI', 'MIH', 1708),
    susun2('pisang', 'Pisang', 'PI', 'SANG', 'PE', 'SENG', 1709),
    susun2('jeruk', 'Jeruk', 'JE', 'RUK', 'JI', 'ROK', 1710),
    susun2('apel', 'Apel', 'A', 'PEL', 'I', 'PAL', 1711),
    susun2('nanas', 'Nanas', 'NA', 'NAS', 'NI', 'NIS', 1712),
    susun3plus('sekolah', 'Sekolah', 'SE', 'KO', 'LAH', 'SA', 1713),
    susun3plus('mobil', 'Mobil', 'MO', 'BIL', 'MI', 'MAL', 1714),
    susun3plus('perahu', 'Perahu', 'PE', 'RA', 'HU', 'BU', 1715),
    susun3plus('pelangi', 'Pelangi', 'PE', 'LANG', 'I', 'U', 1716),
    susun2('bola', 'Bola', 'BO', 'LA', 'BU', 'LO', 1717),
    susun2('ayam', 'Ayam', 'A', 'YAM', 'U', 'YUM', 1718),
    susun2('ikan', 'Ikan', 'I', 'KAN', 'O', 'KON', 1719),
    susun2('kucing', 'Kucing', 'KU', 'CING', 'KA', 'KUNG', 1720),
  ];
}

/** SD1 literasi 8 — baca */
export function sd1Literasi8BacaQuestions(): BacaQ[] {
  return sd1BacaExtendedPool().slice(40, 60);
}

/** SD1 literasi 9 — susun (bank sama seperti level 4; ulangan akhir jalur). */
export function sd1Literasi9SusunQuestions(): SusunQ[] {
  return sd1Literasi4SusunQuestions();
}

/** SD1 literasi 10 — baca */
export function sd1Literasi10BacaQuestions(): BacaQ[] {
  return sd1BacaExtendedPool().slice(60, 80);
}
