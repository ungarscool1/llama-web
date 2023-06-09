import { spawn, spawnSync, ChildProcessWithoutNullStreams } from 'child_process';

type GenerationOptions = {
  executablePath: string;
  modelPath: string;
};

type LaunchOptions = {
  contextSize?: number;
  temperature?: number;
  topK?: number;
  topP?: number;
  repeatLastN?: number;
  batchSize?: number;
  repeatPenalty?: number;
  threads: number;
  nPredict?: number;
  prompt: string;
  interactive: boolean;
  reversePrompt?: string;
};

type LaunchOptionsLow = Omit<LaunchOptions, 'interactive'|'prompt'|'threads'>;

export type GenerationLaunchOutput = ChildProcessWithoutNullStreams;

export class Generation {
  private options: GenerationOptions;
  constructor(options: GenerationOptions) {
    this.options = options;
  }
  /**
   * Launch in interactive mode
   * @param options Launch options
   * @returns Child process
   */
  launch(options: LaunchOptions): ChildProcessWithoutNullStreams {
    const args = [
      '-m', this.options.modelPath,
      '--threads', `${options.threads}`,
      '--prompt', options.prompt,
      ...(options.contextSize ? ['--ctx_size', `${options.contextSize}`] : []),
      ...(options.temperature ? ['--temp', `${options.temperature}`] : []),
      ...(options.topK ? ['--top_k', `${options.topK}`] : []),
      ...(options.topP ? ['--top_p', `${options.topP}`] : []),
      ...(options.repeatLastN ? ['--repeat_last_n', `${options.repeatLastN}`] : []),
      ...(options.batchSize ? ['--batch_size', `${options.batchSize}`] : []),
      ...(options.repeatPenalty ? ['--repeat_penalty', `${options.repeatPenalty}`] : []),
      ...(options.nPredict ? ['--n_predict', `${options.nPredict}`] : []),
      ...(options.interactive ? ['--interactive'] : []),
      ...(options.reversePrompt ? ['--reverse-prompt', options.reversePrompt] : []),
    ];
    const child = spawn(this.options.executablePath, args.filter(arg => arg !== undefined));
    return child;
  }
  
  /**
   * Launch in non-interactive mode
   * @param options Launch options
   * @returns The generated text
   */
  launchSync(options: LaunchOptions): string {
    const args = [
      '-m', this.options.modelPath,
      '--threads', `${options.threads}`,
      '--prompt', options.prompt,
      ...(options.contextSize ? ['--ctx_size', `${options.contextSize}`] : []),
      ...(options.temperature ? ['--temp', `${options.temperature}`] : []),
      ...(options.topK ? ['--top_k', `${options.topK}`] : []),
      ...(options.topP ? ['--top_p', `${options.topP}`] : []),
      ...(options.repeatLastN ? ['--repeat_last_n', `${options.repeatLastN}`] : []),
      ...(options.batchSize ? ['--batch_size', `${options.batchSize}`] : []),
      ...(options.repeatPenalty ? ['--repeat_penalty', `${options.repeatPenalty}`] : []),
      ...(options.nPredict ? ['--n_predict', `${options.nPredict}`] : []),
      ...(options.interactive ? ['--interactive'] : []),
      ...(options.reversePrompt ? ['--reverse-prompt', options.reversePrompt] : []),
    ];
    const child = spawnSync(this.options.executablePath, args.filter(arg => arg !== undefined));
    if (child.status !== 0) {
      throw new Error(child.stderr.toString());
    }
    return child.stdout.toString();
  }
  
  /**
   * Generate completion
   * @param prompt The user's input
   */
  generateCompletion(prompt: string, options: LaunchOptionsLow): ChildProcessWithoutNullStreams {
    return this.launch({
      threads: 4,
      prompt,
      interactive: false,
      nPredict: options.nPredict,
      temperature: options.temperature,
      topK: options.topK,
      topP: options.topP
    });
  }
  
  /**
   * Generate embeddings from a prompt
   * @param prompt The user's input
   * @returns Embeddings of the prompt
   */
  generateEmbeddings(prompt: string): Array<number> {
    return this.launchSync({
      threads: 4,
      prompt: prompt,
      interactive: false,
    }).trim()
      .split(' ')
      .map(r => parseFloat(r));
  }
}