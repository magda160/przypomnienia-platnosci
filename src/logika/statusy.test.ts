import { ZNANE_STATUSY, rozpoznajStatus, ujednolicSlowo } from './statusy'

describe('Stała lista znanych słów w statusie', () => {
  it('każde słowo na liście jest zapisane w ujednoliconej postaci (inaczej nigdy by nie pasowało)', () => {
    for (const slowo of Object.keys(ZNANE_STATUSY)) {
      expect(ujednolicSlowo(slowo)).toBe(slowo)
    }
  })

  it('„zapłacone” → opłacona', () => {
    expect(rozpoznajStatus('zapłacone')).toBe('opłacona')
  })

  it('„niezapłacone” → nieopłacona (NIE opłacona, choć zawiera „zapłacone”)', () => {
    expect(rozpoznajStatus('niezapłacone')).toBe('nieopłacona')
    expect(rozpoznajStatus('niezapłacone')).not.toBe('opłacona')
  })

  it('podstawowe trzy statusy rozpoznają się same', () => {
    expect(rozpoznajStatus('nieopłacona')).toBe('nieopłacona')
    expect(rozpoznajStatus('opłacona')).toBe('opłacona')
    expect(rozpoznajStatus('opłacona częściowo')).toBe('opłacona częściowo')
  })

  it('ignoruje wielkość liter i spacje na brzegach', () => {
    expect(rozpoznajStatus('  NIEZAPŁACONE  ')).toBe('nieopłacona')
    expect(rozpoznajStatus('Nieopłacona')).toBe('nieopłacona')
    expect(rozpoznajStatus('ZAPŁACONE')).toBe('opłacona')
  })

  it('ignoruje podwójne i twarde spacje (NBSP z Excela) w środku', () => {
    expect(rozpoznajStatus('opłacona   częściowo')).toBe('opłacona częściowo')
    expect(rozpoznajStatus('opłacona częściowo')).toBe('opłacona częściowo')
  })

  it('nie dopasowuje po fragmencie tekstu', () => {
    expect(rozpoznajStatus('jest zapłacone')).toBeNull()
    expect(rozpoznajStatus('zapłacone w całości')).toBeNull()
    expect(rozpoznajStatus('zapłacone!')).toBeNull()
    expect(rozpoznajStatus('opłac')).toBeNull()
  })

  it('rozpoznaje warianty bez polskich znaków, wpisane na listę osobno', () => {
    expect(rozpoznajStatus('oplacona')).toBe('opłacona')
    expect(rozpoznajStatus('nieoplacona')).toBe('nieopłacona')
    expect(rozpoznajStatus('oplacona czesciowo')).toBe('opłacona częściowo')
    expect(rozpoznajStatus('zaplacone')).toBe('opłacona')
    expect(rozpoznajStatus('NIEZAPLACONE')).toBe('nieopłacona')
  })

  it('„niezaplacone” (bez polskich znaków) też NIE jest mylone z „zaplacone”', () => {
    expect(rozpoznajStatus('niezaplacone')).toBe('nieopłacona')
  })

  it('każde słowo z polskimi znakami ma swój odpowiednik bez nich, z tym samym statusem', () => {
    const bezZnakow = (s: string) => s.replace(/ł/g, 'l').normalize('NFD').replace(/[̀-ͯ]/g, '')
    for (const [slowo, status] of Object.entries(ZNANE_STATUSY)) {
      expect(ZNANE_STATUSY[bezZnakow(slowo)]).toBe(status)
    }
  })

  it('nie usuwa polskich znaków sam: mieszany zapis spoza listy jest nieznany', () => {
    expect(rozpoznajStatus('opłacona czesciowo')).toBeNull()
  })

  it('nieznane i puste słowa → null (do sprawdzenia przez człowieka)', () => {
    expect(rozpoznajStatus('w windykacji')).toBeNull()
    expect(rozpoznajStatus('')).toBeNull()
    expect(rozpoznajStatus('   ')).toBeNull()
    expect(rozpoznajStatus(null)).toBeNull()
    expect(rozpoznajStatus(undefined)).toBeNull()
  })

  it('nie myli słów z wbudowanymi nazwami obiektów JavaScript', () => {
    expect(rozpoznajStatus('constructor')).toBeNull()
    expect(rozpoznajStatus('tostring')).toBeNull()
  })
})
