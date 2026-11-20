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
[DO UZUPEŁNIENIA]

## 3. Awarie
[DO UZUPEŁNIENIA]

## 4. Monitoring i powiadomienia
[DO UZUPEŁNIENIA]

## 5. Zależności i bezpieczeństwo
[DO UZUPEŁNIENIA]

## 6. Organizacja i zmiany
[DO UZUPEŁNIENIA]
