import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Overview from './Overview';
import AIInsights from './AIInsights';
import Anomalies from './Anomalies';
import Chat from './Chat';

const TABS = ['overview', 'insights', 'anomalies', 'chat'];

export default function Dashboard({ session, onReset }) {
  const [tab, setTab] = useState('overview');

  return (
    <div className="flex h-screen overflow-hidden bg-dash-950">
      <Sidebar
        session={session}
        activeTab={tab}
        onTabChange={setTab}
        onReset={onReset}
      />
      <main className="flex-1 overflow-y-auto p-6">
        {tab === 'overview'  && <Overview  session={session} />}
        {tab === 'insights'  && <AIInsights session={session} />}
        {tab === 'anomalies' && <Anomalies  session={session} />}
        {tab === 'chat'      && <Chat       session={session} />}
      </main>
    </div>
  );
}
