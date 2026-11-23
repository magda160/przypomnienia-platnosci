import * as XLSX from 'xlsx'
import type { DaneFakturyZPliku, LiczbyWierszy } from '../typy'
import { odczytajWiersz, rozpoznajKolumny } from './kolumny'
import { walidujWiersz, type GrupaWiersza, type ProblemWiersza } from './walidacja'

/**
 * IMPORT PLIKU: wiersze arkusza → sprawdzone wiersze podzielone na trzy grupy
 * (poprawne / do uzupełnienia / do sprawdzenia) + obsługa powtórzonych numerów KSeF
 * według rozdz. 2.2 dokumentu wdrożeniowego:
 * - identyczne wiersze z tym samym numerem KSeF → zostaje pierwszy, reszta usunięta automatycznie,
 * - różne wiersze z tym samym numerem KSeF → JEDNA pozycja „do sprawdzenia”, w której widać wszystkie te wiersze
 *   (nie wiadomo, który jest prawdziwy).
 *
 * Liczby w podsumowaniu liczymy w FAKTURACH (po numerze KSeF), nie w wierszach pliku —
 * wyjątkiem jest `liczby.wszystkie`, czyli liczba wierszy z danymi w pliku.
 *
 * Scalanie z danymi zapisanymi wcześniej w aplikacji to osobny krok (krok 6).
 */

/** Jeden wiersz pliku po sprawdzeniu (wynik walidacji tego jednego wiersza). */
export interface WierszImportu {
  /** Numer wiersza tak, jak widać go w Excelu (nagłówek = wiersz 1). */
  numerWiersza: number
  grupa: GrupaWiersza
  problemy: ProblemWiersza[]
  dane: Partial<DaneFakturyZPliku>
}

/** Wiersz poprawny — ma komplet danych faktury. */
export interface WierszPoprawny extends WierszImportu {
  grupa: 'poprawne'
  dane: DaneFakturyZPliku
}

/**
 * Jedna faktura „do sprawdzenia”. Zwykle to jeden wiersz pliku; przy różnym duplikacie
 * (ten sam numer KSeF, różne dane) — wszystkie wiersze z tym numerem.
 */
export interface PozycjaDoSprawdzenia {
  /** Numer KSeF faktury; null, gdy wiersz go nie ma. */
  numerKsef: string | null
  /**
   * Komunikaty dla całej pozycji. Pojedynczy wiersz: jego problemy.
   * Różny duplikat: komunikat o powtórzonym numerze (problemy poszczególnych wierszy są przy wierszach).
   */
  problemy: ProblemWiersza[]
  /** Wiersze pliku tej faktury, w kolejności z pliku. Każdy ma swoje dane i własne problemy. */
  wiersze: WierszImportu[]
}

/** Identyczny duplikat usunięty automatycznie. */
export interface UsunietyDuplikat {
  numerWiersza: number
  numerKsef: string
  /** Wiersz, który został (pierwsze wystąpienie). */
  pozostawionyWiersz: number
}

export type WynikImportu =
  | {
      rodzaj: 'blad'
      /** Komunikat dla pracownika, co zrobić. */
      komunikat: string
      /** Brakujące wymagane kolumny (puste, gdy błąd ma inną przyczynę). */
      brakujaceKolumny: string[]
    }
  | {
      rodzaj: 'ok'
      poprawne: WierszPoprawny[]
      doUzupelnienia: WierszImportu[]
      doSprawdzenia: PozycjaDoSprawdzenia[]
      usunieteDuplikaty: UsunietyDuplikat[]
      liczby: LiczbyWierszy
    }

const czyPusta = (v: unknown) => v === null || v === undefined || String(v).trim() === ''

/** Klucz porównania numerów KSeF: bez spacji na brzegach, wielkie litery. */
const kluczKsef = (numer: string) => numer.trim().toUpperCase()

/**
 * Główna funkcja importu. `tabela` to wiersze arkusza: pierwszy wiersz to nagłówki,
 * kolejne to dane. Puste wiersze są pomijane (nie liczą się do „wszystkich”).
 */
export function importujWiersze(tabela: readonly (readonly unknown[])[]): WynikImportu {
  if (tabela.length === 0) {
    return {
      rodzaj: 'blad',
      komunikat: 'Plik jest pusty. Wgraj eksport faktur z nagłówkami kolumn w pierwszym wierszu.',
      brakujaceKolumny: [],
    }
  }

  const kolumny = rozpoznajKolumny(tabela[0])
  if (kolumny.komunikat) {
    return { rodzaj: 'blad', komunikat: kolumny.komunikat, brakujaceKolumny: kolumny.brakujace }
  }

  // 1. Sprawdzenie każdego niepustego wiersza.
  const wiersze: WierszImportu[] = []
  tabela.slice(1).forEach((komorki, i) => {
    if (!komorki || komorki.every(czyPusta)) return
    const wynik = walidujWiersz(odczytajWiersz(komorki, kolumny.uklad))
    wiersze.push({ numerWiersza: i + 2, ...wynik })
  })

  if (wiersze.length === 0) {
    return {
      rodzaj: 'blad',
      komunikat: 'Plik ma nagłówki kolumn, ale nie ma w nim żadnej faktury. Sprawdź, czy wgrywasz właściwy plik.',
      brakujaceKolumny: [],
    }
  }

  // 2. Powtórzone numery KSeF.
  const wgrupach = new Map<string, WierszImportu[]>()
  for (const w of wiersze) {
    if (!w.dane.numerKsef) continue // brak numeru zgłasza już walidacja
    const klucz = kluczKsef(w.dane.numerKsef)
    const lista = wgrupach.get(klucz)
    if (lista) lista.push(w)
    else wgrupach.set(klucz, [w])
  }

  /** Wiersze, które nie idą dalej jako osobne faktury (usunięte powtórzenia i wiersze różnych duplikatów). */
  const pominiete = new Set<WierszImportu>()
  const usunieteDuplikaty: UsunietyDuplikat[] = []
  /** Różne duplikaty: pozycja „do sprawdzenia” przypisana do pierwszego wiersza (dla zachowania kolejności z pliku). */
  const duplikatyRozne = new Map<WierszImportu, PozycjaDoSprawdzenia>()

  for (const lista of wgrupach.values()) {
    if (lista.length < 2) continue
    const pierwszy = lista[0]
    const odcisk = (w: WierszImportu) => JSON.stringify({ dane: w.dane, problemy: w.problemy })
    const wszystkieIdentyczne = lista.every((w) => odcisk(w) === odcisk(pierwszy))

    if (wszystkieIdentyczne) {
      for (const w of lista.slice(1)) {
        pominiete.add(w)
        usunieteDuplikaty.push({
          numerWiersza: w.numerWiersza,
          numerKsef: pierwszy.dane.numerKsef!,
          pozostawionyWiersz: pierwszy.numerWiersza,
        })
      }
    } else {
      const numery = lista.map((w) => w.numerWiersza).join(', ')
      for (const w of lista) pominiete.add(w)
      duplikatyRozne.set(pierwszy, {
        numerKsef: pierwszy.dane.numerKsef!,
        problemy: [
          {
            pole: 'numerKsef',
            grupa: 'doSprawdzenia',
            komunikat:
              `Numer KSeF ${pierwszy.dane.numerKsef} występuje w pliku kilka razy z różnymi danymi (wiersze ${numery}). ` +
              'Sprawdź, który wiersz jest prawdziwy, i usuń lub popraw pozostałe.',
          },
        ],
        wiersze: lista,
      })
    }
  }

  // 3. Podział na grupy (w kolejności z pliku).
  const poprawne: WierszPoprawny[] = []
  const doUzupelnienia: WierszImportu[] = []
  const doSprawdzenia: PozycjaDoSprawdzenia[] = []
  for (const w of wiersze) {
    const duplikat = duplikatyRozne.get(w)
    if (duplikat) doSprawdzenia.push(duplikat)
    else if (pominiete.has(w)) continue
    else if (w.grupa === 'poprawne') poprawne.push(w as WierszPoprawny)
    else if (w.grupa === 'doUzupelnienia') doUzupelnienia.push(w)
    else doSprawdzenia.push({ numerKsef: w.dane.numerKsef ?? null, problemy: w.problemy, wiersze: [w] })
  }

  return {
    rodzaj: 'ok',
    poprawne,
    doUzupelnienia,
    doSprawdzenia,
    usunieteDuplikaty,
    liczby: {
      wszystkie: wiersze.length,
      poprawne: poprawne.length,
      doUzupelnienia: doUzupelnienia.length,
      doSprawdzenia: doSprawdzenia.length,
      usunieteDuplikaty: usunieteDuplikaty.length,
    },
  }
}

/**
 * Odczytuje pierwszy arkusz pliku .xlsx, .xls lub .csv jako tabelę komórek.
 * CSV czytamy „surowo” (tekst bez zgadywania liczb i dat) — kwoty z przecinkiem
 * i daty ujednolica dopiero walidacja.
 */
export function odczytajArkusz(zawartosc: ArrayBuffer | Uint8Array, nazwaPliku: string): unknown[][] {
  const csv = /\.csv$/i.test(nazwaPliku)
  const skoroszyt = XLSX.read(zawartosc, { type: 'array', raw: csv, codepage: 65001 })
  const nazwaArkusza = skoroszyt.SheetNames[0]
  if (!nazwaArkusza) return []
  return XLSX.utils.sheet_to_json<unknown[]>(skoroszyt.Sheets[nazwaArkusza], {
    header: 1,
    raw: true,
    defval: '',
    blankrows: false,
  })
}

/** Odczyt pliku i import w jednym kroku. Gdy pliku nie da się otworzyć, zwraca błąd z komunikatem. */
export function importujPlik(zawartosc: ArrayBuffer | Uint8Array, nazwaPliku: string): WynikImportu {
  let tabela: unknown[][]
  try {
    tabela = odczytajArkusz(zawartosc, nazwaPliku)
  } catch {
    return {
      rodzaj: 'blad',
      komunikat: `Nie udało się otworzyć pliku „${nazwaPliku}”. Wgraj plik Excela (.xlsx, .xls) albo CSV.`,
      brakujaceKolumny: [],
    }
  }
  return importujWiersze(tabela)
}
