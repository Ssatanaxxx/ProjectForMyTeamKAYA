import { useMutation } from '@tanstack/react-query';
import { useToast } from '../components/Toast';
import { repo } from '../lib/repo';
import type { Member, Role } from '../lib/types';

interface RegisterInput {
  company_id: string;
  role: Role;
  full_name: string;
  pin: string;
}

export function useRegister() {
  const toast = useToast();
  return useMutation<Member, Error, RegisterInput>({
    mutationFn: async ({ company_id, role, full_name, pin }) => {
      const member = await repo.createMember({ company_id, role, full_name, pin });
      return member as Member;
    },
    onError: (err: Error) => {
      toast.push({
        kind: 'warning',
        title: 'Ошибка регистрации',
        body: err.message,
      });
    },
  });
}
