const {spawn, execSync, exec} = require('child_process');

const port = process.env.PORT || 3000;
const url = `http://localhost:${port}`;

// Kill existing process on port
try {
  const pid = execSync(`lsof -ti :${port}`).toString().trim();
  if (pid) {
    console.log(`🔪 Killing process on port ${port} (PID: ${pid})`);
    execSync(`kill -9 ${pid}`);
  }
} catch (error) {
  // console.log(`✅ No existing process found on port ${port}`);
}

// Start Next.js
console.log(`🚀 Starting Next.js...`);
const nextProcess = spawn('next', ['dev'], {stdio: 'inherit', shell: true});
// const nextProcess = spawn('next', ['start'], {stdio: 'inherit', shell: true});


setTimeout(() => {
  const openCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';

  exec(`${openCmd} ${url}`);
}, 2000);

// Keep Next.js process running
nextProcess.on('close', (code) => {
  console.log(`⚡ Next.js exited with code ${code}`);
  process.exit(code);
});

process.on('SIGINT', () => {
  console.log('🛑 Stopping Next.js...');
  nextProcess.kill('SIGINT');
  process.exit();
});
