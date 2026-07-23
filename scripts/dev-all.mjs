import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('Starting J. Worden Platform (Frontend + Backend)...');

// Start backend
const backend = spawn('powershell', ['-ExecutionPolicy', 'Bypass', '-File', 'scripts/dev-backend.ps1'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true
});

// Start frontend
const frontend = spawn('npm', ['run', 'dev:web'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true
});

process.on('SIGINT', () => {
    console.log('\nShutting down Platform...');
    backend.kill();
    frontend.kill();
    process.exit(0);
});
