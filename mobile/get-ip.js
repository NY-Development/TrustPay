const os = require('os');
const fs = require('fs');
const path = require('path');

function getWifiIP() {
  const interfaces = os.networkInterfaces();
  const wifiInterfaceNames = ['Wireless LAN adapter Wi-Fi', 'Wi-Fi', 'wlan0', 'en0'];
  
  for (const name of wifiInterfaceNames) {
    if (interfaces[name]) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  }

  for (const name of Object.keys(interfaces)) {
    if (name.toLowerCase().includes('wifi') || name.toLowerCase().includes('wlan')) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  }

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const localIP = getWifiIP();
const BACKEND_PORT = '5000'; // Change to match your backend port
const targetKey = 'EXPO_PUBLIC_API_URL';
const targetValue = `http://${localIP}:${BACKEND_PORT}/api/v1`;

const envPath = path.join(__dirname, '.env');
let envLines = [];

// 1. Read existing .env file if it exists
if (fs.existsSync(envPath)) {
  const fileContent = fs.readFileSync(envPath, 'utf8');
  envLines = fileContent.split(/\r?\n/);
}

// 2. Update or insert the key safely
let keyFound = false;
const updatedLines = envLines.map(line => {
  // Check if the line starts with our target key (ignoring spaces)
  if (line.trim().startsWith(`${targetKey}=`)) {
    keyFound = true;
    return `${targetKey}=${targetValue}`;
  }
  return line;
});

if (!keyFound) {
  // If the variable was missing, add it to the bottom
  updatedLines.push(`${targetKey}=${targetValue}`);
}

// 3. Write back to .env file preserving all other variables
fs.writeFileSync(envPath, updatedLines.join('\n'), 'utf8');
console.log(`📡 Dynamic IP updated in .env ➡️ ${targetKey}=${targetValue}`);
