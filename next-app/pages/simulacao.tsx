import React from 'react';
import dynamic from 'next/dynamic';

const SimulatorForm = dynamic(() => import('../components/SimulatorForm'), { ssr: false });

export default function SimulacaoPage() {
  return <SimulatorForm />;
}
