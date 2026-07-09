import { useMutation } from '@tanstack/react-query';
import { useToast } from '../components/Toast';
import { repo } from '../lib/repo';
import type { Company } from '../lib/types';

interface CreateCompanyInput {
  name: string;
  access_code: string;
}

export function useCreateCompany() {
  const toast = useToast();
  return useMutation<Company, Error, CreateCompanyInput>({
    mutationFn: async ({ name, access_code }) => {
      const company = await repo.createCompany({ name, access_code });
      return company as Company;
    },
    onError: (err: Error) => {
      toast.push({
        kind: 'warning',
        title: 'Не удалось создать',
        body: err.message,
      });
    },
    onSuccess: (company: Company) => {
      toast.push({
        kind: 'success',
        title: 'Компания создана',
        body: `Код доступа: ${company.access_code}`,
      });
    },
  });
}
