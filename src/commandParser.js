/**
 * Command Parser
 * Parses messages starting with '>' into command structure
 */

class CommandParser {
  /**
   * Parse a message starting with '>'
   * @param {string} message - Raw message text
   * @returns {object|null} - {command, args} or null if not a command
   */
  static parse(message) {
    if (!message.startsWith('>')) {
      return null;
    }

    const trimmed = message.slice(1).trim();
    if (!trimmed) {
      return null;
    }

    const parts = trimmed.split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    return { command, args };
  }
}

module.exports = { CommandParser };
