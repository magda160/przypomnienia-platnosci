import { rozpoznajKolumny, odczytajWiersz, ujednolicNaglowek } from './kolumny'

const NAGLOWKI_EKSPORTU = ['Numer KSeF', 'Kontrahent', 'E-mail', 'Kwota brutto', 'Termin płatności', 'Status', 'Zapłacono', 'Uwagi']

describe('Rozpoznawanie nagłówków kolumn', () => {
  it('rozpoznaje nagłówki dokładnie jak w eksporcie', () => {
    const { uklad, brakujace, komunikat } = rozpoznajKolumny(NAGLOWKI_EKSPORTU)
    expect(brakujace).toEqual([])
    expect(komunikat).toBeNull()
    expect(uklad).toEqual({
      numerKsef: 0, nazwaKlienta: 1, email: 2, kwota: 3, terminPlatnosci: 4, status: 5, kwotaZaplacona: 6, uwagi: 7,
    })
  })

  it('„E-mail” = „email” = „EMAIL” = „ e-mail ”', () => {
    for (const n of ['E-mail', 'email', 'EMAIL', ' e-mail ', 'E-Mail']) {
      expect(ujednolicNaglowek(n)).toBe('email')
    }
  })

  it('ignoruje wielkość liter, spacje na brzegach i polskie znaki', () => {
    const { uklad, brakujace } = rozpoznajKolumny([
      '  NUMER KSEF ', 'kontrahent', 'Email', 'KWOTA BRUTTO', 'termin platnosci', ' status', 'ZAPLACONO', 'uwagi ',
    ])
    expect(brakujace).toEqual([])
    expect(uklad.terminPlatnosci).toBe(4)
    expect(uklad.kwotaZaplacona).toBe(6)
  })

  it('kolumny mogą być w dowolnej kolejności, a dodatkowe kolumny są pomijane', () => {
    const { uklad, brakujace } = rozpoznajKolumny([
      'Lp.', 'Status', 'Termin płatności', 'Kontrahent', 'NIP', 'Numer KSeF', 'Kwota brutto', 'E-mail',
    ])
    expect(brakujace).toEqual([])
    expect(uklad).toEqual({ status: 1, terminPlatnosci: 2, nazwaKlienta: 3, numerKsef: 5, kwota: 6, email: 7 })
  })

  it('brak nieobowiązkowych kolumn Zapłacono i Uwagi nie blokuje wgrania', () => {
    const { brakujace, komunikat } = rozpoznajKolumny(NAGLOWKI_EKSPORTU.slice(0, 6))
    expect(brakujace).toEqual([])
    expect(komunikat).toBeNull()
  })

  it('przy brakującej kolumnie podaje czytelny komunikat, które kolumny są potrzebne', () => {
    const { brakujace, komunikat } = rozpoznajKolumny(['Numer KSeF', 'Kontrahent', 'Kwota brutto', 'Termin płatności', 'Status'])
    expect(brakujace).toEqual(['E-mail'])
    expect(komunikat).toContain('W pliku brakuje kolumny: E-mail.')
    expect(komunikat).toContain('Numer KSeF, Kontrahent, E-mail, Kwota brutto, Termin płatności, Status')
  })

  it('przy kilku brakujących kolumnach wymienia wszystkie', () => {
    const { brakujace, komunikat } = rozpoznajKolumny(['Numer KSeF', 'Kontrahent'])
    expect(brakujace).toEqual(['E-mail', 'Kwota brutto', 'Termin płatności', 'Status'])
    expect(komunikat).toContain('W pliku brakuje kolumn: E-mail, Kwota brutto, Termin płatności, Status.')
  })

  it('pusty wiersz nagłówków = brak wszystkich wymaganych kolumn', () => {
    expect(rozpoznajKolumny([]).brakujace).toHaveLength(6)
  })

  it('powtórzony nagłówek: liczy się pierwsza kolumna', () => {
    const { uklad } = rozpoznajKolumny([...NAGLOWKI_EKSPORTU, 'E-mail'])
    expect(uklad.email).toBe(2)
  })
})

describe('Odczyt wiersza według rozpoznanych kolumn', () => {
  it('przypisuje komórki do pól', () => {
    const { uklad } = rozpoznajKolumny(['Status', 'Numer KSeF', 'Kontrahent', 'E-mail', 'Kwota brutto', 'Termin płatności'])
    const w = odczytajWiersz(['nieopłacona', 'KSEF-1', 'Firma Testowa', 'a@example.com', '100,00', '2026-11-18'], uklad)
    expect(w).toEqual({
      status: 'nieopłacona', numerKsef: 'KSEF-1', nazwaKlienta: 'Firma Testowa', email: 'a@example.com', kwota: '100,00',
      terminPlatnosci: '2026-11-18',
    })
  })
})
