export interface ChatMessage {
  id: string;
  sender: 'user' | 'gabrielillo';
  text: string;
  timestamp: string;
  actionLink?: {
    label: string;
    href: string;
  };
}

export interface QuickChip {
  id: string;
  label: string;
  prompt: string;
}
