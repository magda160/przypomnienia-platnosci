import type { StatusFaktury } from '../typy'

/**
 * STAŁA LISTA ZNANYCH SŁÓW W KOLUMNIE „STATUS” — jedyne miejsce, gdzie ją zmieniamy.
 *
 * Klucz: słowo tak, jak może wystąpić w pliku, zapisane MAŁYMI literami,
 *        z pojedynczymi spacjami między wyrazami i z polskimi znakami.
 * Wartość: status, na który zamieniamy to słowo.
 *
 * Porównanie jest DOKŁADNE (całe słowo), nigdy po fragmencie tekstu —
 * dlatego „niezapłacone” nie zostanie pomylone z „zapłacone” (rozdz. 2.2).
 * Słowo spoza listy trafia do sprawdzenia przez człowieka.
 *
 * Aby dodać nowe słowo: dopisz jedną linię poniżej (małymi literami).
 */
export const ZNANE_STATUSY: Readonly<Record<string, StatusFaktury>> = {
  // --- nieopłacona ---
  'nieopłacona': 'nieopłacona',
  'nieopłacone': 'nieopłacona',
  'nieopłacony': 'nieopłacona',
  'niezapłacona': 'nieopłacona',
  'niezapłacone': 'nieopłacona',
  'niezapłacony': 'nieopłacona',

  // --- opłacona ---
  'opłacona': 'opłacona',
  'opłacone': 'opłacona',
  'opłacony': 'opłacona',
  'zapłacona': 'opłacona',
  'zapłacone': 'opłacona',
  'zapłacony': 'opłacona',

  // --- opłacona częściowo ---
  'opłacona częściowo': 'opłacona częściowo',
  'opłacone częściowo': 'opłacona częściowo',
  'częściowo opłacona': 'opłacona częściowo',
  'częściowo opłacone': 'opłacona częściowo',
  'zapłacona częściowo': 'opłacona częściowo',
  'zapłacone częściowo': 'opłacona częściowo',
  'częściowo zapłacona': 'opłacona częściowo',
  'częściowo zapłacone': 'opłacona częściowo',

  // ===== Te same słowa zapisane BEZ polskich znaków (osobne linie, nadal dokładne porównanie) =====

  // --- nieopłacona ---
  'nieoplacona': 'nieopłacona',
  'nieoplacone': 'nieopłacona',
  'nieoplacony': 'nieopłacona',
  'niezaplacona': 'nieopłacona',
  'niezaplacone': 'nieopłacona',
  'niezaplacony': 'nieopłacona',

  // --- opłacona ---
  'oplacona': 'opłacona',
  'oplacone': 'opłacona',
  'oplacony': 'opłacona',
  'zaplacona': 'opłacona',
  'zaplacone': 'opłacona',
  'zaplacony': 'opłacona',

  // --- opłacona częściowo ---
  'oplacona czesciowo': 'opłacona częściowo',
  'oplacone czesciowo': 'opłacona częściowo',
  'czesciowo oplacona': 'opłacona częściowo',
  'czesciowo oplacone': 'opłacona częściowo',
  'zaplacona czesciowo': 'opłacona częściowo',
  'zaplacone czesciowo': 'opłacona częściowo',
  'czesciowo zaplacona': 'opłacona częściowo',
  'czesciowo zaplacone': 'opłacona częściowo',
}

/**
 * Ujednolica zapis przed porównaniem:
 * - zamienia twarde spacje z Excela (NBSP) i tabulatory na zwykłe spacje,
 * - usuwa spacje z początku i końca, a kilka spacji w środku zamienia na jedną,
 * - zamienia litery na małe (z polskimi znakami),
 * - ujednolica zapis polskich znaków (NFC), żeby „ł” zawsze wyglądało tak samo.
 * NIE usuwa polskich znaków i NIE wycina fragmentów tekstu.
 */
export function ujednolicSlowo(tekst: string): string {
  return tekst
    .normalize('NFC')
    .replace(/[\s ]+/g, ' ')
    .trim()
    .toLocaleLowerCase('pl-PL')
}

/**
 * Zamienia słowo z kolumny „Status” na status aplikacji.
 * Zwraca null, jeśli słowa nie ma na liście ZNANE_STATUSY (wtedy wiersz idzie do sprawdzenia).
 */
export function rozpoznajStatus(tekst: string | null | undefined): StatusFaktury | null {
  if (tekst == null) return null
  const klucz = ujednolicSlowo(String(tekst))
  return Object.hasOwn(ZNANE_STATUSY, klucz) ? ZNANE_STATUSY[klucz] : null
}
