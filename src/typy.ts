// Typy danych aplikacji „Przypomnienia o płatnościach”.
// Zgodne z mapowaniem kolumn z docs/plan-aplikacji.md i tabelą 2.1 dokumentu wdrożeniowego.

/** Data w formacie RRRR-MM-DD, np. "2026-11-20". */
export type DataISO = string

/** Data i godzina w formacie ISO 8601, np. "2026-11-20T09:15:00.000Z". */
export type DataGodzinaISO = string

/** Imię osoby wybrane z listy „Kim jesteś?”. */
export type Osoba = string

/** Ujednolicony status faktury (po zamianie znanych słów ze stałej listy). */
export type StatusFaktury = 'nieopłacona' | 'opłacona' | 'opłacona częściowo'

/** Rodzaj wysłanego przypomnienia. „Do prawnika” nie jest mailem, więc jest osobno. */
export type RodzajPrzypomnienia = 'uprzejme' | 'stanowcze'

/** Powód kliknięcia „Pomiń”, wybierany z listy. */
export type PowodPominiecia = 'klient zapłacił' | 'klient dzwonił' | 'inny'

/** Zapis jednego wysłanego (i potwierdzonego „Tak”) przypomnienia. */
export interface Przypomnienie {
  rodzaj: RodzajPrzypomnienia
  data: DataISO
  kto: Osoba
}

/** Zapis jednego pominięcia przypomnienia. */
export interface Pominiecie {
  powod: PowodPominiecia
  /** Krótki opis; wymagany tylko przy powodzie „inny”. */
  opis?: string
  data: DataISO
  kto: Osoba
}

/** Oznaczenie, że faktura została przekazana prawnikowi. */
export interface PrzekazanieDoPrawnika {
  data: DataISO
  kto: Osoba
}

/** Faktura po sprawdzeniu i ujednoliceniu danych. */
export interface Faktura {
  // --- pola z pliku (kolumny eksportu) ---
  /** Numer KSeF — wymagany, unikalny. Klucz faktury. */
  numerKsef: string
  /** Kolumna „Kontrahent”. */
  nazwaKlienta: string
  /** Małymi literami; klucz grupowania maili zbiorczych. */
  email: string
  /** Kolumna „Kwota brutto”, większa od 0. */
  kwota: number
  terminPlatnosci: DataISO
  status: StatusFaktury
  /** Kolumna „Zapłacono”; puste = 0, od 0 do kwoty. */
  kwotaZaplacona: number
  /** Dowolny tekst, nie wpływa na decyzje. */
  uwagi: string

  // --- pola prowadzone w aplikacji (zachowywane przy ponownym wgraniu) ---
  /** Pole „Ugoda (raty)”; domyślnie false. Wyłącza przypomnienia i listę do prawnika. */
  ugoda: boolean
  historiaPrzypomnien: Przypomnienie[]
  historiaPominiec: Pominiecie[]
  /** null, dopóki faktura nie zostanie oznaczona jako przekazana prawnikowi. */
  doPrawnika: PrzekazanieDoPrawnika | null
}

/** Liczby wierszy z jednego wgrania pliku. */
export interface LiczbyWierszy {
  /** Wszystkie wiersze z danymi w pliku. */
  wszystkie: number
  poprawne: number
  doUzupelnienia: number
  doSprawdzenia: number
  /** Identyczne duplikaty usunięte automatycznie. */
  usunieteDuplikaty: number
}

/** Wpis w historii wgrań. */
export interface Wgranie {
  nazwaPliku: string
  /** „Dane z dnia” potwierdzone lub poprawione przez pracownika. */
  daneZDnia: DataISO
  /** Moment wgrania, zapisywany osobno od „Dane z dnia”. */
  dataGodzinaWgrania: DataGodzinaISO
  kto: Osoba
  liczbyWierszy: LiczbyWierszy
}
