import { useMutation } from '@tanstack/react-query';
import { useToast } from '../components/Toast';
import { repo } from '../lib/repo';
import type { Company } from '../lib/types';

interface JoinCompanyInput {
  code: string;
}

export function useJoinCompany() {
  const toast = useToast();
  return useMutation<Company | null, Error, JoinCompanyInput>({
    mutationFn: async ({ code }) => {
      const company = await repo.getCompanyByCode(code);
      return company as Company | null;
    },
    onError: (err: Error) => {
      toast.push({
        kind: 'warning',
        title: 'Ошибка входа',
        body: err.message,
      });
    },
  });
}
