const fs = require('fs');
const path = require('path');
const { createClient } = require('bedrock-protocol');
const { CommandParser } = require('./commandParser');
const { CommandRegistry } = require('./commandRegistry');
const { authenticate } = require('./auth');

const settingsPath = path.resolve(__dirname, '..', 'settings.json');
const configPath = path.resolve(__dirname, 'config.json');

// Load settings (credentials)
if (!fs.existsSync(settingsPath)) {
  console.error('[mcbebot] ERROR: settings.json not found!');
  console.error('[mcbebot] Please copy settings.json.example to settings.json and fill in your Microsoft account.');
  process.exit(1);
}

const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

console.log('[mcbebot] Starting...');
console.log('[mcbebot] Server:', `${settings.server.host}:${settings.server.port}`);

let client = null;
let commandRegistry = null;

async function start() {
  try {
    // Authenticate with Microsoft
    console.log('[mcbebot] Authenticating...');
    const authData = await authenticate(settings.account.email, settings.account.password);
    
    console.log('[mcbebot] Connecting to server...');
    
    client = createClient({
      host: settings.server.host,
      port: settings.server.port,
      username: authData.username,
      offline: false,
      profile: {
        name: authData.username,
        xuid: '',
        uuid: authData.uuid
      },
      // Use the Minecraft token for authentication
      token: authData.minecraftToken
    });

    commandRegistry = new CommandRegistry(client);

    client.on('connect', () => {
      console.log('[mcbebot] Connected to server!');
    });

    client.on('spawn', () => {
      console.log('[mcbebot] Bot spawned!');
    });

    client.on('text', async (packet) => {
      // Ignore messages from the bot itself
      if (packet.source_name === authData.username) {
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
