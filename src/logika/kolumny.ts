import type { PoleZPliku } from '../typy'

/**
 * MAPOWANIE KOLUMN PLIKU → POLA APLIKACJI (tabela z docs/plan-aplikacji.md).
 * `naglowek` to nazwa kolumny w eksporcie, pokazywana w komunikatach.
 * `inneNazwy` — dodatkowe dopuszczalne nagłówki (porównywane tak samo jak `naglowek`).
 */
export const KOLUMNY: ReadonlyArray<{
  pole: PoleZPliku
  naglowek: string
  wymagana: boolean
  inneNazwy?: readonly string[]
}> = [
  { pole: 'numerKsef', naglowek: 'Numer KSeF', wymagana: true },
  { pole: 'nazwaKlienta', naglowek: 'Kontrahent', wymagana: true },
  { pole: 'email', naglowek: 'E-mail', wymagana: true },
  { pole: 'kwota', naglowek: 'Kwota brutto', wymagana: true },
  { pole: 'terminPlatnosci', naglowek: 'Termin płatności', wymagana: true },
  { pole: 'status', naglowek: 'Status', wymagana: true },
  { pole: 'kwotaZaplacona', naglowek: 'Zapłacono', wymagana: false },
  { pole: 'uwagi', naglowek: 'Uwagi', wymagana: false },
]

/**
 * Ujednolica nagłówek do porównania: bez znaczenia są wielkość liter, spacje,
 * polskie znaki i znaki przestankowe. „E-mail” = „email”, „Termin płatności” = „TERMIN PLATNOSCI”.
 * (Dotyczy tylko NAGŁÓWKÓW kolumn — statusy porównujemy dokładnie, patrz statusy.ts.)
 */
export function ujednolicNaglowek(tekst: unknown): string {
  return String(tekst ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // kreski i ogonki
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // spacje, myślniki, kropki itp.
}

/** Numer kolumny (od 0) dla każdego rozpoznanego pola. */
export type UkladKolumn = Partial<Record<PoleZPliku, number>>

export interface WynikRozpoznaniaKolumn {
  uklad: UkladKolumn
  /** Nazwy wymaganych kolumn, których nie znaleziono. Pusta lista = można wgrywać. */
  brakujace: string[]
  /** Komunikat dla pracownika, gdy czegoś brakuje; null, gdy wszystko jest. */
  komunikat: string | null
}

/** Rozpoznaje kolumny na podstawie wiersza nagłówków. Gdy nagłówek się powtarza, liczy się pierwszy. */
export function rozpoznajKolumny(naglowki: readonly unknown[]): WynikRozpoznaniaKolumn {
  const uklad: UkladKolumn = {}

  naglowki.forEach((naglowek, indeks) => {
    const klucz = ujednolicNaglowek(naglowek)
    if (!klucz) return
    const kolumna = KOLUMNY.find(
      (k) => ujednolicNaglowek(k.naglowek) === klucz || (k.inneNazwy ?? []).some((n) => ujednolicNaglowek(n) === klucz),
    )
    if (kolumna && uklad[kolumna.pole] === undefined) uklad[kolumna.pole] = indeks
  })

  const brakujace = KOLUMNY.filter((k) => k.wymagana && uklad[k.pole] === undefined).map((k) => k.naglowek)

  const komunikat =
    brakujace.length === 0
      ? null
      : `W pliku brakuje ${brakujace.length === 1 ? 'kolumny' : 'kolumn'}: ${brakujace.join(', ')}. ` +
        `Plik musi mieć w pierwszym wierszu kolumny: ${KOLUMNY.filter((k) => k.wymagana)
          .map((k) => k.naglowek)
          .join(', ')}. ` +
        `Kolumny ${KOLUMNY.filter((k) => !k.wymagana)
          .map((k) => k.naglowek)
          .join(' i ')} są nieobowiązkowe. Sprawdź nazwy kolumn w pliku i wgraj go ponownie.`

  return { uklad, brakujace, komunikat }
}

/** Surowe wartości komórek jednego wiersza, przypisane do pól (przed sprawdzeniem). */
export type SurowyWiersz = Partial<Record<PoleZPliku, unknown>>

/** Wyciąga z wiersza komórek wartości rozpoznanych pól. */
export function odczytajWiersz(komorki: readonly unknown[], uklad: UkladKolumn): SurowyWiersz {
  const wiersz: SurowyWiersz = {}
  for (const k of KOLUMNY) {
    const indeks = uklad[k.pole]
    if (indeks !== undefined) wiersz[k.pole] = komorki[indeks]
  }
  return wiersz
}
