export enum Role {
  user = 'user',
  assistant = 'assistant',
  system = 'system',
}

export interface Message {
  role: Role;
  message: string;
}