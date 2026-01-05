const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(process.cwd(), 'config.json');

const IDE_PRESETS = {
  vscode: 'code',
  cursor: 'cursor',
  idea: 'idea',
  webstorm: 'webstorm',
  zed: 'zed',
  neovim: 'nvim'
};

const DEFAULT_IDE = 'vscode';

/**
 * Manages application configuration stored in config.json
 */
class ConfigManager {
  constructor() {
    this.config = this._load();
  }

  _load() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        const data = fs.readFileSync(CONFIG_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (err) {
      console.error('Failed to load config:', err.message);
    }
    return {};
  }

  _save() {
    try {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2) + '\n');
    } catch (err) {
      console.error('Failed to save config:', err.message);
    }
  }

  getIde() {
    return this.config.ide || DEFAULT_IDE;
  }

  setIde(value) {
    this.config.ide = value;
    this._save();
  }

  getCustomCommand() {
    return this.config.customIdeCommand || '';
  }

  setCustomCommand(command) {
    this.config.customIdeCommand = command;
    this._save();
  }

  /**
   * Resolves the IDE setting to a command and arguments array
   * @param {string} targetPath - Path to open in the IDE
   * @returns {{ command: string, args: string[] }}
   */
  resolveIdeCommand(targetPath) {
    const ide = this.getIde();

    // Check if it's a preset
    if (IDE_PRESETS[ide]) {
      return { command: IDE_PRESETS[ide], args: [targetPath] };
    }

    // Custom command
    const customCmd = ide === 'custom' ? this.getCustomCommand() : ide;

    if (!customCmd) {
      // Fallback to vscode
      return { command: 'code', args: [targetPath] };
    }

    // Check if command contains {path} placeholder
    if (customCmd.includes('{path}')) {
      const fullCmd = customCmd.replace(/\{path\}/g, targetPath);
      const parts = fullCmd.split(/\s+/);
      return { command: parts[0], args: parts.slice(1) };
    }

    // No placeholder - append path as argument
    const parts = customCmd.split(/\s+/);
    return { command: parts[0], args: [...parts.slice(1), targetPath] };
  }

  /**
   * Get config data for sending to clients
   */
  getClientConfig() {
    return {
      ide: this.getIde(),
      customIdeCommand: this.getCustomCommand(),
      idePresets: Object.keys(IDE_PRESETS)
    };
  }
}

module.exports = { ConfigManager, IDE_PRESETS };
