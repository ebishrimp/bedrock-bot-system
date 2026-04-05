const fs = require('fs');
const path = require('path');
const { createClient } = require('bedrock-protocol');
const { CommandParser } = require('./commandParser');
const { CommandRegistry } = require('./commandRegistry');

const configPath = path.resolve(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

console.log('[mcbebot] Starting...');
console.log('[mcbebot] Config:', JSON.stringify(config.server, null, 2));

let client = null;
let commandRegistry = null;

async function connectBot() {
  try {
    console.log('[mcbebot] Connecting to server...');
    
    client = createClient(config.server);
    commandRegistry = new CommandRegistry(client);

    client.on('connect', () => {
      console.log('[mcbebot] Connected to server!');
    });

    client.on('spawn', () => {
      console.log('[mcbebot] Bot spawned!');
    });

    client.on('text', async (packet) => {
      // Ignore messages from the bot itself
      if (packet.source_name === config.botName) {
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
    console.error('[mcbebot] Connection failed:', error);
    process.exit(1);
  }
}

connectBot();
