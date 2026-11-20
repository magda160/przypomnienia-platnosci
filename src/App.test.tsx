import { render, screen, fireEvent } from '@testing-library/react'
import App, { ZAKLADKI } from './App'

describe('Szkielet aplikacji', () => {
  it('pokazuje tytuł aplikacji', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Przypomnienia o płatnościach')
  })

  it('pokazuje wszystkie zakładki', () => {
    render(<App />)
    expect(screen.getAllByRole('tab')).toHaveLength(ZAKLADKI.length)
  })

  it('po kliknięciu zakładki pokazuje jej treść', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('tab', { name: 'Do prawnika' }))
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Do prawnika')
    expect(screen.getByRole('tab', { name: 'Do prawnika' })).toHaveAttribute('aria-selected', 'true')
  })
})
