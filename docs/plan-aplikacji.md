# Plan: aplikacja „Przypomnienia o płatnościach” (wersja 1, dane w przeglądarce)

> Status: plan zaktualizowany o odpowiedzi działu. **Budowy nie zaczynamy, dopóki nie padnie wyraźne „start”.**

## Kontekst
Dział windykacji (kierowniczka + 2 osoby, nietechniczne) codziennie ręcznie przegląda Excela z ok. 200 fakturami/mies. i pisze przypomnienia. Zajmuje to ok. 2 h dziennie. Zdarzają się pominięcia, podwójne maile i maile do klientów z ugodą. Wymagania są w `docs/zgloszenie.md` i `docs/dokument-wdrozeniowy.md` (rozdz. 1–2.2). Repozytorium zawiera na razie tylko dokumentację, więc aplikację budujemy od zera.

Cel wersji 1: pracownik wgrywa plik, aplikacja sprawdza dane, wybiera zaległe faktury, przygotowuje szkice maili, a pracownik klika „Wyślij” (otwiera się Outlook przez `mailto:`) albo „Pomiń” z powodem. Aplikacja zapisuje datę, rodzaj przypomnienia i to, kto wysłał lub pominął.

## Ustalenia z działem
| # | Temat | Decyzja |
|---|---|---|
| 1 | Kolumny eksportu | Numer KSeF, Kontrahent, E-mail, Kwota brutto, Termin płatności, Status, Zapłacono, Uwagi. Kolumny ugody nie ma, zaznacza się ją w aplikacji. |
| 2 | Poczta | Outlook, firmowe konto działu jest domyślne. Wystarczy `mailto`. |
| 3 | Potwierdzenie | Po „Wyślij” aplikacja pyta „Czy mail został wysłany?”. Zapis następuje dopiero po „Tak”. |
| 4 | Kto | Wybór imienia z listy, bez logowania. |
| 5 | Komputery | Każdy ma swój komputer. W wersji 1 wysyłką zajmuje się **jedna osoba**. Aplikacja wyświetli o tym przypomnienie. |
| 6 | Mail zbiorczy | Zawiera **tylko faktury, którym należy się nowe przypomnienie**. Ten sam klient = **ten sam e-mail**. |
| 7 | Pominięty próg | Wysyłamy według aktualnego progu. Stanowcze wezwanie **bez słowa „ponownie”**, jeśli to pierwszy mail do tej faktury. |
| 8 | Dane z dnia | Aplikacja podpowiada datę modyfikacji pliku, a pracownik ją **potwierdza lub poprawia** przed zapisem. Data i godzina wgrania trafiają osobno do historii wgrań. |
| 9 | Szablony | Przygotowuję je sam. Numer konta i dane firmy wpisuję jako `[DO UZUPEŁNIENIA]`. |
| 10 | Ugoda | Wyłącza wszystko, także listę do prawnika. |
| + | Pomiń | Pracownik musi wybrać powód z listy: „klient zapłacił”, „klient dzwonił”, „inny” (przy „inny” wpisuje krótki opis). Aplikacja zapisuje powód, datę i kto pominął. |
| + | Proces | Po każdym kroku: wpis w `CHANGELOG.md` prostym językiem + commit. |

### Mapowanie kolumn pliku → pola aplikacji
| Nagłówek w pliku | Pole w aplikacji | Uwagi |
|---|---|---|
| Numer KSeF | `numerKsef` | wymagane, unikalne |
| Kontrahent | `nazwaKlienta` | wymagane |
| E-mail | `email` | wymagane, małe litery; klucz grupowania klienta |
| Kwota brutto | `kwota` | wymagane, > 0, przecinek → kropka |
| Termin płatności | `terminPlatnosci` | wymagane, RRRR-MM-DD (także liczbowe daty Excela) |
| Status | `status` | stała lista znanych słów |
| Zapłacono | `kwotaZaplacona` | puste = 0, od 0 do kwoty |
| Uwagi | `uwagi` | nie wpływa na decyzje |
| (brak) | `ugoda` | domyślnie „nie”, ustawiane w aplikacji, przy ponownym wgraniu zachowywane |

Nagłówki rozpoznajemy bez względu na wielkość liter, spacje na brzegach i znaki diakrytyczne („E-mail” = „email”). Jeśli brakuje wymaganej kolumny, pojawia się czytelny komunikat, które kolumny są potrzebne.

## Założenia techniczne
- **Vite + React + TypeScript**, testy logiki w **Vitest**.
- **Odczyt plików:** SheetJS (`xlsx`) obsługuje .xlsx, .xls i .csv. Instalujemy go z oficjalnego źródła `cdn.sheetjs.com`, bo wersja w rejestrze npm jest przestarzała.
- **Zapis danych:** `localStorage` schowany za interfejsem `MagazynDanych` (`wczytaj` / `zapisz`). Później podmienimy tylko implementację na API z bazą danych.
- **Logika jako czyste funkcje** w `src/logika/`, bez Reacta. Datę „dzisiaj” podajemy jako parametr, żeby dało się ją testować.
- **Interfejs:** po polsku, duże przyciski, kilka zakładek, przy każdym problemie komunikat, co trzeba zrobić.

Planowana struktura:
```
CHANGELOG.md
src/
  typy.ts                 Faktura, Przypomnienie, Pominiecie, Wgranie…
  logika/kolumny.ts       mapowanie nagłówków eksportu → pola
  logika/walidacja.ts     reguły z tabeli 2.1 + spójność status/kwoty
  logika/import.ts        wiersze → faktury + listy problemów (2.2) + scalanie
  logika/reguly.ts        które faktury i jaki rodzaj przypomnienia
  logika/grupowanie.ts    jeden mail zbiorczy na adres e-mail
  logika/szablony.ts      treść maili + link mailto
  magazyn/localStorage.ts implementacja MagazynDanych
  ekrany/                 Wgraj, Faktury, DoWyslania, DoPrawnika, Historia
przyklady/faktury-test.csv i .xlsx  fikcyjne dane z nagłówkami jak w eksporcie
```

## Rytuał po każdym kroku
1. Sprawdzenie z punktu „✔” (testy i/lub ręcznie).
2. Wpis w `CHANGELOG.md` pod datą, np. „Krok 5 – Można wgrać plik z fakturami i zobaczyć, które wiersze trzeba poprawić.”, prostym językiem, bez nazw technicznych.
3. Commit z opisem kroku (np. `Krok 5: ekran wgrywania pliku`).

## Kroki

**Krok 0. Sprawdzenie środowiska**
Sprawdzenie, czy są zainstalowane Node.js i npm (`node -v`, `npm -v`). Potrzebna jest aktualna wersja LTS (20.19+ lub 22+). Jeśli Node.js nie ma albo wersja jest za stara, podam instrukcję instalacji ze strony nodejs.org i poczekam. Tworzę `CHANGELOG.md` z pierwszym wpisem.
✔ Sprawdzenie: oba polecenia zwracają numer wersji.

**Krok 1. Szkielet projektu**
Vite + React + TS, Vitest, `.gitignore` (m.in. `node_modules`), pusta strona „Przypomnienia o płatnościach” z zakładkami.
✔ Sprawdzenie: `npm run dev` pokazuje stronę, `npm test` przechodzi.

**Krok 2. Typy danych i pliki testowe**
Typy: `Faktura` (pola z mapowania + `historiaPrzypomnien[]`, `historiaPominiec[]`, `doPrawnika`), `Przypomnienie` (rodzaj, data, kto), `Pominiecie` (powód, opis, data, kto), `Wgranie` (nazwa pliku, dane z dnia, data i godzina wgrania, kto, liczby wierszy). Pliki `przyklady/faktury-test.csv` i `.xlsx` z nagłówkami jak w eksporcie i ok. 15 fikcyjnymi wierszami pokrywającymi przypadki z 2.2: brak e-maila, duplikat identyczny i różny, nadpłata, status „zapłacone”, dwie faktury z tym samym e-mailem i różnymi progami, faktura od razu 20 dni po terminie, ugoda 30+ dni.
✔ Sprawdzenie: `tsc` bez błędów, plik otwiera się w Excelu.

**Krok 3. Mapowanie kolumn i walidacja (logika + testy)**
`kolumny.ts`: tabela mapowania powyżej. `walidacja.ts`: reguły z 2.1, status według **stałej listy** (bez szukania fragmentu tekstu), kontrola spójności statusu z kwotami.
✔ Sprawdzenie: testy dla każdego wiersza tabeli 2.1, „niezapłacone” ≠ „zapłacone”, rozpoznanie nagłówków w różnych zapisach, komunikat o brakującej kolumnie.

**Krok 4. Import pliku (logika + testy)**
`import.ts`: duplikaty KSeF według 2.2, podział na **poprawne / do uzupełnienia / do sprawdzenia**.
✔ Sprawdzenie: test na pliku testowym daje oczekiwane liczby w każdej grupie.

**Krok 5. Ekran „Wgraj plik” i wybór osoby**
„Kim jesteś?” (lista imion, zapamiętana w przeglądarce, widoczna w nagłówku). Wybór lub przeciągnięcie pliku → podsumowanie z tabelami problemów → pole **„Dane z dnia”** podpowiedziane z daty modyfikacji pliku, z wymaganym potwierdzeniem lub poprawą → „Zapisz”. Tu jeszcze bez zapisywania na stałe.
✔ Sprawdzenie: wgrać CSV i XLSX, liczby zgadzają się z krokiem 4, bez potwierdzenia daty nie da się przejść dalej.

**Krok 6. Zapis w przeglądarce, scalanie, historia wgrań, lista faktur**
`MagazynDanych` + localStorage. Ponowne wgranie **scala dane po numerze KSeF**: aktualizuje dane z pliku, ale **zachowuje** ugodę, historię przypomnień, pominięć i znacznik „do prawnika”. Każde wgranie trafia do **historii wgrań** (data i godzina wgrania osobno od „Dane z dnia”, plik, kto, liczby). Ekran „Faktury”: tabela z wyszukiwaniem i filtrami. Na górze „Dane z dnia: …”, a jeśli nie są z dzisiaj, żółte ostrzeżenie „Sprawdź wpłaty przed wysłaniem”. Kopia zapasowa: pobierz / wczytaj JSON.
✔ Sprawdzenie: po odświeżeniu dane zostają, drugie wgranie nie dubluje faktur i nie kasuje ugody, historia wgrań pokazuje oba wgrania, kopia zapasowa daje się odtworzyć.

**Krok 7. Edycja i ręczne dodawanie faktury**
Formularz faktury z tą samą walidacją: pole do zaznaczenia „Ugoda (raty)”, status, kwota zapłacona, uzupełnianie braków. Przycisk „Dodaj fakturę ręcznie”. Szczegóły faktury pokazują historię przypomnień i pominięć.
✔ Sprawdzenie: poprawiony wiersz przechodzi do poprawnych, ugoda zostaje po odświeżeniu.

**Krok 8. Reguły przypomnień (logika + testy)**
`wybierzPrzypomnienia(faktury, dzisiaj)`: tylko statusy nieopłacona / opłacona częściowo; **ugoda wyklucza wszystko, także „do prawnika”**; pomija faktury do sprawdzenia; 3+ dni → uprzejme, 14+ → stanowcze, 30+ → do prawnika (bez maila); rodzaj według **aktualnego progu**; pomija rodzaj, który faktura już dostała; przy częściowej płatności pozostała kwota. Dla każdej faktury informacja, czy to **pierwszy mail** (brak wcześniejszych przypomnień).
✔ Sprawdzenie: testy progów (2/3, 13/14, 29/30), ugody (także 30+), powtórzeń, częściowej płatności, faktury od razu 20 dni po terminie (od razu stanowcze, oznaczone jako pierwszy mail).

**Krok 9. Grupowanie i szablony maili (logika + testy)**
Grupowanie po **e-mailu**. Mail zawiera **tylko faktury, którym należy się nowe przypomnienie**, a ton ustala najstarsza z nich. Faktury 30+ dni idą osobno na listę do prawnika. Szablony:
- uprzejme przypomnienie,
- stanowcze wezwanie w dwóch wariantach: **po wcześniejszym przypomnieniu** („ponownie wzywamy…”) i **jako pierwszy mail** (bez słowa „ponownie” i bez nawiązań do wcześniejszych wiadomości). Wariant „pierwszy” wybieramy, jeśli żadna faktura w mailu nie dostała wcześniej przypomnienia.

Numer konta, dane firmy i podpis jako `[DO UZUPEŁNIENIA]` w jednym pliku konfiguracyjnym. Link `mailto:` z kodowaniem polskich znaków. Przy zbyt długiej treści dodatkowy przycisk „Kopiuj treść”.
✔ Sprawdzenie: testy, w tym „wariant pierwszy nie zawiera słowa *ponownie*” i „mail nie zawiera faktur już przypomnianych”. Ręcznie: link otwiera Outlook z poprawną treścią i polskimi znakami.

**Krok 10. Ekran „Do wysłania dzisiaj”**
Na górze komunikat: „Wysyłką zajmuje się jedna osoba”. Karty ze szkicami (odbiorca, faktury, treść), licznik „Zostało: N”.
- **„Wyślij”** otwiera Outlook, a aplikacja pyta „Czy mail został wysłany?”. Dopiero „Tak” zapisuje datę, rodzaj i osobę przy każdej fakturze z maila.
- **„Pomiń”** otwiera okno z **obowiązkowym** wyborem powodu: „klient zapłacił” / „klient dzwonił” / „inny” (z polem opisu). Zapisuje powód, datę i kto pominął przy każdej fakturze z karty. Karta znika na dziś i wraca następnego dnia, jeśli faktura nadal jest zaległa. Przy „klient zapłacił” aplikacja podpowiada zmianę statusu.
✔ Sprawdzenie: po wysłaniu karta nie wraca ani po odświeżeniu, ani po ponownym wgraniu. Bez wybrania powodu „Pomiń” nie działa. Powód jest widoczny w historii faktury.

**Krok 11. Lista „Do prawnika”**
Faktury 30+ dni bez ugody: „Oznacz jako przekazane do prawnika” (data + kto), możliwość wydruku lub skopiowania listy.
✔ Sprawdzenie: faktura 30+ dni z ugodą **nie** pojawia się na liście, pozostałe 30+ pojawiają się tylko tutaj.

**Krok 12. Dopracowanie i scenariusz całego dnia**
Instrukcja „Jak zacząć”, komunikaty pustych ekranów, czytelność. Przejście całego dnia pracy na pliku testowym. Powstają przy tym propozycje scenariuszy do rozdziału 2.3 dokumentu wdrożeniowego.
✔ Sprawdzenie: osoba nietechniczna przechodzi proces bez pomocy.

## Weryfikacja całości
- `npm test`: mapowanie, walidacja, import, reguły, grupowanie, szablony (brak pominięć, brak podwójnych maili, zero maili i zero „do prawnika” przy ugodzie, brak „ponownie” w pierwszym mailu).
- Ręczny przebieg na `przyklady/faktury-test.*` z różnymi datami „dzisiaj”.
- Sprawdzenie `mailto` w Outlooku działu.
- `CHANGELOG.md` i historia commitów: po jednym wpisie i commicie na krok.

## Otwarte drobiazgi (nie blokują startu)
- Dokładna lista imion do wyboru „Kim jesteś?”. Na razie wpiszę 3 przykładowe, do podmiany w konfiguracji.
- Treść podpisu, numer konta i dane firmy, które dział uzupełni w `[DO UZUPEŁNIENIA]`.
