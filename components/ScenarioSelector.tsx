import React from 'react';
import { SCENARIOS } from '../constants';
import { Scenario } from '../types';
import { Briefcase, ArrowRight, Star } from 'lucide-react';

interface ScenarioSelectorProps {
  onSelect: (scenario: Scenario) => void;
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({ onSelect }) => {
  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Choisissez votre mission</h2>
      <p className="text-gray-600 mb-8">Sélectionnez un profil client pour démarrer la simulation.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SCENARIOS.map((scenario) => (
          <div 
            key={scenario.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-bpce-purple/50 transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer"
            onClick={() => onSelect(scenario)}
          >
            <div className="h-2 bg-bpce-purple w-0 group-hover:w-full transition-all duration-500"></div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
                  <img src={scenario.avatarUrl} alt={scenario.title} className="w-full h-full object-cover" />
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  scenario.difficulty === 'Débutant' ? 'bg-green-100 text-green-800' :
                  scenario.difficulty === 'Intermédiaire' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {scenario.difficulty}
                </span>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-bpce-purple transition-colors">
                {scenario.title}
              </h3>
              <p className="text-sm text-bpce-purple font-medium mb-3 flex items-center gap-1">
                <Briefcase size={14} /> {scenario.profession}
              </p>
              
              <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">
                {scenario.description}
              </p>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 mb-2">Objectifs :</p>
                <ul className="space-y-1">
                  {scenario.objectives.slice(0, 2).map((obj, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                      <Star size={10} className="mt-0.5 text-bpce-accent fill-current" />
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-3 flex justify-between items-center group-hover:bg-bpce-light/30 transition-colors">
              <span className="text-xs font-medium text-gray-500">Démarrer la simulation</span>
              <ArrowRight className="w-4 h-4 text-bpce-purple transform group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};