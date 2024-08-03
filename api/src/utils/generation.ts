import { spawn, spawnSync } from 'child_process';
import axios from 'axios';
import { Message, Role } from '../types/Message';
import { IModel } from '../models/model';
import * as express from 'express';
import { IUser } from '../types/express';
import { GenerationOutput, Providers } from '../types/Generation';
import mongoose from 'mongoose';

import { createOrUpdateChat } from './createOrUpdateChat';
import compileTemplate from './compileTemplate';
import { IPrompt } from '../models/prompt';
import { getGroqChatCompletion } from './providers/groq';

type GenerationOptions = {
  executablePath: string;
};

type LaunchOptions = {
  modelPath: string;
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

interface ChatProcess {
  user: string;
  process: GenerationOutput;
}

export class Generation {
  private options: GenerationOptions;
  private chatsProcess: Array<ChatProcess> = [];
  constructor(options: GenerationOptions) {
    this.options = options;
  }
  /**
   * Launch in interactive mode
   * @param options Launch options
   * @returns Child process
   */
  launch(options: LaunchOptions): GenerationOutput {
    const args = [
      '-m', options.modelPath,
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
    return {
      data: child.stdout,
      stderr: child.stderr,
      kill: () => child.kill()
    };
  }
  
  /**
   * Launch in non-interactive mode
   * @param options Launch options
   * @returns The generated text
   */
  launchSync(options: LaunchOptions): string {
    const args = [
      '-m', options.modelPath,
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
  generateCompletion(prompt: string, options: LaunchOptionsLow): GenerationOutput {
    const child = this.launch({
      modelPath: options.modelPath,
      threads: 4,
      prompt,
      interactive: false,
      nPredict: options.nPredict,
      temperature: options.temperature,
      topK: options.topK,
      topP: options.topP
    });
    return {
      data: child.data,
      stderr: child.stderr,
      kill: () => child.kill()
    };
  }
  
  /**
   * Generate embeddings from a prompt
   * @param prompt The user's input
   * @returns Embeddings of the prompt
   */
  generateEmbeddings(prompt: string, modelPath: string): Array<number> {
    return this.launchSync({
      modelPath,
      threads: 4,
      prompt: prompt,
      interactive: false,
    }).trim()
      .split(' ')
      .map(r => parseFloat(r));
  }
  
  /**
   * Generate completion in alternative backend
   * @param messages The conversation history
   * @returns Buffer
   */
  async generateCompletionAlt(messages: Message[], model: IModel, system: string): Promise<GenerationOutput> {
    const cancelToken = axios.CancelToken.source();
    messages.unshift({ role: Role.system, message: system });
    if (model.name.startsWith('groq-')) {
      return getGroqChatCompletion(model.name, messages);
    }
    const axiosRes = await axios.post(`${model.path}/completion`, {
      messages: messages.map(m => ({ role: m.role, content: m.message }))
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${model.parameters.authentication}`
      },
      responseType: 'stream',
      cancelToken: cancelToken.token
    });
    return {
      data: axiosRes.data,
      stderr: undefined,
      kill: () => (
        cancelToken.cancel('Generation cancelled')
      )
    };
  }
  
  async generationWrapper(messages: Message[], model: IModel, res: express.Response, user?: IUser, id?: string): Promise<void> {
    let child: GenerationOutput;
    let system = `Below is an instruction that describes a task. Write a response that appropriately completes the request. The response must be accurate, concise and evidence-based whenever possible.`;
    let prompt = ``;
    let ignoreIndex = 0;
    let response = '';

    if (this.chatsProcess.find((chat) => chat.user === user?.preferred_username)) {
      res.status(400).json({ message: 'There is already a chat in progress' });
      return;
    }
    system = (await mongoose.model('Prompts').findOne<IPrompt>({ user: user?.preferred_username }))?.prompt || system;
    if (user?.given_name)
      system += ` Here some information that can you help, the user name is ${user.given_name}.`;
    if (!model.alternativeBackend) {
      prompt = compileTemplate(model.chatPromptTemplate!, { system: system, messages: messages });
      child = this.launch({
        modelPath: `${process.env.MODELS_DIR}/${model.path}`,
        contextSize: 4096,
        temperature: 0.7,
        repeatPenalty: 1.1,
        threads: 4,
        nPredict: -1,
        prompt,
        interactive: false,
      });
    } else {
      child = await this.generateCompletionAlt(messages, model, system);
    }
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    res.flushHeaders();
    let buffer = '';
    child.data.on('data', (data) => {
      if (Object.values(Providers).includes(model.name.split('-')[0] as Providers)) {
        buffer += data.toString();
        let boundary = buffer.indexOf('\n');
        while (boundary !== -1) {
          const chunk = buffer.substring(0, boundary).trim();
          buffer = buffer.substring(boundary + 1);
          boundary = buffer.indexOf('\n');

          if (chunk.startsWith('data: ')) {
            const result = chunk.substring(6);
            try {
              JSON.parse(result).choices.forEach((choice: any) => {
                response += choice.delta.content;
                res.write(choice.delta.content);
                res.flushHeaders();
              });
            } catch (e) {
              console.error(e);
            }
          }
        }
        return;
      }
      if (!model.alternativeBackend && ignoreIndex < prompt.replaceAll(/<\/?s>/g, '').trim().length) {
        ignoreIndex += data.toString().length;
        return;
      }
      response += data.toString();
      res.write(data.toString());
      res.flushHeaders();
    });
  
    if (child.stderr) {
      child.stderr.on('data', (data) => {
        if (data.toString().includes('[end of text]'))
          child.kill!();
      });
    }
  
    child.data.on('close', async () => {
      if (response.startsWith('<!--ERROR:')) {
        res.end();
        return;
      }
      try {
        let newId = await createOrUpdateChat([
          messages.pop() as Message,
          { role: Role.assistant, message: response.trim() }
        ], model.name, id, user?.preferred_username);
        if (newId.length > 0)
          res.write(`[[${newId}]]`)
      } catch (e) {
        console.error(e);
      }
      res.end();
      this.chatsProcess.splice(this.chatsProcess.findIndex(c => c.user === user?.preferred_username), 1);
    });
    
    this.chatsProcess.push({
      user: `${user?.preferred_username}`,
      process: child
    });
  }
  
  stopGeneration(user?: string): boolean {
    const chatProcess = this.chatsProcess.find((chat) => chat.user === user);
    if (chatProcess) {
      chatProcess.process.kill();
      this.chatsProcess.splice(this.chatsProcess.indexOf(chatProcess), 1);
      return true;
    }
    return false;
  }
}