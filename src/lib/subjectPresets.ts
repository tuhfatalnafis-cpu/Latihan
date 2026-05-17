export interface SubjectFieldSchema {
  term_label: string;
  meaning_label: string;
  extra_fields: { key: string; label: string }[];
  rtl: boolean;
  term_font: 'default' | 'arabic' | 'jawi';
}

export const SUBJECT_PRESETS: Record<string, SubjectFieldSchema> = {
  bahasa_arab: {
    term_label: "Perkataan Arab",
    meaning_label: "Maksud (Melayu)",
    extra_fields: [{ key: "transliteration", label: "Sebutan" }],
    rtl: true,
    term_font: "arabic"
  },
  sejarah: {
    term_label: "Tokoh/Peristiwa",
    meaning_label: "Penerangan",
    extra_fields: [
      { key: "year", label: "Tahun" },
      { key: "place", label: "Tempat" }
    ],
    rtl: false,
    term_font: "default"
  },
  sains: {
    term_label: "Istilah",
    meaning_label: "Definisi",
    extra_fields: [{ key: "category", label: "Bidang" }],
    rtl: false,
    term_font: "default"
  },
  bahasa_inggeris: {
    term_label: "Word",
    meaning_label: "Maksud (Melayu)",
    extra_fields: [
      { key: "phonetic", label: "Phonetic" },
      { key: "example_sentence", label: "Example" }
    ],
    rtl: false,
    term_font: "default"
  },
  geografi: {
    term_label: "Tempat/Konsep",
    meaning_label: "Penerangan",
    extra_fields: [
      { key: "location", label: "Lokasi" },
      { key: "type", label: "Jenis" }
    ],
    rtl: false,
    term_font: "default"
  }
};

export const DEFAULT_SCHEMA: SubjectFieldSchema = {
  term_label: "Istilah",
  meaning_label: "Maksud",
  extra_fields: [],
  rtl: false,
  term_font: "default"
};
