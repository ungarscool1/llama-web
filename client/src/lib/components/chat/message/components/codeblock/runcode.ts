import { WASI } from '@antonz/runno';

export type RunCodeResult = {
  output: string;
  error: string;
};

function getPythonDependencies(code: string): Array<string> {
  const dependencies = [];
  const lines = code.split('\n');
  for (let line of lines) {
    const match = line.match(/import\s+([a-zA-Z0-9_]+)/);
    if (match) {
      dependencies.push(match[1]);
    }
  }
  return Array.from(new Set(dependencies));
}

export async function runPythonCode(code: string): Promise<RunCodeResult> {
  const result = {
    output: '',
    error: ''
  }
  const dependencies = getPythonDependencies(code);
  const runnable = await WASI.start(fetch("/public/code/python.wasm"), {
    args: ['python', '-c', code],
    stdout: (data: string) => result.output += data,
    stderr: (data: string) => result.error += data,
  });
  return result;
}

export async function runLuaCode(code: string): Promise<RunCodeResult> {
  const result = {
    output: '',
    error: ''
  }
  const runnable = await WASI.start(fetch("/public/code/lua.wasm"), {
    args: ['lua', '-e', code],
    stdout: (data: string) => result.output += data,
    stderr: (data: string) => result.error += data,
  });
  return result;
}

export async function runRubyCode(code: string): Promise<RunCodeResult> {
  const result = {
    output: '',
    error: ''
  }
  const runnable = await WASI.start(fetch("/public/code/ruby.wasm"), {
    args: ['ruby', '-e', code],
    stdout: (data: string) => result.output += data,
    stderr: (data: string) => result.error += data,
  });
  return result;
}

export async function runPhpCode(code: string): Promise<RunCodeResult> {
  const result = {
    output: '',
    error: ''
  }
  const runnable = await WASI.start(fetch("/public/code/php.wasm"), {
    args: ['php', '/home/playground/index.php'],
    stdout: (data: string) => result.output += data,
    stderr: (data: string) => result.error += data,
    fs: {
      "/home/playground/index.php": {
        path: "/home/playground/index.php",
        timestamps: {
          access: new Date(),
          change: new Date(),
          modification: new Date(),
        },
        mode: "string",
        content: code,
      }
    },
  });
  return result;
}
