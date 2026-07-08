import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  KeyRound,
  LineChart,
  ShieldCheck,
  Sparkles,
  UserCog,
  Wallet,
} from 'lucide-react'
import { Logo } from '../components/Logo'
import { ThemeToggle } from '../components/ThemeToggle'
import { Button, Card, CardBody, Field, Input } from '../components/ui'
import { useToast } from '../components/Toast'
import { repo } from '../lib/repo'
import { setSession, type Session } from '../lib/session'
import type { Company, Role } from '../lib/types'

type Step = 'landing' | 'create' | 'join' | 'role' | 'register'

export function AuthFlow({ onDone }: { onDone: (s: Session) => void }) {
  const [step, setStep] = useState<Step>('landing')
  const [company, setCompany] = useState<Company | null>(null)
  const [role, setRole] = useState<Role>('economist')

  return (
    <div className="relative min-h-svh overflow-hidden bg-bg">
      <BackdropGlow />
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-5 pb-16">
        <AnimatePresence mode="wait">
          {step === 'landing' && (
            <StepShell key="landing">
              <Landing onCreate={() => setStep('create')} onJoin={() => setStep('join')} />
            </StepShell>
          )}

          {step === 'create' && (
            <StepShell key="create">
              <CreateCompany
                onBack={() => setStep('landing')}
                onCreated={(c) => {
                  setCompany(c)
                  setStep('role')
                }}
              />
            </StepShell>
          )}

          {step === 'join' && (
            <StepShell key="join">
              <JoinCompany
                onBack={() => setStep('landing')}
                onJoined={(c) => {
                  setCompany(c)
                  setStep('role')
                }}
              />
            </StepShell>
          )}

          {step === 'role' && company && (
            <StepShell key="role">
              <RoleSelect
                company={company}
                onBack={() => setStep('landing')}
                onPick={(r) => {
                  setRole(r)
                  setStep('register')
                }}
              />
            </StepShell>
          )}

          {step === 'register' && company && (
            <StepShell key="register">
              <Register company={company} role={role} onBack={() => setStep('role')} onDone={onDone} />
            </StepShell>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

/* ------------------------- анимированная обёртка шага ------------------------- */

function StepShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

function BackdropGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-40 -top-40 h-[440px] w-[440px] rounded-full bg-brand/20 blur-[120px]" />
      <div className="absolute -right-40 top-20 h-[380px] w-[380px] rounded-full bg-brand/10 blur-[120px]" />
    </div>
  )
}

/* -------------------------------- Лендинг -------------------------------- */

function Landing({ onCreate, onJoin }: { onCreate: () => void; onJoin: () => void }) {
  return (
    <div className="grid items-center gap-12 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:pt-16">
      <div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-[13px] text-muted shadow-sm"
        >
          <Sparkles size={14} className="text-brand" />
          Планирование бюджета для экономистов
        </motion.div>

        <h1 className="font-display text-[42px] font-extrabold leading-[1.05] tracking-tight text-ink sm:text-[54px]">
          Бюджет компании —<br />
          <span className="text-brand">под контролем</span>, а не в таблицах
        </h1>

        <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted">
          Budgetly собирает заявки департаментов в одном месте, сам распределяет лимиты и
          проверяет каждую статью расходов. Экономист видит отклонения сразу и решает: одобрить
          или вернуть на доработку.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" onClick={onCreate}>
            Создать компанию
            <ArrowRight size={18} />
          </Button>
          <Button size="lg" variant="secondary" onClick={onJoin}>
            Войти по коду
          </Button>
        </div>

        <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-[13px] text-muted">
          <Feature icon={<Wallet size={15} />} text="Автолимиты по департаментам" />
          <Feature icon={<ShieldCheck size={15} />} text="Автоконтроль расходов" />
          <Feature icon={<LineChart size={15} />} text="Формулы и графики" />
        </div>
      </div>

      <HeroPanel />
    </div>
  )
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-brand">{icon}</span>
      {text}
    </span>
  )
}

// «Как это работает» — три шага продукта. Никаких выдуманных сумм: экран честно
// объясняет процесс. Единственная витринная анимация на входе — появление шагов.
const STEPS = [
  {
    icon: <Wallet size={20} />,
    title: 'Экономист задаёт бюджет',
    text: 'Общий бюджет и период. Система сама распределяет автолимиты по департаментам.',
  },
  {
    icon: <Building2 size={20} />,
    title: 'Департаменты подают заявки',
    text: 'Каждая статья: количество, цена и обоснование, зачем она нужна компании.',
  },
  {
    icon: <ShieldCheck size={20} />,
    title: 'Автоконтроль и решение',
    text: 'Система подсвечивает превышения и считает формулы. Экономист одобряет или возвращает.',
  },
]

function HeroPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="shadow-pop">
        <CardBody>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-faint">
            Как это работает
          </p>
          {STEPS.map((s, i) => (
            <motion.div
              key={i}
              className="flex gap-4"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex flex-col items-center">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
                  {s.icon}
                </span>
                {i < STEPS.length - 1 && <span className="my-1 w-px flex-1 bg-border" />}
              </div>
              <div className={i < STEPS.length - 1 ? 'pb-5' : ''}>
                <div className="flex items-center gap-2">
                  <span className="nums text-xs font-bold text-brand">0{i + 1}</span>
                  <h3 className="font-display text-[15px] font-bold text-ink">{s.title}</h3>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">{s.text}</p>
              </div>
            </motion.div>
          ))}
        </CardBody>
      </Card>
    </motion.div>
  )
}

/* ----------------------------- Создать компанию ----------------------------- */

function AuthCard({
  title,
  subtitle,
  onBack,
  children,
}: {
  title: string
  subtitle: string
  onBack: () => void
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto max-w-md pt-6 lg:pt-14">
      <button
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={16} /> Назад
      </button>
      <Card className="shadow-pop">
        <CardBody className="space-y-5">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
          </div>
          {children}
        </CardBody>
      </Card>
    </div>
  )
}

function CreateCompany({ onBack, onCreated }: { onBack: () => void; onCreated: (c: Company) => void }) {
  const { push } = useToast()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !code.trim()) return
    setBusy(true)
    try {
      const company = await repo.createCompany({ name: name.trim(), access_code: code.trim() })
      push({ kind: 'success', title: 'Компания создана', body: `Код доступа: ${company.access_code}` })
      onCreated(company)
    } catch (err) {
      push({ kind: 'warning', title: 'Не удалось создать', body: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard
      title="Создание компании"
      subtitle="Название и код доступа. По коду в компанию войдут экономист и руководители департаментов."
      onBack={onBack}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Название компании">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Напр. АО «Астана Инвест»" autoFocus />
        </Field>
        <Field label="Код доступа" hint="Придумайте секретный код — это ключ к вашей компании.">
          <div className="relative">
            <KeyRound size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="astana-2026" className="pl-9" />
          </div>
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          Продолжить
          <ArrowRight size={18} />
        </Button>
      </form>
    </AuthCard>
  )
}

function JoinCompany({ onBack, onJoined }: { onBack: () => void; onJoined: (c: Company) => void }) {
  const { push } = useToast()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setBusy(true)
    try {
      const company = await repo.getCompanyByCode(code.trim())
      if (!company) {
        push({ kind: 'warning', title: 'Компания не найдена', body: 'Проверьте код доступа.' })
        return
      }
      onJoined(company)
    } catch (err) {
      push({ kind: 'warning', title: 'Ошибка входа', body: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard title="Вход по коду" subtitle="Введите код доступа вашей компании." onBack={onBack}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Код доступа">
          <div className="relative">
            <KeyRound size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="astana-2026" className="pl-9" autoFocus />
          </div>
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          Войти
          <ArrowRight size={18} />
        </Button>
      </form>
    </AuthCard>
  )
}

/* ------------------------------- Выбор роли ------------------------------- */

function RoleSelect({
  company,
  onBack,
  onPick,
}: {
  company: Company
  onBack: () => void
  onPick: (r: Role) => void
}) {
  return (
    <div className="mx-auto max-w-2xl pt-6 lg:pt-12">
      <button
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft size={16} /> Назад
      </button>
      <div className="mb-7 text-center">
        <p className="text-sm text-muted">Компания «{company.name}»</p>
        <h2 className="mt-1 font-display text-2xl font-bold text-ink">Кто вы в этой компании?</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <RoleCard
          icon={<UserCog size={22} />}
          title="Экономист"
          text="Задаёте бюджет, распределяете лимиты, проверяете и утверждаете заявки департаментов."
          onClick={() => onPick('economist')}
        />
        <RoleCard
          icon={<Building2 size={22} />}
          title="Руководитель департамента"
          text="Формируете заявку на бюджет департамента: статьи расходов, суммы и обоснования."
          onClick={() => onPick('department_head')}
        />
      </div>
    </div>
  )
}

function RoleCard({
  icon,
  title,
  text,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  text: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-2xl border border-border bg-surface p-6 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-brand/50 hover:shadow-pop"
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand-ink transition-colors group-hover:bg-brand group-hover:text-white">
        {icon}
      </span>
      <h3 className="mt-4 font-display text-lg font-bold text-ink">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand">
        Выбрать <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  )
}

/* ------------------------------ Регистрация ------------------------------ */

function Register({
  company,
  role,
  onBack,
  onDone,
}: {
  company: Company
  role: Role
  onBack: () => void
  onDone: (s: Session) => void
}) {
  const { push } = useToast()
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || pin.trim().length < 4) return
    setBusy(true)
    try {
      const member = await repo.createMember({
        company_id: company.id,
        role,
        full_name: name.trim(),
        pin: pin.trim(),
      })
      const session: Session = { company, member }
      setSession(session)
      onDone(session)
    } catch (err) {
      push({ kind: 'warning', title: 'Ошибка регистрации', body: (err as Error).message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard
      title="Регистрация"
      subtitle={role === 'economist' ? 'Профиль экономиста компании' : 'Профиль руководителя департамента'}
      onBack={onBack}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Имя и фамилия">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Айдана Серикова" autoFocus />
        </Field>
        <Field label="PIN-код" hint="Не менее 4 символов. Понадобится для входа в профиль.">
          <Input
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="••••"
            type="password"
            inputMode="numeric"
          />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          Войти в систему
          <ArrowRight size={18} />
        </Button>
      </form>
    </AuthCard>
  )
}
