import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Overview from './Overview';
import AIInsights from './AIInsights';
import Anomalies from './Anomalies';
import Chat from './Chat';
import HubSpotDeals from './HubSpotDeals';
import HubSpotContacts from './HubSpotContacts';
import HubSpotCompanies from './HubSpotCompanies';

export default function Dashboard({ session, onReset }) {
  const [tab, setTab] = useState('overview');
  const hs = session.hubspot;

  function renderOverview() {
    if (!hs) return <Overview session={session} />;
    if (hs.source_type === 'hubspot_deals')     return <HubSpotDeals     hs={hs} session={session} />;
    if (hs.source_type === 'hubspot_contacts')  return <HubSpotContacts  hs={hs} session={session} />;
    if (hs.source_type === 'hubspot_companies') return <HubSpotCompanies hs={hs} session={session} />;
    return <Overview session={session} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-dash-950">
      <Sidebar
        session={session}
        activeTab={tab}
        onTabChange={setTab}
        onReset={onReset}
      />
      <main className="flex-1 overflow-y-auto p-6">
        {tab === 'overview'  && renderOverview()}
        {tab === 'insights'  && <AIInsights session={session} />}
        {tab === 'anomalies' && <Anomalies  session={session} />}
        {tab === 'chat'      && <Chat       session={session} />}
      </main>
    </div>
  );
}
