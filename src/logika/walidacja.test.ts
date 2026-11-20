import type { SurowyWiersz } from './kolumny'
import { walidujWiersz, odczytajDate, odczytajKwote, ujednolicEmail } from './walidacja'

/** Poprawny wiersz bazowy; w testach podmieniamy jedno pole. */
const POPRAWNY: SurowyWiersz = {
  numerKsef: '9990000001-20261104-A01003-25',
  nazwaKlienta: 'Kwiaciarnia Fioletowy Żuraw',
  email: 'kwiaty.zuraw@example.com',
  kwota: '850,00',
  terminPlatnosci: '2026-11-18',
  status: 'nieopłacona',
  kwotaZaplacona: '',
  uwagi: '',
}
const z = (zmiany: SurowyWiersz) => walidujWiersz({ ...POPRAWNY, ...zmiany })

describe('Poprawny wiersz', () => {
  it('przechodzi do poprawnych z ujednoliconymi danymi', () => {
    const w = walidujWiersz(POPRAWNY)
    expect(w.grupa).toBe('poprawne')
    expect(w.problemy).toEqual([])
    expect(w.dane).toEqual({
      numerKsef: '9990000001-20261104-A01003-25',
      nazwaKlienta: 'Kwiaciarnia Fioletowy Żuraw',
      email: 'kwiaty.zuraw@example.com',
      kwota: 850,
      terminPlatnosci: '2026-11-18',
      status: 'nieopłacona',
      kwotaZaplacona: 0,
      uwagi: '',
    })
  })
})

// ===== Tabela 2.1 — wiersz po wierszu =====

describe('2.1 Numer KSeF: niepusty', () => {
  it('pusty → do uzupełnienia', () => {
    const w = z({ numerKsef: '   ' })
    expect(w.grupa).toBe('doUzupelnienia')
    expect(w.problemy[0].pole).toBe('numerKsef')
  })
  it('spacje na brzegach są usuwane', () => {
    expect(z({ numerKsef: '  ABC-1 ' }).dane.numerKsef).toBe('ABC-1')
  })
})

describe('2.1 Nazwa klienta: niepusta', () => {
  it('pusta → do uzupełnienia', () => {
    const w = z({ nazwaKlienta: '' })
    expect(w.grupa).toBe('doUzupelnienia')
    expect(w.problemy[0].pole).toBe('nazwaKlienta')
  })
})

describe('2.1 E-mail: jedno @, kropka po nim, bez spacji, małe litery', () => {
  it('brak e-maila → do uzupełnienia (przypadek z 2.2)', () => {
    const w = z({ email: '' })
    expect(w.grupa).toBe('doUzupelnienia')
    expect(w.problemy[0].komunikat).toContain('Brak adresu e-mail')
  })
  it('zamiana na małe litery i usunięcie spacji z brzegów', () => {
    expect(z({ email: ' Piekarnia.Klos@Example.com ' }).dane.email).toBe('piekarnia.klos@example.com')
  })
  it.each([
    ['bez @', 'biuro.example.com'],
    ['dwa @', 'biuro@@example.com'],
    ['dwa @ w różnych miejscach', 'a@b@example.com'],
    ['bez kropki po @', 'biuro@example'],
    ['kropka tylko przed @', 'jan.kowalski@examplecom'],
    ['spacja w środku', 'biuro @example.com'],
    ['nic po kropce', 'biuro@example.'],
    ['nic przed @', '@example.com'],
  ])('niepoprawny (%s) → do uzupełnienia', (_opis, email) => {
    const w = z({ email })
    expect(w.grupa).toBe('doUzupelnienia')
    expect(w.problemy[0].komunikat).toContain('niepoprawny')
    expect(ujednolicEmail(email)).toBeNull()
  })
})

describe('2.1 Kwota: liczba większa od 0, przecinek → kropka', () => {
  it.each([
    ['850,00', 850],
    ['2340,50', 2340.5],
    ['2340.5', 2340.5],
    ['1 200,00', 1200],
    ['1 200,00', 1200],
    [560.75, 560.75],
    [2340.5000000001, 2340.5],
  ])('%j → %d', (wejscie, wynik) => {
    const w = z({ kwota: wejscie })
    expect(w.grupa).toBe('poprawne')
    expect(w.dane.kwota).toBe(wynik)
  })
  it.each([['0'], [0], ['-5,00'], [-5]])('%j → do uzupełnienia (musi być > 0)', (wejscie) => {
    const w = z({ kwota: wejscie })
    expect(w.grupa).toBe('doUzupelnienia')
    expect(w.problemy[0].komunikat).toContain('większa od 0')
  })
  it.each([['abc'], ['1.234,56'], ['12,345'], ['100 zł'], [true]])('%j → do uzupełnienia (nie liczba)', (wejscie) => {
    const w = z({ kwota: wejscie })
    expect(w.grupa).toBe('doUzupelnienia')
    expect(w.problemy[0].pole).toBe('kwota')
  })
  it('pusta → do uzupełnienia', () => {
    expect(z({ kwota: '' }).grupa).toBe('doUzupelnienia')
    expect(odczytajKwote(null)).toEqual({ rodzaj: 'pusta' })
  })
})

describe('2.1 Kwota zapłacona: puste = 0, od 0 do kwoty faktury', () => {
  it('puste = 0', () => {
    expect(z({ kwotaZaplacona: '' }).dane.kwotaZaplacona).toBe(0)
    expect(z({ kwotaZaplacona: undefined }).dane.kwotaZaplacona).toBe(0)
  })
  it('ujemna → do uzupełnienia', () => {
    const w = z({ kwotaZaplacona: '-10' })
    expect(w.grupa).toBe('doUzupelnienia')
    expect(w.problemy[0].pole).toBe('kwotaZaplacona')
  })
  it('nie liczba → do uzupełnienia', () => {
    expect(z({ kwotaZaplacona: 'sto' }).grupa).toBe('doUzupelnienia')
  })
  it('większa niż kwota faktury (nadpłata, przypadek z 2.2) → do sprawdzenia', () => {
    const w = z({ kwota: '640,00', kwotaZaplacona: '700,00', status: 'opłacona' })
    expect(w.grupa).toBe('doSprawdzenia')
    expect(w.problemy).toHaveLength(1)
    expect(w.problemy[0].komunikat).toContain('więcej niż wynosi faktura')
  })
  it('równa kwocie faktury przy statusie „opłacona” → poprawne', () => {
    expect(z({ kwotaZaplacona: '850,00', status: 'opłacona' }).grupa).toBe('poprawne')
  })
})

describe('2.1 Termin płatności: poprawna data, zapis RRRR-MM-DD', () => {
  it.each([
    ['2026-11-18', '2026-11-18'],
    [' 2026-11-18 ', '2026-11-18'],
    ['18.11.2026', '2026-11-18'],
    ['8.1.2026', '2026-01-08'],
    [46344, '2026-11-18'], // data Excela (liczba)
    [46344.75, '2026-11-18'], // data Excela z godziną
    [new Date(Date.UTC(2026, 10, 18)), '2026-11-18'], // północ UTC
    [new Date(2026, 10, 18), '2026-11-18'], // północ czasu lokalnego
    ['2024-02-29', '2024-02-29'], // rok przestępny
  ])('%j → %s', (wejscie, wynik) => {
    expect(odczytajDate(wejscie)).toEqual({ rodzaj: 'ok', wartosc: wynik })
    expect(z({ terminPlatnosci: wejscie }).dane.terminPlatnosci).toBe(wynik)
  })
  it.each([['2026-02-30'], ['2025-02-29'], ['2026-13-01'], ['jutro'], ['18/11/2026'], ['11.18.2026'], [850], [-1], ['1899-12-31']])(
    '%j → do uzupełnienia (niepoprawna data)',
    (wejscie) => {
      const w = z({ terminPlatnosci: wejscie })
      expect(w.grupa).toBe('doUzupelnienia')
      expect(w.problemy[0].komunikat).toContain('RRRR-MM-DD')
    },
  )
  it('pusty → do uzupełnienia', () => {
    expect(z({ terminPlatnosci: '' }).grupa).toBe('doUzupelnienia')
    expect(z({ terminPlatnosci: null }).grupa).toBe('doUzupelnienia')
  })
})

describe('2.1 Status: stała lista znanych słów, bez szukania fragmentu tekstu', () => {
  it('„  NIEOPŁACONA ” → nieopłacona', () => {
    expect(z({ status: '  NIEOPŁACONA ' }).dane.status).toBe('nieopłacona')
  })
  it('„zapłacone” → opłacona, „niezapłacone” → nieopłacona (różne!)', () => {
    expect(z({ status: 'zapłacone', kwotaZaplacona: '850' }).dane.status).toBe('opłacona')
    expect(z({ status: 'niezapłacone' }).dane.status).toBe('nieopłacona')
    expect(z({ status: 'niezapłacone' }).dane.status).not.toBe('opłacona')
  })
  it('nieznane słowo → do sprawdzenia (przypadek z 2.2)', () => {
    const w = z({ status: 'w windykacji' })
    expect(w.grupa).toBe('doSprawdzenia')
    expect(w.problemy[0].komunikat).toContain('Nieznany status „w windykacji”')
  })
  it('słowo zawierające znane słowo nie jest rozpoznane', () => {
    expect(z({ status: 'prawie zapłacone' }).grupa).toBe('doSprawdzenia')
  })
  it('pusty status → do uzupełnienia', () => {
    expect(z({ status: '' }).grupa).toBe('doUzupelnienia')
  })
})

describe('2.1 Ugoda (raty)', () => {
  it('nie jest czytana z pliku — ustawia się ją w aplikacji (dane z pliku nie mają tego pola)', () => {
    expect(walidujWiersz(POPRAWNY).dane).not.toHaveProperty('ugoda')
  })
})

describe('2.1 Uwagi: dowolny tekst, nie wpływa na decyzje', () => {
  it('uwagi „ZAPŁACONE, nie wysyłać” nie zmieniają statusu ani grupy', () => {
    const w = z({ uwagi: '  ZAPŁACONE, nie wysyłać ' })
    expect(w.grupa).toBe('poprawne')
    expect(w.dane.status).toBe('nieopłacona')
    expect(w.dane.uwagi).toBe('ZAPŁACONE, nie wysyłać')
  })
  it('brak uwag = pusty tekst', () => {
    expect(z({ uwagi: undefined }).dane.uwagi).toBe('')
  })
})

// ===== Spójność statusu z kwotami =====

describe('Spójność statusu z kwotami', () => {
  it.each([
    ['nieopłacona', '', 'poprawne'],
    ['nieopłacona', '0', 'poprawne'],
    ['nieopłacona', '850,00', 'doSprawdzenia'], // przykład z 2.1
    ['nieopłacona', '100,00', 'doSprawdzenia'],
    ['opłacona częściowo', '100,00', 'poprawne'],
    ['opłacona częściowo', '', 'doSprawdzenia'],
    ['opłacona częściowo', '850,00', 'doSprawdzenia'],
    ['opłacona', '850,00', 'poprawne'],
    ['opłacona', '', 'poprawne'], // eksport może nie wypełniać „Zapłacono”
    ['opłacona', '100,00', 'doSprawdzenia'],
  ])('status „%s”, zapłacono „%s” → %s', (status, zaplacono, grupa) => {
    expect(z({ status, kwotaZaplacona: zaplacono }).grupa).toBe(grupa)
  })
  it('komunikat mówi, co zrobić', () => {
    const w = z({ status: 'nieopłacona', kwotaZaplacona: '850,00' })
    expect(w.problemy[0].komunikat).toContain('zapłacono całą kwotę')
    expect(w.problemy[0].komunikat).toContain('popraw status')
  })
  it('nie sprawdza spójności, gdy kwota jest błędna (jeden problem, nie dwa)', () => {
    const w = z({ kwota: 'abc', kwotaZaplacona: '100' })
    expect(w.problemy).toHaveLength(1)
  })
})

describe('Kilka problemów w jednym wierszu', () => {
  it('pokazuje wszystkie problemy', () => {
    const w = z({ email: '', kwota: '', status: '' })
    expect(w.grupa).toBe('doUzupelnienia')
    expect(w.problemy.map((p) => p.pole)).toEqual(['email', 'kwota', 'status'])
  })
  it('brak + problem do sprawdzenia → do sprawdzenia, z oboma komunikatami', () => {
    const w = z({ email: '', kwota: '640,00', kwotaZaplacona: '700,00' })
    expect(w.grupa).toBe('doSprawdzenia')
    expect(w.problemy.map((p) => p.grupa)).toEqual(['doUzupelnienia', 'doSprawdzenia'])
  })
})
