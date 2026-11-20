# Dziennik zmian

Tu zapisujemy prostym językiem, co nowego potrafi aplikacja po każdym kroku.

## 2026-11-20

- **Krok 0** – Sprawdziliśmy, że na komputerze są zainstalowane narzędzia potrzebne do budowy aplikacji (Node.js 24 i npm 11). Można zaczynać.
- **Krok 1** – Powstał pierwszy, pusty wygląd aplikacji: strona „Przypomnienia o płatnościach” z pięcioma zakładkami (Wgraj plik, Faktury, Do wysłania dzisiaj, Do prawnika, Historia). Zakładki można przełączać, ale nic jeszcze w nich nie ma. Działa też automatyczne sprawdzanie aplikacji.
- **Krok 2** – Ustaliliśmy, jakie informacje aplikacja będzie przechowywać o fakturach, przypomnieniach, pominięciach i wgraniach plików. Powstały dwa pliki testowe (Excel i CSV) z 17 wymyślonymi fakturami, które sprawdzają nietypowe sytuacje: brak e-maila, powtórzoną fakturę, nadpłatę, dziwne słowa w statusie, kilka faktur jednego klienta i klienta z ugodą.
