// Tworzy przyklady/faktury-test.csv i przyklady/faktury-test.xlsx z jednej listy wierszy.
// Uruchomienie: npm run przyklady
//
// WSZYSTKIE DANE SĄ FIKCYJNE: nazwy firm są wymyślone, NIP-y w numerach KSeF są
// zmyślone (prefiks 999), a adresy e-mail są wyłącznie w domenie example.com.
//
// Terminy płatności są dobrane względem DATY ODNIESIENIA 2026-11-20 („dzisiaj” w testach).

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as XLSX from 'xlsx'

const DZISIAJ = '2026-11-20'
const katalog = join(dirname(fileURLToPath(import.meta.url)), '..', 'przyklady')

const NAGLOWKI = ['Numer KSeF', 'Kontrahent', 'E-mail', 'Kwota brutto', 'Termin płatności', 'Status', 'Zapłacono', 'Uwagi']

/** Data przesunięta o `dni` względem DZISIAJ (ujemne = w przeszłości), jako RRRR-MM-DD. */
function dzienWzgledem(dni) {
  const [r, m, d] = DZISIAJ.split('-').map(Number)
  const data = new Date(Date.UTC(r, m - 1, d + dni))
  return data.toISOString().slice(0, 10)
}

/** Zmyślony numer KSeF w formacie NIP-RRRRMMDD-XXXXXX-XX (data wystawienia = termin − 14 dni). */
function ksef(nr, dniPoTerminie) {
  const nip = `999${String(nr).padStart(7, '0')}`
  const wystawienie = dzienWzgledem(-dniPoTerminie - 14).replaceAll('-', '')
  const hex = (0xa00000 + nr * 4099).toString(16).toUpperCase()
  const suma = ((nr * 37) % 256).toString(16).toUpperCase().padStart(2, '0')
  return `${nip}-${wystawienie}-${hex}-${suma}`
}

// dni = ile dni po terminie płatności względem 2026-11-20
// kwota / zaplacono: liczby; w CSV zapisane z przecinkiem dziesiętnym jak w polskim Excelu
const W = [
  { nr: 1,  firma: 'Kwiaciarnia Fioletowy Żuraw',     email: 'kwiaty.zuraw@example.com',      kwota: 850.00,  dni: 2,  status: 'nieopłacona',        zap: null,   uwagi: '' },
  { nr: 2,  firma: 'Piekarnia Złoty Kłos Testowa',    email: 'piekarnia.klos@example.com',    kwota: 1200.00, dni: 5,  status: 'nieopłacona',        zap: null,   uwagi: '' },
  { nr: 3,  firma: 'Piekarnia Złoty Kłos Testowa',    email: 'Piekarnia.Klos@Example.com',    kwota: 2340.50, dni: 16, status: 'Nieopłacona',        zap: null,   uwagi: '' },
  { nr: 4,  firma: 'Piekarnia Złoty Kłos Testowa',    email: 'piekarnia.klos@example.com',    kwota: 980.00,  dni: 35, status: 'nieopłacona',        zap: null,   uwagi: '' },
  { nr: 5,  firma: 'Studio Tańca Wirujący Jeż',       email: 'studio.jez@example.com',        kwota: 1750.00, dni: 20, status: 'nieopłacona',        zap: null,   uwagi: 'Nie dostał jeszcze żadnego przypomnienia' },
  { nr: 6,  firma: 'Warsztat Rowerowy Szybka Dętka',  email: 'serwis.detka@example.com',      kwota: 3000.00, dni: 10, status: 'opłacona częściowo', zap: 1000,   uwagi: 'Wpłata 1000 zł' },
  { nr: 7,  firma: 'Antykwariat Kurz i Papier',       email: '',                              kwota: 420.00,  dni: 7,  status: 'nieopłacona',        zap: null,   uwagi: '' },
  { nr: 8,  firma: 'Pralnia Mydlana Bańka',           email: 'pralnia.banka@example.com',     kwota: 315.20,  dni: 4,  status: 'nieopłacona',        zap: null,   uwagi: '' },
  { nr: 8,  firma: 'Pralnia Mydlana Bańka',           email: 'pralnia.banka@example.com',     kwota: 315.20,  dni: 4,  status: 'nieopłacona',        zap: null,   uwagi: '' },
  { nr: 9,  firma: 'Księgarnia Zielony Atrament',     email: 'atrament@example.com',          kwota: 1500.00, dni: 9,  status: 'nieopłacona',        zap: null,   uwagi: '' },
  { nr: 9,  firma: 'Księgarnia Zielony Atrament',     email: 'atrament@example.com',          kwota: 1550.00, dni: 9,  status: 'nieopłacona',        zap: null,   uwagi: '' },
  { nr: 10, firma: 'Cukiernia Lukrowy Rożek',         email: 'cukiernia.rozek@example.com',   kwota: 640.00,  dni: 14, status: 'opłacona',           zap: 700,    uwagi: '' },
  { nr: 11, firma: 'Szkółka Leśna Mchy i Porosty',    email: 'szkolka.mchy@example.com',      kwota: 2100.00, dni: 8,  status: 'zapłacone',          zap: 2100,   uwagi: '' },
  { nr: 12, firma: 'Lodziarnia Mroźny Pingwin',       email: 'lody.pingwin@example.com',      kwota: 560.75,  dni: 15, status: 'niezapłacone',       zap: null,   uwagi: '' },
  { nr: 13, firma: 'Pracownia Stolarska Wiórek',      email: 'stolarnia.wiorek@example.com',  kwota: 4200.00, dni: 8,  status: 'w windykacji',       zap: null,   uwagi: '' },
  { nr: 14, firma: 'Galeria Ramek Złota Krawędź',     email: 'ramki.krawedz@example.com',     kwota: 890.00,  dni: 11, status: 'nieopłacona',        zap: 890,    uwagi: '' },
  { nr: 15, firma: 'Hotel dla Psów Merdający Ogon',   email: 'hotel.ogon@example.com',        kwota: 5600.00, dni: 45, status: 'nieopłacona',        zap: null,   uwagi: 'Ugoda ratalna – zaznaczyć w aplikacji pole „Ugoda (raty)”' },
]

const wiersze = W.map((w) => ({
  ksef: ksef(w.nr, w.dni),
  firma: w.firma,
  email: w.email,
  kwota: w.kwota,
  termin: dzienWzgledem(-w.dni),
  status: w.status,
  zap: w.zap,
  uwagi: w.uwagi,
}))

mkdirSync(katalog, { recursive: true })

// --- CSV: separator „;”, przecinek dziesiętny, UTF-8 z BOM (tak otwiera go polski Excel) ---
const liczbaPL = (n) => (n === null ? '' : n.toFixed(2).replace('.', ','))
const pole = (t) => (/[;"\r\n]/.test(t) ? `"${t.replaceAll('"', '""')}"` : t)
const csv = [
  NAGLOWKI.join(';'),
  ...wiersze.map((w) =>
    [w.ksef, w.firma, w.email, liczbaPL(w.kwota), w.termin, w.status, liczbaPL(w.zap), w.uwagi].map(pole).join(';'),
  ),
].join('\r\n') + '\r\n'
writeFileSync(join(katalog, 'faktury-test.csv'), '﻿' + csv, 'utf8')

// --- XLSX: liczby jako liczby, terminy jako prawdziwe daty Excela (testuje „liczbowe daty Excela”) ---
const dataExcel = (iso) => {
  const [r, m, d] = iso.split('-').map(Number)
  return new Date(r, m - 1, d)
}
const aoa = [
  NAGLOWKI,
  ...wiersze.map((w) => [w.ksef, w.firma, w.email, w.kwota, dataExcel(w.termin), w.status, w.zap ?? '', w.uwagi]),
]
const arkusz = XLSX.utils.aoa_to_sheet(aoa, { cellDates: true, dateNF: 'yyyy-mm-dd' })
for (let i = 2; i <= aoa.length; i++) {
  arkusz[`E${i}`].z = 'yyyy-mm-dd'
  arkusz[`D${i}`].z = '#,##0.00'
  if (arkusz[`G${i}`] && arkusz[`G${i}`].t === 'n') arkusz[`G${i}`].z = '#,##0.00'
}
arkusz['!cols'] = [{ wch: 32 }, { wch: 32 }, { wch: 30 }, { wch: 13 }, { wch: 16 }, { wch: 19 }, { wch: 11 }, { wch: 55 }]
const skoroszyt = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(skoroszyt, arkusz, 'Faktury')
writeFileSync(join(katalog, 'faktury-test.xlsx'), XLSX.write(skoroszyt, { type: 'buffer', bookType: 'xlsx' }))

console.log(`Zapisano ${wiersze.length} wierszy do przyklady/faktury-test.csv i .xlsx (data odniesienia ${DZISIAJ}).`)
