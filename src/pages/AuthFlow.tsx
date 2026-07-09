import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Wallet,
  ShieldCheck,
  LineChart,
  Building2,
  UserCog,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { AuthLayout } from "../features/AuthLayout";
import { StepShell } from "../features/StepShell";
import { CreateCompanyForm } from "../components/Fields/CreateCompanyForm";
import { JoinCompanyForm } from "../components/Fields/JoinCompanyForm";
import { RegisterForm } from "../components/Fields//RegisterForm";
import type { Company, Role } from "../lib/types";
import type { Session } from "../lib/session";
import { UIButton, UICard, UICardBody } from "../components/UI/index";

type Step = "landing" | "create" | "join" | "role" | "register";

export function AuthFlow({ onDone }: { onDone: (session: Session) => void }) {
  const [step, setStep] = useState<Step>("landing");
  const [company, setCompany] = useState<Company | null>(null);
  const [role, setRole] = useState<Role>("economist");

  return (
    <AuthLayout>
      <AnimatePresence mode="wait">
        {step === "landing" && (
          <StepShell key="landing">
            <Landing
              onCreate={() => setStep("create")}
              onJoin={() => setStep("join")}
            />
          </StepShell>
        )}
        {step === "create" && (
          <StepShell key="create">
            <CreateCompanyForm
              onBack={() => setStep("landing")}
              onCreated={(c) => {
                setCompany(c);
                setStep("role");
              }}
            />
          </StepShell>
        )}
        {step === "join" && (
          <StepShell key="join">
            <JoinCompanyForm
              onBack={() => setStep("landing")}
              onJoined={(c) => {
                setCompany(c);
                setStep("role");
              }}
            />
          </StepShell>
        )}
        {step === "role" && company && (
          <StepShell key="role">
            <RoleSelect
              company={company}
              onBack={() => setStep("landing")}
              onPick={(r) => {
                setRole(r);
                setStep("register");
              }}
            />
          </StepShell>
        )}
        {step === "register" && company && (
          <StepShell key="register">
            <RegisterForm
              company={company}
              role={role}
              onBack={() => setStep("role")}
              onDone={onDone}
            />
          </StepShell>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}

// Компонент лендинга с описанием и кнопками
function Landing({
  onCreate,
  onJoin,
}: {
  onCreate: () => void;
  onJoin: () => void;
}) {
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
          Budgetly собирает заявки департаментов в одном месте, сам распределяет
          лимиты и проверяет каждую статью расходов. Экономист видит отклонения
          сразу и решает: одобрить или вернуть на доработку.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <UIButton size="lg" onClick={onCreate}>
            Создать компанию
            <ArrowRight size={18} />
          </UIButton>
          <UIButton size="lg" variant="secondary" onClick={onJoin}>
            Войти по коду
          </UIButton>
        </div>
        <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-[13px] text-muted">
          <Feature
            icon={<Wallet size={15} />}
            text="Автолимиты по департаментам"
          />
          <Feature
            icon={<ShieldCheck size={15} />}
            text="Автоконтроль расходов"
          />
          <Feature icon={<LineChart size={15} />} text="Формулы и графики" />
        </div>
      </div>
      <HeroPanel />
    </div>
  );
}
function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-brand">{icon}</span>
      {text}
    </span>
  );
}
const STEPS = [
  {
    icon: <Wallet size={20} />,
    title: "Экономист задаёт бюджет",
    text: "Общий бюджет и период. Система сама распределяет автолимиты по департаментам.",
  },
  {
    icon: <Building2 size={20} />,
    title: "Департаменты подают заявки",
    text: "Каждая статья: количество, цена и обоснование, зачем она нужна компании.",
  },
  {
    icon: <ShieldCheck size={20} />,
    title: "Автоконтроль и решение",
    text: "Система подсвечивает превышения и считает формулы. Экономист одобряет или возвращает.",
  },
];
function HeroPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <UICard className="shadow-pop">
        <UICardBody>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-faint">
            Как это работает
          </p>
          {STEPS.map((s, i) => (
            <motion.div
              key={i}
              className="flex gap-4"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.35 + i * 0.12,
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="flex flex-col items-center">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-ink">
                  {s.icon}
                </span>
                {i < STEPS.length - 1 && (
                  <span className="my-1 w-px flex-1 bg-border" />
                )}
              </div>
              <div className={i < STEPS.length - 1 ? "pb-5" : ""}>
                <div className="flex items-center gap-2">
                  <span className="nums text-xs font-bold text-brand">
                    0{i + 1}
                  </span>
                  <h3 className="font-display text-[15px] font-bold text-ink">
                    {s.title}
                  </h3>
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-muted">
                  {s.text}
                </p>
              </div>
            </motion.div>
          ))}
        </UICardBody>
      </UICard>
    </motion.div>
  );
}
function RoleSelect({
  company,
  onBack,
  onPick,
}: {
  company: Company;
  onBack: () => void;
  onPick: (r: Role) => void;
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
        <h2 className="mt-1 font-display text-2xl font-bold text-ink">
          Кто вы в этой компании?
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <RoleCard
          icon={<UserCog size={22} />}
          title="Экономист"
          text="Задаёте бюджет, распределяете лимиты, проверяете и утверждаете заявки департаментов."
          onClick={() => onPick("economist")}
        />
        <RoleCard
          icon={<Building2 size={22} />}
          title="Руководитель департамента"
          text="Формируете заявку на бюджет департамента: статьи расходов, суммы и обоснования."
          onClick={() => onPick("department_head")}
        />
      </div>
    </div>
  );
}
function RoleCard({
  icon,
  title,
  text,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  onClick: () => void;
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
        Выбрать{" "}
        <ArrowRight
          size={15}
          className="transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </button>
  );
}
