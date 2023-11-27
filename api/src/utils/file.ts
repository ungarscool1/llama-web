import { spawn, spawnSync, ChildProcessWithoutNullStreams } from 'child_process';

export default {
  /**
   * Download async a file from a URL
   * @param url file URL
   * @param path save path
   */
  download: (url: string, path: string): Promise<void> => {
    const args = ['-L', '-o', path, url];
    return new Promise((resolve, reject) => {
      const child = spawn('curl', args);
      child.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject();
        }
      });
    });
  },
  /**
   * Download a file from a URL
   * @param url file URL
   * @param path save path
   */
  downloadSync: (url: string, path: string): void => {
    // follow redirections
    const args = ['-L', '-o', path, url];
    const child = spawnSync('curl', args);
    if (child.status !== 0) {
      throw new Error(child.stderr.toString());
    }
  },
  /**
   * Download a file from a URL
   * @param url file URL
   * @param path save path
   */
  delete: (path: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const child = spawn('rm', [path]);
      child.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject();
        }
      });
    });
  }
}
