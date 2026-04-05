const fs = require('fs');
const path = require('path');
const { createClient } = require('bedrock-protocol');
const { CommandParser } = require('./commandParser');
const { CommandRegistry } = require('./commandRegistry');
const { loadCachedAuth, saveAuth, isAuthValid } = require('./auth');

const settingsPath = path.resolve(__dirname, '..', 'settings.json');
const configPath = path.resolve(__dirname, 'config.json');

// Load settings (server info)
if (!fs.existsSync(settingsPath)) {
  console.error('[mcbebot] ERROR: settings.json not found!');
  console.error('[mcbebot] Please copy settings.json.example to settings.json and update server settings.');
  process.exit(1);
}

const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

console.log('[mcbebot] Starting...');
console.log('[mcbebot] Server:', `${settings.server.host}:${settings.server.port}`);

let client = null;
let commandRegistry = null;
let botUsername = null;

async function start() {
  try {
    // Try to load cached auth first
    let authData = loadCachedAuth();
    
    console.log('[mcbebot] Connecting to server...');
    
    const clientOptions = {
      host: settings.server.host,
      port: settings.server.port,
      offline: false  // Enable online mode authentication
    };

    // If we have cached auth, use it; otherwise bedrock-protocol will prompt for auth
    if (authData && isAuthValid(authData)) {
      console.log('[mcbebot] Using cached authentication');
      clientOptions.authTitle = 'Bedrock';
    }

    client = createClient(clientOptions);
    commandRegistry = new CommandRegistry(client);

    client.on('connect', () => {
      console.log('[mcbebot] Connected to server!');
    });

    client.on('spawn', () => {
      // Get bot username from client profile
      botUsername = client.profile?.name || 'Bot';
      console.log(`[mcbebot] Bot spawned! Username: ${botUsername}`);
      
      // Save auth data for future use
      if (client.profile) {
        const authDataToSave = {
          profile: client.profile,
          timestamp: Date.now()
        };
        saveAuth(authDataToSave);
      }
    });

    client.on('text', async (packet) => {
      // Ignore messages from the bot itself
      if (packet.source_name === botUsername) {
        return;
      }

      const message = packet.message;
      console.log(`[CHAT] ${packet.source_name}: ${message}`);

      // Parse command
      const parsed = CommandParser.parse(message);
      if (parsed) {
        console.log(`[COMMAND] Executing: ${parsed.command}`, parsed.args);
        await commandRegistry.execute(parsed.command, parsed.args, packet.source_name);
      }
    });

    client.on('error', (error) => {
      console.error('[mcbebot] Client error:', error);
    });

    client.on('close', () => {
      console.log('[mcbebot] Disconnected from server');
    });

  } catch (error) {
    console.error('[mcbebot] Fatal error:', error);
    process.exit(1);
  }
}

start();
