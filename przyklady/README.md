# Pliki testowe

`faktury-test.csv` i `faktury-test.xlsx` zawierają te same 17 wierszy faktur. **Wszystkie dane są fikcyjne**: nazwy firm są wymyślone, NIP-y w numerach KSeF zaczynają się od zmyślonego prefiksu `999`, a adresy e-mail są wyłącznie w domenie `example.com`.

- Terminy płatności są dobrane względem **20.11.2026**. W testach to jest „dzisiaj”.
- CSV: separator `;`, przecinek dziesiętny, kodowanie UTF-8 z BOM, tak jak w polskim Excelu.
- XLSX: kwoty są zapisane jako liczby, a terminy jako prawdziwe daty Excela, czyli liczby w komórce.
- Pliki nie mają kolumny ugody. Ugodę zaznacza się w aplikacji (wiersz z „Hotel dla Psów Merdający Ogon”).

Nie edytuj plików ręcznie. Zmień listę w `scripts/generuj-przyklady.mjs` i uruchom `npm run przyklady`.
