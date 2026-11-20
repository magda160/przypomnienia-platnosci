# Dziennik zmian

Tu zapisujemy prostym językiem, co nowego potrafi aplikacja po każdym kroku.

## 2026-11-20

- **Krok 0** – Sprawdziliśmy, że na komputerze są zainstalowane narzędzia potrzebne do budowy aplikacji (Node.js 24 i npm 11). Można zaczynać.
- **Krok 1** – Powstał pierwszy, pusty wygląd aplikacji: strona „Przypomnienia o płatnościach” z pięcioma zakładkami (Wgraj plik, Faktury, Do wysłania dzisiaj, Do prawnika, Historia). Zakładki można przełączać, ale nic jeszcze w nich nie ma. Działa też automatyczne sprawdzanie aplikacji.
- **Krok 2** – Ustaliliśmy, jakie informacje aplikacja będzie przechowywać o fakturach, przypomnieniach, pominięciach i wgraniach plików. Powstały dwa pliki testowe (Excel i CSV) z 17 wymyślonymi fakturami, które sprawdzają nietypowe sytuacje: brak e-maila, powtórzoną fakturę, nadpłatę, dziwne słowa w statusie, kilka faktur jednego klienta i klienta z ugodą.
- **Krok 3** – Aplikacja umie już (na razie „pod spodem”, bez ekranu) przeczytać nagłówki kolumn w pliku – także zapisane wielkimi literami albo bez polskich znaków – i powiedzieć, której kolumny brakuje. Sprawdza każdy wiersz według zasad z dokumentu wdrożeniowego: braki, błędny e-mail, kwotę, datę, status i to, czy status zgadza się z kwotami. Rozpoznaje statusy tylko ze stałej listy znanych słów (40 słów, z polskimi znakami i bez), porównując całe słowo – dlatego „niezapłacone” nigdy nie zostanie wzięte za „zapłacone”. Każdy problem ma komunikat, co trzeba poprawić.
- **Krok 3 – ustalenia** – Dział potwierdził cztery zasady sprawdzania danych (kiedy wiersz jest „do uzupełnienia”, a kiedy „do sprawdzenia”, faktury opłacone bez kwoty zapłaconej, zapis dat i zapis kwot). Zapisaliśmy je w dokumencie wdrożeniowym, w punkcie 2.1.
