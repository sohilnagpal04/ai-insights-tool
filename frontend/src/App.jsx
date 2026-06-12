import React, { useState } from 'react';
import UploadScreen from './components/UploadScreen';
import Dashboard from './components/Dashboard';

export default function App() {
  const [session, setSession] = useState(null);

  return session
    ? <Dashboard session={session} onReset={() => setSession(null)} />
    : <UploadScreen onSessionReady={setSession} />;
}
