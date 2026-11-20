# Zgłoszenie: dział windykacji

## Problem
Dział ręcznie przegląda Excela z ok. 200 fakturami miesięcznie, szuka zaległych i pisze maile z przypomnieniami. Zajmuje to ok. 2 godziny dziennie, a czasem ktoś zostaje pominięty.

## Użytkownicy
Pracownicy działu windykacji (osoby nietechniczne, pracują w przeglądarce). Odpowiada kierowniczka działu.

## Dane faktury
Numer KSeF, nazwa klienta, e-mail klienta, kwota, termin płatności, status (nieopłacona / opłacona / opłacona częściowo), ugoda (tak/nie), uwagi.

## Zasady
- 3 dni po terminie: uprzejme przypomnienie.
- 14 dni po terminie: stanowcze wezwanie do zapłaty.
- 30 dni po terminie: nic nie wysyłamy, oznaczamy sprawę „do prawnika”.
- Klient z ugodą (spłata w ratach): nie dostaje żadnych przypomnień.
- Ugoda to osobne pole tak/nie, nie wolny tekst w uwagach (dziś wpisy w uwagach są niespójne i był przez to błąd).

## Po wysłaniu
Przy fakturze zapisuje się data i rodzaj przypomnienia, żeby nie wysłać tego samego dwa razy.

## Kryteria sukcesu
- Nikt nie jest pominięty.
- Nikt nie dostaje dwa razy tego samego przypomnienia.
- Klienci z ugodą nie dostają nic.
- Czas pracy działu spada z ok. 2 godzin do ok. 15 minut dziennie.
