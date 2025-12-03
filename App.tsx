
import React, { useState } from 'react';
import { Header } from './components/Header';
import { ScenarioSelector } from './components/ScenarioSelector';
import { ChatSession } from './components/ChatSession';
import { Scenario } from './types';
import { Rocket, ShieldCheck, Users, Play, Sparkles } from 'lucide-react';
import { LANDING_HERO_IMAGE } from './constants';

const App: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);

  if (!hasStarted) {
    return (
      <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-50">
        {/* Background Image - Fullscreen without stretching */}
        <img
          src={LANDING_HERO_IMAGE}
          alt="Profil Particulier BPCE"
          className="w-full h-full object-contain select-none"
          onError={(e) => {
            console.error("Image failed to load:", e.currentTarget.src);
            e.currentTarget.src = "/img/unnamed.jpg";
            e.currentTarget.onerror = null;
          }}
        />

        {/* Clickable button area positioned over the COMMENCER button */}
        <button
          type="button"
          onClick={() => setHasStarted(true)}
          className="absolute cursor-pointer bg-transparent hover:bg-white/5 transition-all duration-200"
          style={{
            top: '80%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '240px',
            height: '200px',
            marginTop: '20px'
          }}
          aria-label="Commencer"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!activeScenario ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Hero Section (Inner) */}
            <div className="py-12 md:py-16 text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-bpce-dark mb-6 tracking-tight">
                Maîtrisez la <span className="text-bpce-purple bg-bpce-light/50 px-2 rounded-lg">Double Relation</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
                Entraînez-vous à détecter les besoins personnels de vos clients professionnels grâce à notre simulateur IA.
              </p>
              
              <div className="flex flex-wrap justify-center gap-8 mb-12">
                <div className="flex items-center gap-2 text-gray-700">
                  <div className="bg-purple-100 p-2 rounded-full text-bpce-purple">
                    <Rocket size={20} />
                  </div>
                  <span className="font-medium">Mises en situation réalistes</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <div className="bg-purple-100 p-2 rounded-full text-bpce-purple">
                    <Users size={20} />
                  </div>
                  <span className="font-medium">Profils variés</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <div className="bg-purple-100 p-2 rounded-full text-bpce-purple">
                    <ShieldCheck size={20} />
                  </div>
                  <span className="font-medium">Feedback instantané</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200">
              <ScenarioSelector onSelect={setActiveScenario} />
            </div>
          </div>
        ) : (
          <div className="py-6 h-full">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 h-full animate-in zoom-in-95 duration-300">
              <ChatSession 
                scenario={activeScenario} 
                onExit={() => setActiveScenario(null)} 
              />
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2025 Groupe BPCE - Direction Campus - Formation Interne</p>
          <p className="mt-1 text-xs">Powered by Google Gemini & Ia.FA</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
