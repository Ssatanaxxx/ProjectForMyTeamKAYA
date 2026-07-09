import React, { useState } from 'react';
import { useJoinCompany } from '../../hooks/useJoinCompany';
import { joinCompanySchema } from '../../features/schemas/CompanySchema';
import { AuthCard } from '../../features/AuthCard';
import { UIField, UIInput, UIButton } from '../UI';
import { ArrowRight, KeyRound } from 'lucide-react';
import { useToast } from '../Toast';
import type { Company } from '../../lib/types';

export function JoinCompanyForm({
  onBack,
  onJoined,
}: {
  onBack: () => void;
  onJoined: (company: Company) => void;
}) {
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<{ code?: string }>({});
  const toast = useToast();
  const joinCompanyMutation = useJoinCompany();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = joinCompanySchema.safeParse({ code });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const { code: validCode } = result.data;
    joinCompanyMutation.mutate(
      { code: validCode },
      {
        onSuccess: (company) => {
          if (!company) {
            toast.push({
              kind: 'warning',
              title: 'Компания не найдена',
              body: 'Проверьте код доступа.',
            });
          } else {
            onJoined(company);
          }
        },
      }
    );
  };

  return (
    <AuthCard title="Вход по коду" subtitle="Введите код доступа вашей компании." onBack={onBack}>
      <form onSubmit={submit} className="space-y-4">
        <UIField label="Код доступа" hint={errors.code}>
          <div className="relative">
            <KeyRound
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
            />
            <UIInput
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="astana-2026"
              className="pl-9"
              autoFocus
            />
          </div>
        </UIField>
        <UIButton type="submit" size="lg" className="w-full" loading={joinCompanyMutation.isPending}>
          Войти <ArrowRight size={18} />
        </UIButton>
      </form>
    </AuthCard>
  );
}
