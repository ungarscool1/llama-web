import { Readable } from 'stream';

export type GenerationOutput = {
  data: Readable;
  stderr?: Readable;
  kill: () => void;
}

export enum Providers {
  GROQ = 'groq'
}