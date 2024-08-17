import { WASI } from '@antonz/runno';
import { env } from '$env/dynamic/public';
import { loadPyodide } from 'pyodide';

export type RunCodeResult = {
  output: string;
  error: string;
  image?: string;
};

export async function runPythonCode(code: string): Promise<RunCodeResult> {
  const result = {
    output: '',
    error: '',
    image: ''
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
    code = code.replace('plt.show()', 'import io\nbuf = io.BytesIO()\nfig.savefig(buf, format=\'png\')\nimport base64\nbuf.seek(0)\nimg_base64 = base64.b64encode(buf.read()).decode(\'utf-8\')')
    await pyodide.loadPackagesFromImports(code);
    try {
      const runnable = await pyodide.runPython(code);
      console.log(runnable);
      if (pyodide.globals.get('img_base64')) {
        result.image = pyodide.globals.get('img_base64');
      }
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
