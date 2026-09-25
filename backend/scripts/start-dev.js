const { spawn } = require('child_process');

const apps = ['gateway', 'employee', 'attendance', 'logger'];

for (const app of apps) {
  const child = spawn('npx', ['nest', 'start', app, '--watch'], {
    stdio: 'inherit',
    shell: true,
    cwd: require('path').join(__dirname, '..'),
  });

  child.on('exit', (code) => {
    console.error(`${app} exited with code ${code ?? 0}`);
    process.exit(code ?? 1);
  });
}
