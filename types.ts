export enum Sender {
  User = 'user',
  Bot = 'bot',
  System = 'system'
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: Date;
  isThinking?: boolean;
}

export interface Scenario {
  id: string;
  title: string;
  profession: string;
  description: string;
  difficulty: 'Débutant' | 'Intermédiaire' | 'Expert';
  avatarUrl: string;
  systemPrompt: string;
  objectives: string[];
  voiceId: string;
}

export interface SimulationState {
  isActive: boolean;
  scenario: Scenario | null;
  messages: Message[];
  feedback: string | null;
}