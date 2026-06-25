const { spawn } = require('child_process');
const path = require('path');

console.log('Starting concurrent development services...');

// Run Vite frontend dev server (using .cmd on Windows)
const isWin = process.platform === 'win32';
const viteCmd = isWin ? 'npx.cmd' : 'npx';
const tsxCmd = isWin ? 'npx.cmd' : 'npx';

const frontend = spawn(viteCmd, ['vite', '--port=3000', '--host=0.0.0.0'], {
  stdio: 'inherit',
  shell: true,
  cwd: path.resolve(__dirname, '..')
});

// Run Express backend server via tsx
const backend = spawn(tsxCmd, ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  shell: true,
  cwd: path.resolve(__dirname, '..')
});

function cleanup() {
  console.log('\nStopping development services...');
  try {
    frontend.kill('SIGINT');
  } catch (e) {}
  try {
    backend.kill('SIGINT');
  } catch (e) {}
  process.exit();
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

frontend.on('close', (code) => {
  console.log(`Frontend process exited with code ${code}`);
  cleanup();
});

backend.on('close', (code) => {
  console.log(`Backend API process exited with code ${code}`);
  cleanup();
});
