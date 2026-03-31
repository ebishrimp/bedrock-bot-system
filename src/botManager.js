const { createClient } = require('bedrock-protocol');
const colors = require('colors');

class BotInstance {
  constructor({ name, server, initialPosition }) {
    this.name = name;
    this.server = server;
    this.initialPosition = initialPosition;
    this.client = null;
    this.connected = false;
    this.position = { ...initialPosition };
  }

  connect() {
    if (this.connected) return;

    const options = {
      host: this.server.host,
      port: this.server.port,
      username: this.name,
      offline: !this.server.onlineMode,
      auth: this.server.onlineMode ? 'microsoft' : 'offline',
      keepAlive: true,
      // add xuid/identity information here if required by server
    };

    this.client = createClient(options);

    this.client.on('connect', () => {
      this.connected = true;
      console.log(colors.green(`[Bot:${this.name}] connected`));
      this.teleport(this.initialPosition);
    });

    this.client.on('close', () => {
      this.connected = false;
      console.log(colors.yellow(`[Bot:${this.name}] disconnected`));
    });

    this.client.on('packet', (buffer) => {
      // for debugging
    });

    this.client.on('text', (packet) => {
      // ここにコントロール用のチャット監視（オプション）を追加できる
      // console.log(`[Bot:${this.name}] chat=` + packet.message);
    });

    this.client.on('spawn', () => {
      this.connected = true;
      console.log(colors.green(`[Bot:${this.name}] spawned`));
    });

    this.client.on('error', (err) => {
      console.error(colors.red(`[Bot:${this.name}] error:`), err);
    });

    return this.client;
  }

  disconnect() {
    if (!this.client) return;
    this.client.close();
    this.client = null;
    this.connected = false;
    console.log(colors.gray(`[Bot:${this.name}] logout`));
  }

  teleport({ x, y, z }) {
    this.position = { x, y, z };

    if (!this.client || !this.connected) {
      console.log(colors.yellow(`[Bot:${this.name}] teleport queued until connect (${x},${y},${z})`));
      return;
    }

    try {
      this.client.write('movePlayer', {
        entityRuntimeId: 1,
        position: { x, y, z },
        rotation: { x: 0, y: 0 },
        onGround: true
      });
      console.log(colors.cyan(`[Bot:${this.name}] teleport to ${x},${y},${z}`));
    } catch (e) {
      console.error(colors.red(`[Bot:${this.name}] teleport failed:`), e);
    }
  }

  sendCommand(command) {
    if (!this.client || !this.connected) {
      throw new Error(`Bot ${this.name} is not connected`);
    }

    this.client.write('commandRequest', {
      command: command,
      origin: {
        type: 1,
        uuid: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        requestId: 1,
        x: this.position.x,
        y: this.position.y,
        z: this.position.z
      },
      version: 1
    });
  }
}

class BotManager {
  constructor(config) {
    this.server = config.server;
    this.bots = new Map();

    (config.bots || []).forEach((botCfg) => {
      const bot = new BotInstance({
        name: botCfg.name,
        server: this.server,
        initialPosition: botCfg.initialPosition || { x: 0, y: 4, z: 0 }
      });
      this.bots.set(botCfg.name, bot);
    });
  }

  list() {
    const status = [];
    this.bots.forEach((bot, name) => {
      status.push({
        name,
        connected: bot.connected,
        position: bot.position
      });
    });
    return status;
  }

  createBot({ name, initialPosition }) {
    if (this.bots.has(name)) throw new Error(`Bot ${name} already exists`);
    const newBot = new BotInstance({
      name,
      server: this.server,
      initialPosition: initialPosition || { x: 0, y: 4, z: 0 }
    });
    this.bots.set(name, newBot);
    return newBot;
  }

  login(name) {
    const bot = this.bots.get(name);
    if (!bot) throw new Error(`Bot ${name} not found`);
    return bot.connect();
  }

  logout(name) {
    const bot = this.bots.get(name);
    if (!bot) throw new Error(`Bot ${name} not found`);
    bot.disconnect();
  }

  teleport(name, x, y, z) {
    const bot = this.bots.get(name);
    if (!bot) throw new Error(`Bot ${name} not found`);
    bot.teleport({ x, y, z });
  }

  setPosition(name, x, y, z) {
    this.teleport(name, x, y, z);
  }

  sendCommand(name, command) {
    const bot = this.bots.get(name);
    if (!bot) throw new Error(`Bot ${name} not found`);
    bot.sendCommand(command);
  }
}

module.exports = {
  BotManager
};
