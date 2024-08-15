import { WASI } from '@antonz/runno';
import { env } from '$env/dynamic/public';

export type RunCodeResult = {
  output: string;
  error: string;
};

export async function runPythonCode(code: string): Promise<RunCodeResult> {
  const result = {
    output: '',
    error: ''
  }
  if (env.PUBLIC_PYTHON_ENV === 'pyodide') {
    // @ts-ignore - pyodide loaded in codeblock.svelte
    const pyodide = await loadPyodide({
      stdout: (data: string) => result.output += data,
      stderr: (data: string) => result.error += data,
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/',
      fullStdLib: false,
      packageCacheDir: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/',
    });
    await pyodide.loadPackagesFromImports(code);
    try {
      const runnable = await pyodide.runPython(code);
      console.log(runnable);
    } catch (error) {
      console.error(error);
    }
  } else {
    await WASI.start(fetch("/public/code/python.wasm"), {
      args: ['python', '-c', code],
      stdout: (data: string) => result.output += data,
      stderr: (data: string) => result.error += data,
      env: {
        'HOME': '/home/playground',
        'PWD': '/home/playground',
        'USER': 'playground',
        'IN_BROWSER': 'true',
      },
    });
  }
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
    env: {
      'HOME': '/home/playground',
      'PWD': '/home/playground',
      'USER': 'playground',
      'IN_BROWSER': 'true',
    },
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
    env: {
      'HOME': '/home/playground',
      'PWD': '/home/playground',
      'USER': 'playground',
      'IN_BROWSER': 'true',
    },
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
    env: {
      'HOME': '/home/playground',
      'PWD': '/home/playground',
      'USER': 'playground',
      'IN_BROWSER': 'true',
    },
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
