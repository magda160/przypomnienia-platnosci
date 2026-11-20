# Dokument wdrożeniowy: Przypomnienia o płatnościach

| Pole | Wartość |
|---|---|
| Nazwa automatyzacji | Przypomnienia o płatnościach |
| Firma i dział | Firma przykładowa (projekt portfolio), dział windykacji |
| Autor dokumentu | Magdalena Socha |
| Data i wersja | 20.11.2026, wersja 0.1 |
| Status | Szkic |

## 1. Opis rozwiązania

### 1.1 Cel automatyzacji
Dział windykacji traci ok. 2 godziny dziennie na ręczne szukanie zaległych faktur w Excelu i pisanie przypomnień. Przy pracy ręcznej zdarzają się pominięte faktury, podwójne przypomnienia i maile do klientów z ugodą, przez co firma straciła klienta. Po wdrożeniu aplikacja sama znajdzie zaległe faktury i przygotuje szkice przypomnień, a pracownik tylko je sprawdzi i wyśle, w ok. 15 minut dziennie.

### 1.2 Proces krok po kroku
1. Raz dziennie pracownik wgrywa do aplikacji plik Excel z fakturami (eksport z systemu księgowego) albo dodaje fakturę ręcznie.
2. Aplikacja sprawdza dane i pokazuje wiersze z brakami do poprawy.
3. Przy klientach z ugodą pracownik zaznacza pole „Ugoda (raty)”.
4. Aplikacja wybiera faktury po terminie ze statusem „nieopłacona” lub „opłacona częściowo”. Pomija klientów z zaznaczonym polem „Ugoda (raty)” niezależnie od statusu oraz faktury, które dostały już ten rodzaj przypomnienia. Przy częściowej płatności przypomnienie dotyczy pozostałej kwoty.
5. Aplikacja dobiera rodzaj przypomnienia: 3+ dni po terminie uprzejme, 14+ dni stanowcze wezwanie, 30+ dni oznaczenie „do prawnika” (bez maila).
6. Aplikacja przygotowuje szkice maili.
7. Pracownik czyta każdy szkic i klika „Wyślij” albo „Pomiń”. Mail wychodzi z firmowej skrzynki działu.
8. Po wysłaniu aplikacja zapisuje datę, rodzaj przypomnienia i kto wysłał.
9. Gdy klient zapłaci, pracownik zmienia status na „opłacona”.

### 1.3 Użytkownicy i ilość danych
Kierowniczka działu (właścicielka procesu) i 2 pracowników. Zwykle ok. 50 faktur tygodniowo (ok. 200 miesięcznie), w szczycie (koniec miesiąca i kwartału) ok. 80 tygodniowo. Ok. co czwarta faktura jest płacona po terminie, czyli ok. 50 przypomnień miesięcznie.

### 1.4 Mierniki sukcesu
| Miernik | Stan przed | Cel po wdrożeniu |
|---|---|---|
| Czas pracy działu dziennie | ok. 2 h | ok. 15 min |
| Faktury pominięte lub zauważone z opóźnieniem / mies. | 3–5 | 0 |
| Podwójne przypomnienia / mies. | ok. 3–4 | 0 |
| Przypomnienia do klientów z ugodą | 1 na kwartał | 0 |
| Koszt pracy działu na przypomnienia / mies.* | ok. 2 100 zł | ok. 260 zł |

\* Założenie: godzina pracy pracownika kosztuje firmę ok. 50 zł [DO UZUPEŁNIENIA: potwierdzić z działem].

Szacowany ROI w pierwszym roku: ok. 590% (oszczędność ok. 22 000 zł, koszt budowy i utrzymania ok. 3 200 zł). Zwrot kosztów budowy po ok. 5 tygodniach.

## 2. Dane i testy

### 2.1 Dane wejściowe i ich sprawdzanie
| Pole | Wymagane? | Jak sprawdzamy i ujednolicamy |
|---|---|---|
| Numer KSeF | tak | niepusty, nie powtarza się w pliku |
| Nazwa klienta | tak | niepusta |
| E-mail klienta | tak | jedno „@” i kropka po nim, bez spacji; zamiana na małe litery |
| Kwota | tak | liczba większa od 0; przecinek zamieniany na kropkę |
| Kwota zapłacona | nie (puste = 0) | liczba od 0 do wartości kwoty faktury |
| Termin płatności | tak | poprawna data; zapis w formacie RRRR-MM-DD |
| Status | tak | jedna z wartości: nieopłacona / opłacona / opłacona częściowo; usuwanie spacji, ujednolicenie wielkości liter |
| Ugoda (raty) | tak (domyślnie „nie”) | tylko tak/nie (pole do zaznaczenia) |
| Uwagi | nie | dowolny tekst; aplikacja nie bierze go pod uwagę przy decyzjach |

Sprawdzenie spójności: status musi pasować do kwot. Jeśli się nie zgadzają (np. kwota zapłacona równa kwocie faktury, a status „nieopłacona”), wiersz jest oznaczany do sprawdzenia przez człowieka.

### 2.2 Nietypowe przypadki
| Sytuacja | Decyzja | Uzasadnienie |
|---|---|---|
| Brak e-maila klienta | przekazać człowiekowi | wiersz trafia na listę „do uzupełnienia”, reszta pliku wgrywa się normalnie |
| Ta sama faktura (numer KSeF) dwa razy w pliku | identyczne wiersze: poprawić automatycznie (zostaje jeden); różne: przekazać człowiekowi | nie wiadomo, który wiersz jest prawdziwy |
| Kwota zapłacona większa niż kwota faktury | przekazać człowiekowi | może to być błąd wpisu albo nadpłata do zwrotu |
| Nieznane słowo w statusie (np. „zapłacone”) | poprawić automatycznie tylko według stałej listy znanych słów; nieznane: przekazać człowiekowi | szukanie fragmentu tekstu jest niebezpieczne („niezapłacone” zawiera „zapłacone”) |
| Klient ma kilka zaległych faktur | jeden zbiorczy mail z listą faktur, ton według najstarszej zaległości; faktury 30+ dni osobno „do prawnika” | klient nie dostaje kilku maili naraz |
| Plik z danymi nie jest z dzisiaj | przepuścić z oznaczeniem | na ekranie widać „Dane z dnia: …” i ostrzeżenie; pracownik sprawdza wpłaty przed wysłaniem |
| Klient z ugodą nie zapłacił raty | poza zakresem wersji 1 | raty z ugód prowadzi ręcznie opiekun ugód; do rozważenia w wersji 2 |

### 2.3 Scenariusze testowe
[DO UZUPEŁNIENIA]

## 3. Awarie
[DO UZUPEŁNIENIA]

## 4. Monitoring i powiadomienia
[DO UZUPEŁNIENIA]

## 5. Zależności i bezpieczeństwo
[DO UZUPEŁNIENIA]

## 6. Organizacja i zmiany
[DO UZUPEŁNIENIA]
