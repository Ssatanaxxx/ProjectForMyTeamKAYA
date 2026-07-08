import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

// Страховка от белого экрана: любая ошибка рендера в рабочей зоне ловится здесь и
// показывается понятная карточка с действиями, а не пустая страница.
interface Props {
  children: ReactNode
  onLogout: () => void
}
interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('Перехвачена ошибка интерфейса:', error)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex min-h-svh items-center justify-center bg-bg px-5">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-7 text-center shadow-pop">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/12 text-danger">
            <AlertTriangle size={26} />
          </span>
          <h2 className="mt-5 font-display text-xl font-bold text-ink">Что-то пошло не так</h2>
          <p className="mt-2 text-sm text-muted">
            Произошла ошибка при отображении страницы. Обновите её — обычно это помогает.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="h-10 rounded-xl bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-brand-ink"
            >
              Обновить страницу
            </button>
            <button
              onClick={() => {
                this.props.onLogout()
                this.setState({ error: null })
              }}
              className="h-10 rounded-xl border border-border bg-surface px-5 text-sm font-medium text-muted transition-colors hover:text-ink hover:border-faint"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>
    )
  }
}
