import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { UICard, UICardBody } from '../components/UI/index';

interface AuthCardProps {
  title: string;
  subtitle: string;
  onBack: () => void;
  children: React.ReactNode;
}

export const AuthCard = ({ title, subtitle, onBack, children }: AuthCardProps) => (
  <div className="mx-auto max-w-md pt-6 lg:pt-14">
    <button
      onClick={onBack}
      className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
    >
      <ArrowLeft size={16} /> Назад
    </button>
    <UICard className="shadow-pop">
      <UICardBody className="space-y-5">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>
        {children}
      </UICardBody>
    </UICard>
  </div>
);
