import React, { useState } from 'react';
import { useRegister } from '../../hooks/useRegister';
import { registerSchema } from '../../features/schemas/CompanySchema';
import { AuthCard } from '../../features/AuthCard';
import { UIField, UIInput, UIButton } from '../UI';
import { ArrowRight } from 'lucide-react';
import { setSession, type Session } from '../../lib/session';
import type { Company, Role, Member } from '../../lib/types';

export function RegisterForm({
  company,
  role,
  onBack,
  onDone,
}: {
  company: Company;
  role: Role;
  onBack: () => void;
  onDone: (session: Session) => void;
}) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [errors, setErrors] = useState<{ name?: string; pin?: string }>({});
  const registerMutation = useRegister();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = registerSchema.safeParse({ name, pin });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const { name: validName, pin: validPin } = result.data;
    registerMutation.mutate(
      {
        company_id: company.id,
        role,
        full_name: validName,
        pin: validPin,
      },
      {
        onSuccess: (member: Member) => {
          const session: Session = { company, member };
          setSession(session);
          onDone(session);
        },
      }
    );
  };

  return (
    <AuthCard
      title="Регистрация"
      subtitle={
        role === 'economist'
          ? 'Профиль экономиста компании'
          : 'Профиль руководителя департамента'
      }
      onBack={onBack}
    >
      <form onSubmit={submit} className="space-y-4">
        <UIField label="Имя и фамилия" hint={errors.name}>
          <UIInput
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Айдана Серикова"
            autoFocus
          />
        </UIField>
        <UIField
          label="PIN-код"
          hint={errors.pin || 'Не менее 4 символов. Понадобится для входа в профиль.'}
        >
          <UIInput
            value={pin}
            onChange={e => setPin(e.target.value)}
            placeholder="••••"
            type="password"
            inputMode="numeric"
          />
        </UIField>
        <UIButton
          type="submit"
          size="lg"
          className="w-full"
          loading={registerMutation.isPending}
        >
          Войти в систему <ArrowRight size={18} />
        </UIButton>
      </form>
    </AuthCard>
  );
}
