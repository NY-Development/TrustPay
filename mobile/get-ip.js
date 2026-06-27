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

// Define target file paths
const envPath = path.join(__dirname, '.env');
const envPathDev = path.join(__dirname, '.env.development');

/**
 * Updates or appends a key-value pair in a specific env file
 * @param {string} filePath - Absolute path to the env file
 * @param {string} key - Environment variable name
 * @param {string} value - Environment variable value
 */
function updateEnvFile(filePath, key, value) {
  let envLines = [];

  // 1. Read existing file if it exists
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    envLines = fileContent.split(/\r?\n/);
  }

  // 2. Update or insert the key safely
  let keyFound = false;
  const updatedLines = envLines.map(line => {
    if (line.trim().startsWith(`${key}=`)) {
      keyFound = true;
      return `${key}=${value}`;
    }
    return line;
  });

  if (!keyFound) {
    updatedLines.push(`${key}=${value}`);
  }

  // 3. Write back to file preserving all other variables
  fs.writeFileSync(filePath, updatedLines.join('\n'), 'utf8');
  
  // Print friendly log showing which file was modified
  const fileName = path.basename(filePath);
  console.log(`📡 Dynamic IP updated in ${fileName} ➡️ ${key}=${value}`);
}

// Execute the update for both files
updateEnvFile(envPath, targetKey, targetValue);
updateEnvFile(envPathDev, targetKey, targetValue);