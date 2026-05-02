/**
 * Definisi Level 4–10 × 4 kombinasi jalur×mode — untuk digabung ke prisma/seed.ts
 * Acuan: docs/PRD-recommended-backlog-levels-4-10.md
 */

import {
  sd1Literasi4SusunQuestions,
  sd1Literasi5BacaQuestions,
  sd1Literasi6BacaQuestions,
  sd1Literasi7SusunQuestions,
  sd1Literasi8BacaQuestions,
  sd1Literasi9SusunQuestions,
  sd1Literasi10BacaQuestions,
  tkLiterasi4SusunQuestions,
  tkLiterasi5SusunQuestions,
  tkLiterasi6SusunQuestions,
  tkLiterasi7BacaQuestions,
  tkLiterasi8SusunQuestions,
  tkLiterasi9HurufPairs,
  tkLiterasi10SusunQuestions,
} from './literasi-extended-banks';
import {
  sd1Math4TambahQuestions,
  sd1Math5KurangQuestions,
  sd1Math6HitungQuestions,
  sd1Math7BandingQuestions,
  sd1Math8TambahQuestions,
  sd1Math9KurangQuestions,
  sd1Math10TambahQuestions,
  tkMath4HitungQuestions,
  tkMath9HitungQuestions,
  tkMathBandingMediumQuestions,
  tkMathKurangSimpleQuestions,
  tkMathTambahKe10Questions,
} from './math-banks';

export type SeedLevelRow = {
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
};

export function extendedLevelsSeed(): SeedLevelRow[] {
  return [
    {
      id: 'tk-literasi-4',
      track: 'literasi',
      ageMode: 'TK',
      order: 4,
      title: 'Hewan & Alam',
      description: 'Susun suku kata tema hewan.',
      iconKey: 'suku',
      activity: {
        id: 'tk-literasi-4-act1',
        type: 'SUSUN_SUKU_KATA',
        title: 'Susun Hewan',
        payload: {
          instruction: 'Susun suku kata!',
          questions: tkLiterasi4SusunQuestions(),
        },
      },
    },
    {
      id: 'tk-literasi-5',
      track: 'literasi',
      ageMode: 'TK',
      order: 5,
      title: 'Di Sekolah',
      description: 'Susun kata di lingkungan sekolah.',
      iconKey: 'suku',
      activity: {
        id: 'tk-literasi-5-act1',
        type: 'SUSUN_SUKU_KATA',
        title: 'Susun di Sekolah',
        payload: {
          instruction: 'Susun suku kata!',
          questions: tkLiterasi5SusunQuestions(),
        },
      },
    },
    {
      id: 'tk-literasi-6',
      track: 'literasi',
      ageMode: 'TK',
      order: 6,
      title: 'Kata Bergilir',
      description: 'Latihan suku kata lebih variatif.',
      iconKey: 'suku',
      activity: {
        id: 'tk-literasi-6-act1',
        type: 'SUSUN_SUKU_KATA',
        title: 'Susun Lagi',
        payload: {
          instruction: 'Susun suku kata!',
          questions: tkLiterasi6SusunQuestions(),
        },
      },
    },
    {
      id: 'tk-literasi-7',
      track: 'literasi',
      ageMode: 'TK',
      order: 7,
      title: 'Kalimat Mini',
      description: 'Baca kalimat pendek, pilih gambar.',
      iconKey: 'kalimat',
      activity: {
        id: 'tk-literasi-7-act1',
        type: 'BACA_KALIMAT_PENDEK',
        title: 'Baca Yuk',
        payload: {
          instruction: 'Baca lalu pilih gambar yang sesuai!',
          questions: tkLiterasi7BacaQuestions(),
        },
      },
    },
    {
      id: 'tk-literasi-8',
      track: 'literasi',
      ageMode: 'TK',
      order: 8,
      title: 'Susun Cerdas',
      description: 'Susun suku kata dengan variasi baru.',
      iconKey: 'suku',
      activity: {
        id: 'tk-literasi-8-act1',
        type: 'SUSUN_SUKU_KATA',
        title: 'Susun Cerdas',
        payload: {
          instruction: 'Susun suku kata!',
          questions: tkLiterasi8SusunQuestions(),
        },
      },
    },
    {
      id: 'tk-literasi-9',
      track: 'literasi',
      ageMode: 'TK',
      order: 9,
      title: 'Huruf & Gambar Jitu',
      description: 'Ulangan cocokkan huruf dengan gambar.',
      iconKey: 'abc',
      activity: {
        id: 'tk-literasi-9-act1',
        type: 'HURUF_GAMBAR_MATCHING',
        title: 'Huruf Jitu',
        payload: {
          instruction: 'Cocokkan huruf dengan gambarnya!',
          pairs: tkLiterasi9HurufPairs(),
          shuffle: true,
        },
      },
    },
    {
      id: 'tk-literasi-10',
      track: 'literasi',
      ageMode: 'TK',
      order: 10,
      title: 'Juara Susun Kata TK',
      description: 'Tantangan susun kata tingkat lanjut.',
      iconKey: 'suku',
      activity: {
        id: 'tk-literasi-10-act1',
        type: 'SUSUN_SUKU_KATA',
        title: 'Juara Susun',
        payload: {
          instruction: 'Susun suku kata!',
          questions: tkLiterasi10SusunQuestions(),
        },
      },
    },
    {
      id: 'tk-math-4',
      track: 'math',
      ageMode: 'TK',
      order: 4,
      title: 'Hitung 11–15',
      description: 'Hitung kumpulan benda lebih banyak.',
      iconKey: 'num',
      activity: {
        id: 'tk-math-4-act1',
        type: 'HITUNG_BENDA',
        title: 'Hitung Banyak',
        payload: {
          instruction: 'Hitung jumlahnya!',
          questions: tkMath4HitungQuestions(),
        },
      },
    },
    {
      id: 'tk-math-5',
      track: 'math',
      ageMode: 'TK',
      order: 5,
      title: 'Bandingkan Lagi',
      description: 'Mana kelompok yang lebih banyak?',
      iconKey: 'compare',
      activity: {
        id: 'tk-math-5-act1',
        type: 'BANDINGKAN_LEBIH_KURANG',
        title: 'Lebih Banyak',
        payload: {
          instruction: 'Pilih kelompok yang lebih banyak!',
          questions: tkMathBandingMediumQuestions(510),
        },
      },
    },
    {
      id: 'tk-math-6',
      track: 'math',
      ageMode: 'TK',
      order: 6,
      title: 'Tambah Yuk',
      description: 'Penjumlahan visual sederhana.',
      iconKey: 'plus',
      activity: {
        id: 'tk-math-6-act1',
        type: 'PENJUMLAHAN_VISUAL',
        title: 'Tambah',
        payload: {
          instruction: 'Hitung jumlah totalnya!',
          questions: tkMathTambahKe10Questions(620),
        },
      },
    },
    {
      id: 'tk-math-7',
      track: 'math',
      ageMode: 'TK',
      order: 7,
      title: 'Kurang Yuk',
      description: 'Pengurangan dengan gambar.',
      iconKey: 'minus',
      activity: {
        id: 'tk-math-7-act1',
        type: 'PENGURANGAN_VISUAL',
        title: 'Kurang',
        payload: {
          instruction: 'Hitung sisanya!',
          questions: tkMathKurangSimpleQuestions(730),
        },
      },
    },
    {
      id: 'tk-math-8',
      track: 'math',
      ageMode: 'TK',
      order: 8,
      title: 'Tambah Lagi',
      description: 'Latihan tambah dengan variasi.',
      iconKey: 'plus',
      activity: {
        id: 'tk-math-8-act1',
        type: 'PENJUMLAHAN_VISUAL',
        title: 'Tambah Lagi',
        payload: {
          instruction: 'Hitung jumlahnya!',
          questions: tkMathTambahKe10Questions(840),
        },
      },
    },
    {
      id: 'tk-math-9',
      track: 'math',
      ageMode: 'TK',
      order: 9,
      title: 'Hitung Campuran',
      description: 'Hitung benda dalam rentang lebih luas.',
      iconKey: 'num',
      activity: {
        id: 'tk-math-9-act1',
        type: 'HITUNG_BENDA',
        title: 'Hitung Campuran',
        payload: {
          instruction: 'Hitung jumlah benda!',
          questions: tkMath9HitungQuestions(),
        },
      },
    },
    {
      id: 'tk-math-10',
      track: 'math',
      ageMode: 'TK',
      order: 10,
      title: 'Pemenang Banding & Hitung',
      description: 'Bandingkan kumpulan dan konsentrasi.',
      iconKey: 'compare',
      activity: {
        id: 'tk-math-10-act1',
        type: 'BANDINGKAN_LEBIH_KURANG',
        title: 'Juara Banding',
        payload: {
          instruction: 'Pilih kelompok yang lebih banyak!',
          questions: tkMathBandingMediumQuestions(1000),
        },
      },
    },
    {
      id: 'sd1-literasi-4',
      track: 'literasi',
      ageMode: 'SD1',
      order: 4,
      title: 'Kata Tiga Suku',
      description: 'Susun kata dengan tiga suku kata.',
      iconKey: 'suku',
      activity: {
        id: 'sd1-literasi-4-act1',
        type: 'SUSUN_SUKU_KATA',
        title: 'Susun Panjang',
        payload: {
          instruction: 'Susun menjadi kata!',
          questions: sd1Literasi4SusunQuestions(),
        },
      },
    },
    {
      id: 'sd1-literasi-5',
      track: 'literasi',
      ageMode: 'SD1',
      order: 5,
      title: 'Membaca Cerita Mini',
      description: 'Baca kalimat lalu pilih gambar.',
      iconKey: 'kalimat',
      activity: {
        id: 'sd1-literasi-5-act1',
        type: 'BACA_KALIMAT_PENDEK',
        title: 'Baca Cerita',
        payload: {
          instruction: 'Baca kalimat lalu pilih gambar yang benar!',
          questions: sd1Literasi5BacaQuestions(),
        },
      },
    },
    {
      id: 'sd1-literasi-6',
      track: 'literasi',
      ageMode: 'SD1',
      order: 6,
      title: 'Kalimat Sehari-hari',
      description: 'Pemahaman kalimat pendek.',
      iconKey: 'kalimat',
      activity: {
        id: 'sd1-literasi-6-act1',
        type: 'BACA_KALIMAT_PENDEK',
        title: 'Baca Lagi',
        payload: {
          instruction: 'Baca kalimat lalu pilih gambar yang benar!',
          questions: sd1Literasi6BacaQuestions(),
        },
      },
    },
    {
      id: 'sd1-literasi-7',
      track: 'literasi',
      ageMode: 'SD1',
      order: 7,
      title: 'Susun Kata Kompleks',
      description: 'Susun dengan keping pengganggu.',
      iconKey: 'suku',
      activity: {
        id: 'sd1-literasi-7-act1',
        type: 'SUSUN_SUKU_KATA',
        title: 'Susun Kompleks',
        payload: {
          instruction: 'Susun menjadi kata!',
          questions: sd1Literasi7SusunQuestions(),
        },
      },
    },
    {
      id: 'sd1-literasi-8',
      track: 'literasi',
      ageMode: 'SD1',
      order: 8,
      title: 'Baca & Pilih',
      description: 'Kalimat sedikit lebih panjang.',
      iconKey: 'kalimat',
      activity: {
        id: 'sd1-literasi-8-act1',
        type: 'BACA_KALIMAT_PENDEK',
        title: 'Baca & Pilih',
        payload: {
          instruction: 'Baca kalimat lalu pilih gambar yang benar!',
          questions: sd1Literasi8BacaQuestions(),
        },
      },
    },
    {
      id: 'sd1-literasi-9',
      track: 'literasi',
      ageMode: 'SD1',
      order: 9,
      title: 'Ahli Menyusun',
      description: 'Latihan susun kata lanjutan.',
      iconKey: 'suku',
      activity: {
        id: 'sd1-literasi-9-act1',
        type: 'SUSUN_SUKU_KATA',
        title: 'Ahli Susun',
        payload: {
          instruction: 'Susun menjadi kata!',
          questions: sd1Literasi9SusunQuestions(),
        },
      },
    },
    {
      id: 'sd1-literasi-10',
      track: 'literasi',
      ageMode: 'SD1',
      order: 10,
      title: 'Juara Membaca',
      description: 'Tantangan membaca tingkat akhir.',
      iconKey: 'kalimat',
      activity: {
        id: 'sd1-literasi-10-act1',
        type: 'BACA_KALIMAT_PENDEK',
        title: 'Juara Baca',
        payload: {
          instruction: 'Baca kalimat lalu pilih gambar yang benar!',
          questions: sd1Literasi10BacaQuestions(),
        },
      },
    },
    {
      id: 'sd1-math-4',
      track: 'math',
      ageMode: 'SD1',
      order: 4,
      title: 'Tambah Besar',
      description: 'Penjumlahan hasil di atas Sepuluh.',
      iconKey: 'plus',
      activity: {
        id: 'sd1-math-4-act1',
        type: 'PENJUMLAHAN_VISUAL',
        title: 'Tambah Besar',
        payload: {
          instruction: 'Hitung jumlahnya!',
          questions: sd1Math4TambahQuestions(),
        },
      },
    },
    {
      id: 'sd1-math-5',
      track: 'math',
      ageMode: 'SD1',
      order: 5,
      title: 'Kurang Berpeluang',
      description: 'Pengurangan bilangan lebih besar.',
      iconKey: 'minus',
      activity: {
        id: 'sd1-math-5-act1',
        type: 'PENGURANGAN_VISUAL',
        title: 'Kurang',
        payload: {
          instruction: 'Hitung hasil pengurangan!',
          questions: sd1Math5KurangQuestions(),
        },
      },
    },
    {
      id: 'sd1-math-6',
      track: 'math',
      ageMode: 'SD1',
      order: 6,
      title: 'Hitung Banyak Benda',
      description: 'Hitung sampai belasan.',
      iconKey: 'num',
      activity: {
        id: 'sd1-math-6-act1',
        type: 'HITUNG_BENDA',
        title: 'Hitung Banyak',
        payload: {
          instruction: 'Hitung jumlah benda!',
          questions: sd1Math6HitungQuestions(),
        },
      },
    },
    {
      id: 'sd1-math-7',
      track: 'math',
      ageMode: 'SD1',
      order: 7,
      title: 'Bandingkan Jumlah',
      description: 'Mana yang lebih banyak?',
      iconKey: 'compare',
      activity: {
        id: 'sd1-math-7-act1',
        type: 'BANDINGKAN_LEBIH_KURANG',
        title: 'Bandingkan',
        payload: {
          instruction: 'Pilih kelompok yang lebih banyak!',
          questions: sd1Math7BandingQuestions(),
        },
      },
    },
    {
      id: 'sd1-math-8',
      track: 'math',
      ageMode: 'SD1',
      order: 8,
      title: 'Tambah hingga 35',
      description: 'Penjumlahan bilangan lebih besar.',
      iconKey: 'plus',
      activity: {
        id: 'sd1-math-8-act1',
        type: 'PENJUMLAHAN_VISUAL',
        title: 'Tambah Besar',
        payload: {
          instruction: 'Hitung jumlahnya!',
          questions: sd1Math8TambahQuestions(),
        },
      },
    },
    {
      id: 'sd1-math-9',
      track: 'math',
      ageMode: 'SD1',
      order: 9,
      title: 'Kurang Ahli',
      description: 'Pengurangan lanjutan.',
      iconKey: 'minus',
      activity: {
        id: 'sd1-math-9-act1',
        type: 'PENGURANGAN_VISUAL',
        title: 'Kurang Ahli',
        payload: {
          instruction: 'Hitung hasil pengurangan!',
          questions: sd1Math9KurangQuestions(),
        },
      },
    },
    {
      id: 'sd1-math-10',
      track: 'math',
      ageMode: 'SD1',
      order: 10,
      title: 'Juara Berhitung',
      description: 'Penjumlahan puncak jalur SD kelas I.',
      iconKey: 'plus',
      activity: {
        id: 'sd1-math-10-act1',
        type: 'PENJUMLAHAN_VISUAL',
        title: 'Juara Tambah',
        payload: {
          instruction: 'Hitung jumlahnya!',
          questions: sd1Math10TambahQuestions(),
        },
      },
    },
  ];
}
