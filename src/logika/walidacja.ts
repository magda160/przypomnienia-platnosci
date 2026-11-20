import type { DaneFakturyZPliku, DataISO, PoleZPliku, StatusFaktury } from '../typy'
import type { SurowyWiersz } from './kolumny'
import { rozpoznajStatus } from './statusy'

/**
 * Sprawdzanie jednego wiersza pliku według tabeli 2.1 dokumentu wdrożeniowego
 * oraz kontrola spójności statusu z kwotami.
 *
 * Podział na grupy:
 * - „do uzupełnienia” — czegoś brakuje albo pole jest źle wpisane (pracownik poprawia dane),
 * - „do sprawdzenia”  — dane się wykluczają lub nie wiadomo, co jest prawdą (decyzja człowieka):
 *                       nieznany status, nadpłata, status niezgodny z kwotami.
 * Jeśli wiersz ma problemy obu rodzajów, trafia do „do sprawdzenia” (z listą wszystkich problemów).
 */

export type GrupaWiersza = 'poprawne' | 'doUzupelnienia' | 'doSprawdzenia'

export interface ProblemWiersza {
  /** Pole, którego dotyczy problem; null = problem kilku pól naraz (np. status i kwoty). */
  pole: PoleZPliku | null
  grupa: Exclude<GrupaWiersza, 'poprawne'>
  /** Komunikat dla pracownika: co jest nie tak i co zrobić. */
  komunikat: string
}

export interface WynikWalidacji {
  grupa: GrupaWiersza
  problemy: ProblemWiersza[]
  /** Ujednolicone wartości pól, które udało się odczytać (komplet, gdy grupa = „poprawne”). */
  dane: Partial<DaneFakturyZPliku>
}

/** Najwcześniejszy i najpóźniejszy rok uznawany za sensowny termin płatności. */
const ROK_OD = 2000
const ROK_DO = 2099

// ---------- pomocnicze: odczyt wartości ----------

type Odczyt<T> = { rodzaj: 'pusta' } | { rodzaj: 'bledna'; tekst: string } | { rodzaj: 'ok'; wartosc: T }

function jakoTekst(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (v instanceof Date) return isNaN(v.getTime()) ? '' : v.toISOString().slice(0, 10)
  return String(v).replace(/ /g, ' ').trim()
}

/** Kwota: liczba z Excela albo tekst z przecinkiem lub kropką; spacje (separator tysięcy) są pomijane. */
export function odczytajKwote(v: unknown): Odczyt<number> {
  if (typeof v === 'number') {
    return Number.isFinite(v) ? { rodzaj: 'ok', wartosc: Math.round(v * 100) / 100 } : { rodzaj: 'bledna', tekst: String(v) }
  }
  const tekst = jakoTekst(v)
  if (tekst === '') return { rodzaj: 'pusta' }
  if (typeof v !== 'string') return { rodzaj: 'bledna', tekst }
  const zapis = tekst.replace(/\s/g, '').replace(',', '.')
  if (!/^-?\d+(\.\d{1,2})?$/.test(zapis)) return { rodzaj: 'bledna', tekst }
  return { rodzaj: 'ok', wartosc: Number(zapis) }
}

function dataZCzesci(rok: number, miesiac: number, dzien: number): DataISO | null {
  if (rok < ROK_OD || rok > ROK_DO) return null
  const d = new Date(Date.UTC(rok, miesiac - 1, dzien))
  if (d.getUTCFullYear() !== rok || d.getUTCMonth() !== miesiac - 1 || d.getUTCDate() !== dzien) return null
  return d.toISOString().slice(0, 10)
}

/**
 * Termin płatności: data Excela (liczba dni od 30.12.1899), obiekt daty,
 * tekst RRRR-MM-DD albo DD.MM.RRRR. Wynik zawsze RRRR-MM-DD.
 */
export function odczytajDate(v: unknown): Odczyt<DataISO> {
  if (v === null || v === undefined) return { rodzaj: 'pusta' }

  if (v instanceof Date) {
    if (isNaN(v.getTime())) return { rodzaj: 'bledna', tekst: String(v) }
    // Najbliższa północ UTC — odporne na strefę czasową, w której program odczytał datę.
    const d = new Date(v.getTime() + 12 * 3600 * 1000)
    const wynik = dataZCzesci(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())
    return wynik ? { rodzaj: 'ok', wartosc: wynik } : { rodzaj: 'bledna', tekst: jakoTekst(v) }
  }

  if (typeof v === 'number') {
    if (!Number.isFinite(v) || v <= 0) return { rodzaj: 'bledna', tekst: String(v) }
    const d = new Date(Date.UTC(1899, 11, 30) + Math.floor(v) * 86400000)
    const wynik = dataZCzesci(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())
    return wynik ? { rodzaj: 'ok', wartosc: wynik } : { rodzaj: 'bledna', tekst: String(v) }
  }

  const tekst = jakoTekst(v)
  if (tekst === '') return { rodzaj: 'pusta' }
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(tekst)
  let wynik: DataISO | null = null
  if (m) wynik = dataZCzesci(+m[1], +m[2], +m[3])
  else if ((m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(tekst))) wynik = dataZCzesci(+m[3], +m[2], +m[1])
  return wynik ? { rodzaj: 'ok', wartosc: wynik } : { rodzaj: 'bledna', tekst }
}

/** E-mail: jedno „@”, kropka po nim, bez spacji. Zwraca adres małymi literami albo null. */
export function ujednolicEmail(v: unknown): string | null {
  const email = jakoTekst(v).toLowerCase()
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? email : null
}

const zl = (n: number) => `${n.toFixed(2).replace('.', ',')} zł`
const grosze = (n: number) => Math.round(n * 100)

// ---------- główna funkcja ----------

export function walidujWiersz(w: SurowyWiersz): WynikWalidacji {
  const problemy: ProblemWiersza[] = []
  const dane: Partial<DaneFakturyZPliku> = {}
  const doUzupelnienia = (pole: PoleZPliku, komunikat: string) => problemy.push({ pole, grupa: 'doUzupelnienia', komunikat })
  const doSprawdzenia = (pole: PoleZPliku | null, komunikat: string) =>
    problemy.push({ pole, grupa: 'doSprawdzenia', komunikat })

  // Numer KSeF — niepusty (unikalność sprawdza import całego pliku)
  const ksef = jakoTekst(w.numerKsef)
  if (ksef) dane.numerKsef = ksef
  else doUzupelnienia('numerKsef', 'Brak numeru KSeF. Uzupełnij numer faktury.')

  // Kontrahent — niepusty
  const nazwa = jakoTekst(w.nazwaKlienta)
  if (nazwa) dane.nazwaKlienta = nazwa
  else doUzupelnienia('nazwaKlienta', 'Brak nazwy kontrahenta. Uzupełnij nazwę klienta.')

  // E-mail — jedno @, kropka po nim, bez spacji; małe litery
  const emailTekst = jakoTekst(w.email)
  if (!emailTekst) {
    doUzupelnienia('email', 'Brak adresu e-mail klienta. Uzupełnij adres, żeby można było wysłać przypomnienie.')
  } else {
    const email = ujednolicEmail(emailTekst)
    if (email) dane.email = email
    else
      doUzupelnienia(
        'email',
        `Adres e-mail „${emailTekst}” jest niepoprawny: musi mieć jedno „@”, kropkę po nim i nie może zawierać spacji. Popraw adres.`,
      )
  }

  // Kwota brutto — liczba > 0
  const kwota = odczytajKwote(w.kwota)
  if (kwota.rodzaj === 'pusta') doUzupelnienia('kwota', 'Brak kwoty brutto. Uzupełnij kwotę faktury.')
  else if (kwota.rodzaj === 'bledna')
    doUzupelnienia('kwota', `Kwota brutto „${kwota.tekst}” nie jest liczbą. Wpisz kwotę, np. 1200,50.`)
  else if (kwota.wartosc <= 0)
    doUzupelnienia('kwota', `Kwota brutto musi być większa od 0 (jest ${zl(kwota.wartosc)}). Popraw kwotę.`)
  else dane.kwota = kwota.wartosc

  // Zapłacono — puste = 0, liczba ≥ 0 (górną granicę sprawdza kontrola nadpłaty)
  const zaplacono = odczytajKwote(w.kwotaZaplacona)
  if (zaplacono.rodzaj === 'pusta') dane.kwotaZaplacona = 0
  else if (zaplacono.rodzaj === 'bledna')
    doUzupelnienia('kwotaZaplacona', `Kwota w kolumnie „Zapłacono” („${zaplacono.tekst}”) nie jest liczbą. Wpisz kwotę albo zostaw puste pole.`)
  else if (zaplacono.wartosc < 0)
    doUzupelnienia('kwotaZaplacona', `Kwota zapłacona nie może być ujemna (jest ${zl(zaplacono.wartosc)}). Popraw kwotę.`)
  else dane.kwotaZaplacona = zaplacono.wartosc

  // Termin płatności — poprawna data, zapis RRRR-MM-DD
  const termin = odczytajDate(w.terminPlatnosci)
  if (termin.rodzaj === 'pusta') doUzupelnienia('terminPlatnosci', 'Brak terminu płatności. Uzupełnij datę.')
  else if (termin.rodzaj === 'bledna')
    doUzupelnienia(
      'terminPlatnosci',
      `Termin płatności „${termin.tekst}” nie jest poprawną datą. Wpisz datę w formacie RRRR-MM-DD, np. 2026-11-20.`,
    )
  else dane.terminPlatnosci = termin.wartosc

  // Status — tylko według stałej listy znanych słów (statusy.ts)
  const statusTekst = jakoTekst(w.status)
  if (!statusTekst) {
    doUzupelnienia('status', 'Brak statusu. Wpisz: nieopłacona, opłacona albo opłacona częściowo.')
  } else {
    const status = rozpoznajStatus(statusTekst)
    if (status) dane.status = status
    else
      doSprawdzenia(
        'status',
        `Nieznany status „${statusTekst}”. Sprawdź, czy faktura jest opłacona, i wpisz: nieopłacona, opłacona albo opłacona częściowo.`,
      )
  }

  // Uwagi — dowolny tekst, nie wpływa na decyzje
  dane.uwagi = jakoTekst(w.uwagi)

  // Spójność statusu z kwotami (tylko gdy wszystkie trzy pola są poprawne)
  if (dane.kwota !== undefined && dane.kwotaZaplacona !== undefined) {
    const k = grosze(dane.kwota)
    const z = grosze(dane.kwotaZaplacona)
    if (z > k) {
      doSprawdzenia(
        'kwotaZaplacona',
        `Zapłacono ${zl(dane.kwotaZaplacona)}, czyli więcej niż wynosi faktura (${zl(dane.kwota)}). Sprawdź, czy to błąd wpisu, czy nadpłata do zwrotu.`,
      )
    } else if (dane.status) {
      const blad = niespojnosc(dane.status, k, z)
      if (blad) doSprawdzenia(null, blad)
    }
  }

  const grupa: GrupaWiersza = problemy.some((p) => p.grupa === 'doSprawdzenia')
    ? 'doSprawdzenia'
    : problemy.length > 0
      ? 'doUzupelnienia'
      : 'poprawne'

  return { grupa, problemy, dane }
}

/** Zwraca opis niezgodności statusu z kwotami (w groszach, z ≤ k) albo null, gdy wszystko się zgadza. */
function niespojnosc(status: StatusFaktury, k: number, z: number): string | null {
  const co = 'Sprawdź, czy klient zapłacił, i popraw status albo kwotę zapłaconą.'
  switch (status) {
    case 'nieopłacona':
      if (z === k) return `Status „nieopłacona”, ale zapłacono całą kwotę faktury. ${co}`
      if (z > 0) return `Status „nieopłacona”, ale zapłacono część kwoty (powinno być „opłacona częściowo”?). ${co}`
      return null
    case 'opłacona częściowo':
      if (z === 0) return `Status „opłacona częściowo”, ale kwota zapłacona jest pusta lub równa 0. ${co}`
      if (z === k) return `Status „opłacona częściowo”, ale zapłacono całą kwotę faktury. ${co}`
      return null
    case 'opłacona':
      // Puste „Zapłacono” przy fakturze opłaconej jest dopuszczalne (eksport może go nie wypełniać).
      if (z > 0 && z < k) return `Status „opłacona”, ale zapłacono tylko część kwoty. ${co}`
      return null
  }
}
