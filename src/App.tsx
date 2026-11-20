import { useState } from 'react'

export const ZAKLADKI = [
  { id: 'wgraj', nazwa: 'Wgraj plik', opis: 'Tu wgrasz plik z fakturami.' },
  { id: 'faktury', nazwa: 'Faktury', opis: 'Tu zobaczysz listę wszystkich faktur.' },
  { id: 'do-wyslania', nazwa: 'Do wysłania dzisiaj', opis: 'Tu pojawią się przypomnienia do wysłania.' },
  { id: 'do-prawnika', nazwa: 'Do prawnika', opis: 'Tu pojawią się faktury do przekazania prawnikowi.' },
  { id: 'historia', nazwa: 'Historia', opis: 'Tu zobaczysz historię wgrań i wysłanych przypomnień.' },
] as const

type IdZakladki = (typeof ZAKLADKI)[number]['id']

export default function App() {
  const [aktywna, ustawAktywna] = useState<IdZakladki>('wgraj')
  const zakladka = ZAKLADKI.find((z) => z.id === aktywna)!

  return (
    <div className="aplikacja">
      <header className="naglowek">
        <h1>Przypomnienia o płatnościach</h1>
      </header>

      <nav className="zakladki" role="tablist" aria-label="Sekcje aplikacji">
        {ZAKLADKI.map((z) => (
          <button
            key={z.id}
            role="tab"
            aria-selected={z.id === aktywna}
            className={z.id === aktywna ? 'zakladka aktywna' : 'zakladka'}
            onClick={() => ustawAktywna(z.id)}
          >
            {z.nazwa}
          </button>
        ))}
      </nav>

      <main className="tresc" role="tabpanel">
        <h2>{zakladka.nazwa}</h2>
        <p>{zakladka.opis}</p>
        <p className="wkrotce">Ta część jest jeszcze w budowie.</p>
      </main>
    </div>
  )
}
