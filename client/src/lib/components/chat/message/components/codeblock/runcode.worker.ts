import { WASI } from '@antonz/runno';
//import { env } from '$env/dynamic/public';
import { type RunCodeResult } from '$lib/types/runcode';

self.onmessage = async (event) => {
  const { language, code } = event.data;
  let result: RunCodeResult;

  switch (language) {
    case 'python':
      result = await runPythonCode(code);
      break;
    case 'lua':
      result = await runLuaCode(code);
      break;
    case 'ruby':
      result = await runRubyCode(code);
      break;
    case 'php':
      result = await runPhpCode(code);
      break;
    default:
      result = { output: '', error: `Language ${language} is not supported` };
      break;
  }

  self.postMessage(result);
};

async function loadPyodideScript() {
  if (typeof loadPyodide === 'undefined') {
    await import('https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js');
  }
}

export async function runPythonCode(code: string): Promise<RunCodeResult> {
  const result = {
    output: '',
    error: '',
    image: ''
  }
  //if (env.PUBLIC_PYTHON_ENV === 'pyodide') {
    await loadPyodideScript();
    // @ts-ignore - pyodide loaded in codeblock.svelte
    const pyodide = await loadPyodide({
      stdout: (data: string) => result.output += data + '\n',
      stderr: (data: string) => result.error += data + '\n',
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/',
      fullStdLib: false,
      packageCacheDir: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/',
    });
    if (code.includes('matplotlib')) {
      code = `
import base64
import os
import io
os.environ["MPLBACKEND"] = "AGG"
import matplotlib.pyplot

_old_show = matplotlib.pyplot.show
assert _old_show, "matplotlib.pyplot.show"
llama_web_system_img_base64 = None

def show(*, block=None):
	buf = io.BytesIO()
	matplotlib.pyplot.savefig(buf, format="png")
	buf.seek(0)
	global llama_web_system_img_base64
	llama_web_system_img_base64 = base64.b64encode(buf.read()).decode('utf-8')
	matplotlib.pyplot.clf()
	buf.close()
matplotlib.pyplot.show = show\n\n` + code;
    }
    try {
      await pyodide.loadPackagesFromImports(code);
      await pyodide.runPython(code);
      if (pyodide.globals.get('llama_web_system_img_base64')) {
        result.image = pyodide.globals.get('llama_web_system_img_base64');
      }
    } catch (error) {
      console.error(error);
    }
  /*} else {
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
  }*/
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

export {};
