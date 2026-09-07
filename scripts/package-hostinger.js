const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const deploy = path.join(root, 'hostinger-deploy-agriheal');
const publicHtml = path.join(deploy, 'public_html');
const zipPath = path.join(deploy, 'nearbin-agriheal.zip');

if (!fs.existsSync(dist)) {
  throw new Error('Missing dist/. Run the web build before packaging.');
}

// Recreate the deploy folder so old hashed bundles cannot be shipped beside
// the current build. This avoids stale mobile clients loading an old script.
fs.rmSync(publicHtml, { recursive: true, force: true });
fs.mkdirSync(publicHtml, { recursive: true });
fs.cpSync(dist, publicHtml, { recursive: true });
fs.rmSync(zipPath, { force: true });

if (process.platform !== 'win32') {
  throw new Error('Hostinger ZIP packaging is currently configured for Windows.');
}

const quote = (value) => `'${value.replace(/'/g, "''")}'`;
const tempZipPath = zipPath + '.tmp';
const command = [
  "$ErrorActionPreference = 'Stop'",
  "Add-Type -AssemblyName System.IO.Compression.FileSystem",
  `if (Test-Path ${quote(tempZipPath)}) { Remove-Item -LiteralPath ${quote(tempZipPath)} -Force }`,
  `[System.IO.Compression.ZipFile]::CreateFromDirectory(${quote(publicHtml)}, ${quote(tempZipPath)}, [System.IO.Compression.CompressionLevel]::Optimal, $false)`,
  `Move-Item -LiteralPath ${quote(tempZipPath)} -Destination ${quote(zipPath)} -Force`,
].join('; ');

// PowerShell archive execution (supports pwsh.exe or built-in powershell.exe)
try {
  execFileSync('pwsh.exe', ['-NoProfile', '-Command', command], { stdio: 'inherit' });
} catch (e) {
  if (e.code === 'ENOENT') {
    execFileSync('powershell.exe', ['-NoProfile', '-Command', command], { stdio: 'inherit' });
  } else {
    throw e;
  }
}

if (!fs.existsSync(zipPath) || fs.statSync(zipPath).size === 0) {
  throw new Error('Hostinger ZIP was not created.');
}

console.log(`[Package] Created ${zipPath} (${fs.statSync(zipPath).size} bytes).`);
