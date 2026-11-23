import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { importujPlik, importujWiersze, type WynikImportu } from './import'

const NAGLOWKI = ['Numer KSeF', 'Kontrahent', 'E-mail', 'Kwota brutto', 'Termin płatności', 'Status', 'Zapłacono', 'Uwagi']
const wiersz = (ksef: string, zmiany: Partial<Record<number, unknown>> = {}) => {
  const w: unknown[] = [ksef, 'Firma Testowa', 'firma@example.com', '100,00', '2026-11-10', 'nieopłacona', '', '']
  for (const [i, v] of Object.entries(zmiany)) w[Number(i)] = v
  return w
}
function ok(wynik: WynikImportu) {
  if (wynik.rodzaj !== 'ok') throw new Error(`Oczekiwano poprawnego importu, a jest błąd: ${wynik.komunikat}`)
  return wynik
}

// ===== Pliki testowe z katalogu przyklady/ =====

describe.each(['faktury-test.csv', 'faktury-test.xlsx'])('Plik testowy %s', (nazwa) => {
  const zawartosc = readFileSync(join(process.cwd(), 'przyklady', nazwa))
  const wynik = ok(importujPlik(new Uint8Array(zawartosc), nazwa))
  const numery = (lista: { dane: { numerKsef?: string } }[]) => lista.map((w) => w.dane.numerKsef!.slice(0, 10))

  // Oczekiwanie zapisane w przyklady/README.md (liczone w fakturach, po numerze KSeF).
  it('daje oczekiwane liczby w każdej grupie: 10 / 1 / 4 / 1 usunięte powtórzenie', () => {
    expect(wynik.liczby).toEqual({
      wszystkie: 17, // wiersze z danymi w pliku
      poprawne: 10,
      doUzupelnienia: 1,
      doSprawdzenia: 4,
      usunieteDuplikaty: 1,
    })
  })

  it('do uzupełnienia trafia wiersz bez e-maila', () => {
    expect(numery(wynik.doUzupelnienia)).toEqual(['9990000007'])
    expect(wynik.doUzupelnienia[0].problemy[0].pole).toBe('email')
  })

  it('do sprawdzenia: różny duplikat (jedna pozycja), nadpłata, nieznany status, status niezgodny z kwotami', () => {
    expect(wynik.doSprawdzenia.map((p) => p.numerKsef!.slice(0, 10))).toEqual([
      '9990000009',
      '9990000010',
      '9990000013',
      '9990000014',
    ])
  })

  it('różny duplikat to jedna pozycja, w której widać oba wiersze z ich kwotami', () => {
    const duplikat = wynik.doSprawdzenia[0]
    expect(duplikat.wiersze.map((w) => w.numerWiersza)).toEqual([11, 12])
    expect(duplikat.wiersze.map((w) => w.dane.kwota)).toEqual([1500, 1550])
    expect(duplikat.problemy[0].komunikat).toContain('wiersze 11, 12')
  })

  it('identyczny duplikat zostaje jeden raz, a usunięty wiersz jest zapisany', () => {
    expect(numery(wynik.poprawne).filter((n) => n === '9990000008')).toHaveLength(1)
    expect(wynik.usunieteDuplikaty).toEqual([
      { numerWiersza: 10, numerKsef: '9990000008-20261102-A08018-28', pozostawionyWiersz: 9 },
    ])
  })

  it('dane poprawnych wierszy są ujednolicone (e-mail małymi literami, kwota jako liczba, data RRRR-MM-DD)', () => {
    const w = wynik.poprawne.find((p) => p.dane.numerKsef.startsWith('9990000003'))!
    expect(w.dane.email).toBe('piekarnia.klos@example.com')
    expect(w.dane.kwota).toBe(2340.5)
    expect(w.dane.terminPlatnosci).toBe('2026-11-04')
    expect(w.dane.status).toBe('nieopłacona')
    const czesciowa = wynik.poprawne.find((p) => p.dane.numerKsef.startsWith('9990000006'))!
    expect(czesciowa.dane.kwotaZaplacona).toBe(1000)
  })

  it('numery wierszy odpowiadają wierszom w Excelu (nagłówek = 1)', () => {
    expect(wynik.doUzupelnienia[0].numerWiersza).toBe(8)
  })
})

it('CSV i XLSX dają te same dane faktur', () => {
  const wczytaj = (nazwa: string) =>
    ok(importujPlik(new Uint8Array(readFileSync(join(process.cwd(), 'przyklady', nazwa))), nazwa))
  const csv = wczytaj('faktury-test.csv')
  const xlsx = wczytaj('faktury-test.xlsx')
  expect(xlsx.poprawne.map((w) => w.dane)).toEqual(csv.poprawne.map((w) => w.dane))
})

// ===== Duplikaty numerów KSeF (2.2) =====

describe('2.2 Ta sama faktura dwa razy w pliku', () => {
  it('identyczne wiersze → zostaje pierwszy, bez zgłaszania do człowieka', () => {
    const w = ok(importujWiersze([NAGLOWKI, wiersz('K1'), wiersz('K1'), wiersz('K1')]))
    expect(w.liczby).toEqual({ wszystkie: 3, poprawne: 1, doUzupelnienia: 0, doSprawdzenia: 0, usunieteDuplikaty: 2 })
    expect(w.poprawne[0].numerWiersza).toBe(2)
  })

  it('wiersze różniące się tylko zapisem (wielkość liter w e-mailu, kwota 100 vs 100,00) są identyczne', () => {
    const w = ok(importujWiersze([NAGLOWKI, wiersz('K1'), wiersz('K1', { 2: 'FIRMA@Example.com', 3: '100' })]))
    expect(w.liczby.usunieteDuplikaty).toBe(1)
    expect(w.liczby.poprawne).toBe(1)
  })

  it('różne wiersze → jedna pozycja do sprawdzenia z wszystkimi wierszami i komunikatem z ich numerami', () => {
    const w = ok(importujWiersze([NAGLOWKI, wiersz('K1'), wiersz('K2'), wiersz('K1', { 3: '200,00' }), wiersz('K1', { 3: '300,00' })]))
    expect(w.liczby).toEqual({ wszystkie: 4, poprawne: 1, doUzupelnienia: 0, doSprawdzenia: 1, usunieteDuplikaty: 0 })
    expect(w.poprawne.map((p) => p.dane.numerKsef)).toEqual(['K2'])
    const [d] = w.doSprawdzenia
    expect(d.numerKsef).toBe('K1')
    expect(d.wiersze.map((r) => r.numerWiersza)).toEqual([2, 4, 5])
    expect(d.problemy).toHaveLength(1)
    expect(d.problemy[0]).toMatchObject({ pole: 'numerKsef', grupa: 'doSprawdzenia' })
    expect(d.problemy[0].komunikat).toContain('wiersze 2, 4, 5')
  })

  it('numer KSeF porównywany bez spacji na brzegach i bez względu na wielkość liter', () => {
    const w = ok(importujWiersze([NAGLOWKI, wiersz('ab-1'), wiersz(' AB-1 ', { 3: '5,00' })]))
    expect(w.liczby.doSprawdzenia).toBe(1)
    expect(w.doSprawdzenia[0].wiersze).toHaveLength(2)
  })

  it('różny duplikat z brakami → jedna pozycja; braki widać przy wierszu, którego dotyczą', () => {
    const w = ok(importujWiersze([NAGLOWKI, wiersz('K1'), wiersz('K1', { 2: '' })]))
    expect(w.liczby).toEqual({ wszystkie: 2, poprawne: 0, doUzupelnienia: 0, doSprawdzenia: 1, usunieteDuplikaty: 0 })
    const [pierwszy, zBrakiem] = w.doSprawdzenia[0].wiersze
    expect(pierwszy.problemy).toEqual([])
    expect(zBrakiem.problemy.map((p) => p.pole)).toEqual(['email'])
  })

  it('pojedynczy wiersz do sprawdzenia to pozycja z jednym wierszem i jego problemami', () => {
    const w = ok(importujWiersze([NAGLOWKI, wiersz('K1', { 5: 'w windykacji' })]))
    const [d] = w.doSprawdzenia
    expect(d.numerKsef).toBe('K1')
    expect(d.wiersze.map((r) => r.numerWiersza)).toEqual([2])
    expect(d.problemy.map((p) => p.pole)).toEqual(['status'])
  })

  it('wiersze bez numeru KSeF nie są traktowane jako duplikaty', () => {
    const w = ok(importujWiersze([NAGLOWKI, wiersz(''), wiersz('')]))
    expect(w.liczby).toEqual({ wszystkie: 2, poprawne: 0, doUzupelnienia: 2, doSprawdzenia: 0, usunieteDuplikaty: 0 })
  })
})

// ===== Pozostałe =====

describe('Import — pozostałe przypadki', () => {
  it('puste wiersze są pomijane', () => {
    const w = ok(importujWiersze([NAGLOWKI, wiersz('K1'), ['', '', null], [], wiersz('K2')]))
    expect(w.liczby.wszystkie).toBe(2)
    expect(w.poprawne.map((p) => p.numerWiersza)).toEqual([2, 5])
  })

  it('brak wymaganej kolumny → błąd z listą brakujących kolumn', () => {
    const w = importujWiersze([NAGLOWKI.filter((n) => n !== 'E-mail'), ['K1']])
    expect(w.rodzaj).toBe('blad')
    if (w.rodzaj === 'blad') {
      expect(w.brakujaceKolumny).toEqual(['E-mail'])
      expect(w.komunikat).toContain('E-mail')
    }
  })

  it('pusty plik → czytelny błąd', () => {
    const w = importujWiersze([])
    expect(w.rodzaj).toBe('blad')
  })

  it('same nagłówki → czytelny błąd', () => {
    const w = importujWiersze([NAGLOWKI])
    expect(w.rodzaj === 'blad' && w.komunikat).toContain('nie ma w nim żadnej faktury')
  })

  it('plik, którego nie da się odczytać → błąd, nie awaria', () => {
    const w = importujPlik(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3]), 'zepsuty.xlsx')
    expect(w.rodzaj).toBe('blad')
  })
})
