export enum Role {
  user = 'user',
  assistant = 'assistant'
}

export interface Message {
  role: Role;
  message: string;
}