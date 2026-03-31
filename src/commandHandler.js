const colors = require('colors');

class CommandHandler {
  constructor(botManager, controlSettings) {
    this.botManager = botManager;
    this.prefix = controlSettings.commandPrefix || '!bot';
    this.allowedPlayers = new Set(controlSettings.allowedPlayers || []);
  }

  isAuthorized(senderName) {
    if (this.allowedPlayers.size === 0) return true;
    return this.allowedPlayers.has(senderName);
  }

  async onChatMessage({ sender, message }) {
    if (!message.startsWith(this.prefix)) return null;

    if (!this.isAuthorized(sender)) {
      return `Unauthorized: ${sender}`;
    }

    const args = message.slice(this.prefix.length).trim().split(/\s+/);
    const cmd = args.shift();

    try {
      switch (cmd) {
        case 'login': {
          const name = args[0];
          if (!name) return 'Usage: !bot login <name>';
          this.botManager.login(name);
          return `Bot ${name} login requested`;
        }

        case 'logout': {
          const name = args[0];
          if (!name) return 'Usage: !bot logout <name>';
          this.botManager.logout(name);
          return `Bot ${name} logout requested`;
        }

        case 'create': {
          const name = args[0];
          if (!name) return 'Usage: !bot create <name> [x y z]';
          const [x, y, z] = args.slice(1).map(Number);
          const pos = Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)
            ? { x, y, z }
            : undefined;
          this.botManager.createBot({ name, initialPosition: pos });
          return `Bot ${name} created`;
        }

        case 'teleport':
        case 'tp': {
          const [name, x, y, z] = args;
          if (!name || x === undefined || y === undefined || z === undefined) {
            return 'Usage: !bot tp <name> <x> <y> <z>';
          }
          this.botManager.teleport(name, Number(x), Number(y), Number(z));
          return `Bot ${name} teleported to ${x},${y},${z}`;
        }

        case 'list': {
          const list = this.botManager.list().map((b) => `${b.name}: ${b.connected ? 'online' : 'offline'} @ ${b.position.x},${b.position.y},${b.position.z}`);
          return ['Bot list:', ...list].join('\n');
        }

        case 'command': {
          const name = args.shift();
          if (!name || args.length === 0) return 'Usage: !bot command <name> <server command>';
          const command = args.join(' ');
          this.botManager.sendCommand(name, command);
          return `Bot ${name} sent command: ${command}`;
        }

        default:
          return `Unknown command: ${cmd}`;
      }
    } catch (err) {
      console.error(colors.red('command error'), err);
      return `Error: ${err.message}`;
    }
  }
}

module.exports = {
  CommandHandler
};
