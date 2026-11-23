# Pliki testowe

`faktury-test.csv` i `faktury-test.xlsx` zawierają te same 17 wierszy faktur. **Wszystkie dane są fikcyjne**: nazwy firm są wymyślone, NIP-y w numerach KSeF zaczynają się od zmyślonego prefiksu `999`, a adresy e-mail są wyłącznie w domenie `example.com`.

- Terminy płatności są dobrane względem **20.11.2026**. W testach to jest „dzisiaj”.
- CSV: separator `;`, przecinek dziesiętny, kodowanie UTF-8 z BOM, tak jak w polskim Excelu.
- XLSX: kwoty są zapisane jako liczby, a terminy jako prawdziwe daty Excela, czyli liczby w komórce.
- Pliki nie mają kolumny ugody. Ugodę zaznacza się w aplikacji (wiersz z „Hotel dla Psów Merdający Ogon”).

## Oczekiwany wynik wgrania

Liczymy w **fakturach** (po numerze KSeF), nie w wierszach. Plik ma 17 wierszy z danymi i 15 różnych numerów KSeF (dwa numery występują dwa razy): 10 + 1 + 4 = 15 faktur, a 15 + 2 powtórzone wiersze = 17 wierszy.

| Grupa | Faktur | Wiersze w Excelu (nagłówek = 1) |
|---|---|---|
| Poprawne | 10 | 2–7, 9 (powtórzony w 10), 14, 15, 18 |
| Do uzupełnienia | 1 | 8 – brak e-maila |
| Do sprawdzenia | 4 | 11 i 12 – ten sam numer, różne kwoty (jedna pozycja); 13 – nadpłata; 16 – nieznany status „w windykacji”; 17 – status „nieopłacona”, a zapłacono całość |
| Powtórzenie usunięte automatycznie | 1 | 10 – identyczny z wierszem 9 |

Jeśli po zmianie plików lub aplikacji wynik jest inny, najpierw ustal, dlaczego, a dopiero potem zmieniaj ten opis i test w `src/logika/import.test.ts`.

Nie edytuj plików ręcznie. Zmień listę w `scripts/generuj-przyklady.mjs` i uruchom `npm run przyklady`.
