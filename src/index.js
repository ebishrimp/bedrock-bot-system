const fs = require('fs');
const path = require('path');
const readline = require('readline');

const { BotManager } = require('./botManager');
const { CommandHandler } = require('./commandHandler');

const configPath = path.resolve(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const botManager = new BotManager(config);
const commandHandler = new CommandHandler(botManager, config.control);

console.log('mcbebot starting with config', JSON.stringify(config.server, null, 2));

// Auto-login bots that should spawn immediately
config.bots.forEach((b) => {
  if (b.autoLogin) {
    try {
      botManager.login(b.name);
    } catch (e) {
      console.error(`autoLogin failed for ${b.name}:`, e.message);
    }
  }
});

// Terminal input for local control
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'mcbebot> '
});

rl.prompt();
rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) {
    rl.prompt();
    return;
  }

  if (trimmed === 'exit' || trimmed === 'quit') {
    console.log('shutting down');
    botManager.list().forEach((b) => botManager.logout(b.name));
    process.exit(0);
  }

  if (trimmed === 'list') {
    console.log(botManager.list());
    rl.prompt();
    return;
  }

  const result = await commandHandler.onChatMessage({ sender: 'console', message: trimmed });
  if (result) console.log(result);

  rl.prompt();
});

rl.on('close', () => {
  console.log('stdin closed; exiting');
  process.exit(0);
});
