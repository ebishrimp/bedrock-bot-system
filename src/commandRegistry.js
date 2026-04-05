/**
 * Command Registry
 * Registers and executes commands
 */

class CommandRegistry {
  constructor(botClient) {
    this.botClient = botClient;
    this.commands = {};
    this.setupDefaultCommands();
  }

  /**
   * Register a command
   * @param {string} name - Command name
   * @param {function} handler - Async function that handles the command
   */
  register(name, handler) {
    this.commands[name] = handler;
  }

  /**
   * Execute a command
   * @param {string} command - Command name
   * @param {array} args - Command arguments
   * @param {string} sender - Player who sent the command
   */
  async execute(command, args, sender) {
    const handler = this.commands[command];
    if (!handler) {
      await this.respondToPlayer(`Unknown command: ${command}`);
      return;
    }

    try {
      await handler(args, sender);
    } catch (error) {
      console.error(`Command execution error for '${command}':`, error);
      await this.respondToPlayer(`Error executing command: ${error.message}`);
    }
  }

  /**
   * Send a response message to the game via chat
   * @param {string} message - Message to send
   */
  async respondToPlayer(message) {
    if (this.botClient) {
      try {
        // Use system message type for bot responses (like server messages)
        this.botClient.queue('text', {
          type: 'system',
          message: message
        });
      } catch (error) {
        console.error('[respondToPlayer] Failed to send message:', error);
      }
    }
  }

  /**
   * Setup default commands
   */
  setupDefaultCommands() {
    // Hello command - simple test
    this.register('hello', async (args, sender) => {
      await this.respondToPlayer('hello!');
    });
  }
}

module.exports = { CommandRegistry };
