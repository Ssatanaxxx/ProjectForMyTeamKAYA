import React, { useState } from 'react';
import { useCreateCompany } from '../../hooks/useCreateCompany';
import { createCompanySchema } from '../../features/schemas/CompanySchema';
import { AuthCard } from '../../features/AuthCard';
import { UIField, UIInput, UIButton } from '../UI';
import { ArrowRight, KeyRound } from 'lucide-react';
import type { Company } from '../../lib/types';

export function CreateCompanyForm({
  onBack,
  onCreated,
}: {
  onBack: () => void;
  onCreated: (company: Company) => void;
}) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<{ name?: string; code?: string }>({});
  const createCompanyMutation = useCreateCompany();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = createCompanySchema.safeParse({ name, code });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const { name: validName, code: validCode } = result.data;
    createCompanyMutation.mutate(
      { name: validName, access_code: validCode },
      {
        onSuccess: (company: Company) => {
          onCreated(company);
        },
      }
    );
  };

  return (
    <AuthCard
      title="Создание компании"
      subtitle="Название и код доступа. По коду в компанию войдут экономист и руководители департаментов."
      onBack={onBack}
    >
      <form onSubmit={submit} className="space-y-4">
        <UIField label="Название компании" hint={errors.name}>
          <UIInput
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Напр. АО «Астана Инвест»"
            autoFocus
          />
        </UIField>
        <UIField
          label="Код доступа"
          hint={errors.code || 'Придумайте секретный код — это ключ к вашей компании.'}
        >
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
            />
          </div>
        </UIField>
        <UIButton type="submit" size="lg" className="w-full" loading={createCompanyMutation.isPending}>
          Продолжить <ArrowRight size={18} />
        </UIButton>
      </form>
    </AuthCard>
  );
}
