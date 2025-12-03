import React from 'react';
import { Bot, Menu } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-3">
             {/* BPCE Logo Simulation */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-bpce-purple text-white font-bold text-xs shadow-lg">
              BPCE
            </div>
            <div className="flex flex-col">
              <span className="font-pixel text-bpce-purple text-sm md:text-lg tracking-tight">
                PROFIL PARTICULIER
              </span>
              <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                Learning Réseaux
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-bpce-light px-3 py-1 rounded-full border border-bpce-purple/20">
              <Bot className="w-5 h-5 text-bpce-purple" />
              <span className="text-xs font-semibold text-bpce-dark">Ia.FA Connecté</span>
            </div>
            <button className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};