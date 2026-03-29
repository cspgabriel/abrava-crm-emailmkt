import React from 'react';
import dynamic from 'next/dynamic';

const ClientPortal = dynamic(() => import('../components/ClientPortal'), { ssr: false });

export default function PortalPage() {
  return <ClientPortal />;
}
