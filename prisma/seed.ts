import { prisma } from '../server/db';
import { extendedLevelsSeed } from './extended-levels-seed';
import {
  sd1Literasi1SusunQuestions,
  sd1Literasi2SusunQuestions,
  sd1Literasi3BacaQuestions,
  tkLiterasi1Pairs,
  tkLiterasi2SusunQuestions,
  tkLiterasi3SusunQuestions,
} from './literasi-banks';
import {
  sd1Math1TambahQuestions,
  sd1Math2TambahQuestions,
  sd1Math3KurangQuestions,
  tkMath1HitungQuestions,
  tkMath2HitungQuestions,
  tkMath3BandingQuestions,
} from './math-banks';

const vo = (instruksi: string) =>
  JSON.stringify({
    instruksi,
    correct: ['/audio/feedback/great-1.mp3'],
    wrong: ['/audio/feedback/try-1.mp3'],
    completion: '/audio/feedback/done.mp3',
  });

async function main() {
  await prisma.parentSettings.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton' },
    update: {},
  });

  const stickers = [
    [
      'sticker-bintang-emas',
      'Bintang Emas',
      '/img/stickers/star.svg',
      'COMMON',
      'universal',
    ],
    [
      'sticker-apel-merah',
      'Apel Merah',
      '/img/stickers/apple.svg',
      'COMMON',
      'buah',
    ],
    [
      'sticker-panda-bahagia',
      'Panda Bahagia',
      '/img/stickers/panda.svg',
      'RARE',
      'hewan',
    ],
    ['sticker-roket', 'Roket', '/img/stickers/rocket.svg', 'EPIC', 'fantasi'],
    ['sticker-kucing', 'Kucing', '/img/stickers/cat.svg', 'COMMON', 'hewan'],
    ['sticker-mobil', 'Mobil', '/img/stickers/car.svg', 'COMMON', 'kendaraan'],
    [
      'sticker-pelangi',
      'Pelangi',
      '/img/stickers/rainbow.svg',
      'RARE',
      'universal',
    ],
    ['sticker-mascot-bimo', 'Bimo', '/img/stickers/bimo.svg', 'EPIC', 'mascot'],
    [
      'sticker-bunga',
      'Bunga',
      '/img/stickers/flower.svg',
      'COMMON',
      'tumbuhan',
    ],
    ['sticker-pisang', 'Pisang', '/img/stickers/banana.svg', 'COMMON', 'buah'],
  ] as const;

  for (const [id, name, imagePath, rarity, theme] of stickers) {
    await prisma.stickerCatalog.upsert({
      where: { id },
      update: {
        name,
        imagePath,
        rarity: rarity as 'COMMON' | 'RARE' | 'EPIC',
        theme,
      },
      create: {
        id,
        name,
        imagePath,
        rarity: rarity as 'COMMON' | 'RARE' | 'EPIC',
        theme,
      },
    });
  }

  const badges = [
    [
      'badge-first-step',
      'FIRST_STEP',
      'Petualang Pertama',
      'Selesaikan aktivitas pertama',
      '/img/badges/first.svg',
    ],
    [
      'badge-three-stars',
      'THREE_STARS',
      'Bintang Tiga',
      'Dapatkan 3 bintang',
      '/img/badges/star.svg',
    ],
    [
      'badge-streak-3',
      'STREAK_3',
      'Streak 3 Hari',
      'Main 3 hari berturut-turut',
      '/img/badges/streak.svg',
    ],
    [
      'badge-streak-7',
      'STREAK_7',
      'Streak 7 Hari',
      'Main 7 hari berturut-turut',
      '/img/badges/streak7.svg',
    ],
    [
      'badge-master-lit-1',
      'MASTER_LIT_1',
      'Master Literasi 1',
      'Selesaikan level 1 literasi dengan sempurna',
      '/img/badges/master.svg',
    ],
    [
      'badge-master-math-1',
      'MASTER_MATH_1',
      'Master Matematika 1',
      'Selesaikan level 1 matematika dengan sempurna',
      '/img/badges/master.svg',
    ],
    [
      'badge-collector-5',
      'COLLECTOR_5',
      'Kolektor Pemula',
      'Kumpulkan 5 stiker',
      '/img/badges/collect.svg',
    ],
  ] as const;

  for (const [id, code, name, description, iconPath] of badges) {
    await prisma.badgeCatalog.upsert({
      where: { id },
      update: { code, name, description, iconPath, criteriaKey: code },
      create: { id, code, name, description, iconPath, criteriaKey: code },
    });
  }

  const levels: Array<{
    id: string;
    track: 'literasi' | 'math';
    ageMode: 'TK' | 'SD1';
    order: number;
    title: string;
    description: string;
    iconKey: string;
    activity: {
      id: string;
      type:
        | 'HURUF_GAMBAR_MATCHING'
        | 'SUSUN_SUKU_KATA'
        | 'BACA_KALIMAT_PENDEK'
        | 'HITUNG_BENDA'
        | 'BANDINGKAN_LEBIH_KURANG'
        | 'PENJUMLAHAN_VISUAL'
        | 'PENGURANGAN_VISUAL';
      title: string;
      payload: object;
    };
  }> = [
    {
      id: 'tk-literasi-1',
      track: 'literasi',
      ageMode: 'TK',
      order: 1,
      title: 'Mengenal Huruf dan Gambar',
      description: 'Cocokkan huruf dengan gambar.',
      iconKey: 'abc',
      activity: {
        id: 'tk-literasi-1-act1',
        type: 'HURUF_GAMBAR_MATCHING',
        title: 'Huruf Ajaib',
        payload: {
          instruction: 'Cocokkan huruf dengan gambarnya!',
          pairs: tkLiterasi1Pairs(),
          shuffle: true,
        },
      },
    },
    {
      id: 'tk-literasi-2',
      track: 'literasi',
      ageMode: 'TK',
      order: 2,
      title: 'Suku Kata',
      description: 'Susun suku kata jadi kata.',
      iconKey: 'suku',
      activity: {
        id: 'tk-literasi-2-act1',
        type: 'SUSUN_SUKU_KATA',
        title: 'Susun Kata',
        payload: {
          instruction: 'Susun suku kata jadi nama benda!',
          questions: tkLiterasi2SusunQuestions(),
        },
      },
    },
    {
      id: 'tk-literasi-3',
      track: 'literasi',
      ageMode: 'TK',
      order: 3,
      title: 'Kata di Rumah',
      description: 'Susun nama benda di rumah.',
      iconKey: 'rumah',
      activity: {
        id: 'tk-literasi-3-act1',
        type: 'SUSUN_SUKU_KATA',
        title: 'Susun di Rumah',
        payload: {
          instruction: 'Susun suku kata!',
          questions: tkLiterasi3SusunQuestions(),
        },
      },
    },
    {
      id: 'tk-math-1',
      track: 'math',
      ageMode: 'TK',
      order: 1,
      title: 'Angka 1–5',
      description: 'Hitung benda.',
      iconKey: 'num',
      activity: {
        id: 'tk-math-1-act1',
        type: 'HITUNG_BENDA',
        title: 'Hitung Buah',
        payload: {
          instruction: 'Hitung jumlah benda lalu pilih angkanya!',
          questions: tkMath1HitungQuestions(),
        },
      },
    },
    {
      id: 'tk-math-2',
      track: 'math',
      ageMode: 'TK',
      order: 2,
      title: 'Angka 6–10',
      description: 'Hitung lebih banyak benda.',
      iconKey: 'num',
      activity: {
        id: 'tk-math-2-act1',
        type: 'HITUNG_BENDA',
        title: 'Hitung Hewan',
        payload: {
          instruction: 'Hitung jumlahnya!',
          questions: tkMath2HitungQuestions(),
        },
      },
    },
    {
      id: 'tk-math-3',
      track: 'math',
      ageMode: 'TK',
      order: 3,
      title: 'Bandingkan',
      description: 'Lebih banyak mana?',
      iconKey: 'compare',
      activity: {
        id: 'tk-math-3-act1',
        type: 'BANDINGKAN_LEBIH_KURANG',
        title: 'Lebih Banyak',
        payload: {
          instruction: 'Pilih kelompok yang lebih banyak!',
          questions: tkMath3BandingQuestions(),
        },
      },
    },
    {
      id: 'sd1-literasi-1',
      track: 'literasi',
      ageMode: 'SD1',
      order: 1,
      title: 'Suku Kata Lanjutan',
      description: 'Susun kata dua suku.',
      iconKey: 'suku',
      activity: {
        id: 'sd1-literasi-1-act1',
        type: 'SUSUN_SUKU_KATA',
        title: 'Susun Kata',
        payload: {
          instruction: 'Susun suku kata!',
          questions: sd1Literasi1SusunQuestions(),
        },
      },
    },
    {
      id: 'sd1-literasi-2',
      track: 'literasi',
      ageMode: 'SD1',
      order: 2,
      title: 'Membaca Kata',
      description: 'Susun kata lebih panjang.',
      iconKey: 'baca',
      activity: {
        id: 'sd1-literasi-2-act1',
        type: 'SUSUN_SUKU_KATA',
        title: 'Susun Kata Panjang',
        payload: {
          instruction: 'Susun menjadi kata!',
          questions: sd1Literasi2SusunQuestions(),
        },
      },
    },
    {
      id: 'sd1-literasi-3',
      track: 'literasi',
      ageMode: 'SD1',
      order: 3,
      title: 'Kalimat Pendek',
      description: 'Baca dan pilih gambar.',
      iconKey: 'kalimat',
      activity: {
        id: 'sd1-literasi-3-act1',
        type: 'BACA_KALIMAT_PENDEK',
        title: 'Baca dan Pilih',
        payload: {
          instruction: 'Baca kalimat lalu pilih gambar yang benar!',
          questions: sd1Literasi3BacaQuestions(),
        },
      },
    },
    {
      id: 'sd1-math-1',
      track: 'math',
      ageMode: 'SD1',
      order: 1,
      title: 'Penjumlahan 1–10',
      description: 'Tambah bilangan.',
      iconKey: 'plus',
      activity: {
        id: 'sd1-math-1-act1',
        type: 'PENJUMLAHAN_VISUAL',
        title: 'Tambah Yuk',
        payload: {
          instruction: 'Hitung jumlah totalnya!',
          questions: sd1Math1TambahQuestions(),
        },
      },
    },
    {
      id: 'sd1-math-2',
      track: 'math',
      ageMode: 'SD1',
      order: 2,
      title: 'Penjumlahan 11–20',
      description: 'Tambah bilangan lebih besar.',
      iconKey: 'plus',
      activity: {
        id: 'sd1-math-2-act1',
        type: 'PENJUMLAHAN_VISUAL',
        title: 'Tambah Lagi',
        payload: {
          instruction: 'Hitung jumlahnya!',
          questions: sd1Math2TambahQuestions(),
        },
      },
    },
    {
      id: 'sd1-math-3',
      track: 'math',
      ageMode: 'SD1',
      order: 3,
      title: 'Pengurangan',
      description: 'Kurangkan bilangan.',
      iconKey: 'minus',
      activity: {
        id: 'sd1-math-3-act1',
        type: 'PENGURANGAN_VISUAL',
        title: 'Kurang Yuk',
        payload: {
          instruction: 'Hitung hasil pengurangan!',
          questions: sd1Math3KurangQuestions(),
        },
      },
    },
    ...extendedLevelsSeed(),
  ];

  for (const L of levels) {
    await prisma.levelDefinition.upsert({
      where: { id: L.id },
      update: {
        title: L.title,
        description: L.description,
        iconKey: L.iconKey,
        track: L.track,
        ageMode: L.ageMode,
        order: L.order,
      },
      create: {
        id: L.id,
        track: L.track,
        ageMode: L.ageMode,
        order: L.order,
        title: L.title,
        description: L.description,
        iconKey: L.iconKey,
      },
    });

    await prisma.activityDefinition.upsert({
      where: { id: L.activity.id },
      update: {
        type: L.activity.type,
        title: L.activity.title,
        payload: JSON.stringify(L.activity.payload),
        voiceOverKeys: vo('Selamat bermain!'),
        estimatedSec: 180,
        order: 1,
        levelId: L.id,
      },
      create: {
        id: L.activity.id,
        levelId: L.id,
        type: L.activity.type,
        order: 1,
        title: L.activity.title,
        payload: JSON.stringify(L.activity.payload),
        voiceOverKeys: vo('Selamat bermain!'),
        estimatedSec: 180,
      },
    });
  }

  console.log('Seed selesai.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
