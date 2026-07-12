import http from 'http';
import url from 'url';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const getEnv = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : process.env[key];
};

const CLIENT_ID = getEnv('GOOGLE_PHOTOS_CLIENT_ID');
const CLIENT_SECRET = getEnv('GOOGLE_PHOTOS_CLIENT_SECRET');
const REDIRECT_URI = 'http://127.0.0.1:3000'; // Desktop apps allow this by default
const SCOPES = 'https://www.googleapis.com/auth/photoslibrary.readonly';

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
  `client_id=${CLIENT_ID}&` +
  `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
  `response_type=code&` +
  `scope=${encodeURIComponent(SCOPES)}&` +
  `access_type=offline&` +
  `prompt=consent`;

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  if (parsedUrl.pathname === '/') {
    const code = parsedUrl.query.code;
    
    if (code) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h1>Authorization successful! I have secured the token. You can close this window.</h1><script>setTimeout(() => window.close(), 3000);</script>');
      
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code'
        })
      });
      
      const tokenData = await tokenResponse.json();
      
      if (tokenData.access_token) {
        let newEnv = envContent;
        if (newEnv.includes('GOOGLE_PHOTOS_ACCESS_TOKEN=')) {
          newEnv = newEnv.replace(/^GOOGLE_PHOTOS_ACCESS_TOKEN=.*$/m, `GOOGLE_PHOTOS_ACCESS_TOKEN=${tokenData.access_token}`);
        } else {
          newEnv += `\nGOOGLE_PHOTOS_ACCESS_TOKEN=${tokenData.access_token}\n`;
        }
        
        fs.writeFileSync(envPath, newEnv.trim() + '\n');
        console.log("SUCCESS_TOKEN_SAVED");
        server.close();
        process.exit(0);
      } else {
        console.error("TOKEN_ERROR");
        server.close();
        process.exit(1);
      }
    }
  }
});

server.listen(3000, '127.0.0.1', () => {
  exec(`start "" "${authUrl.replace(/&/g, '^&')}"`, (err) => {});
});
