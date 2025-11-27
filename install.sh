#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: ./install.sh <path-to-your-obsidian-vault>"
    echo "Example: ./install.sh ~/Documents/MyVault"
    exit 1
fi

VAULT_PATH="$1"
PLUGIN_DIR="$VAULT_PATH/.obsidian/plugins/obsidian-scribe"

if [ ! -d "$VAULT_PATH/.obsidian/plugins" ]; then
    echo "Error: Could not find .obsidian/plugins directory in $VAULT_PATH"
    echo "Are you sure this is an Obsidian vault?"
    exit 1
fi

echo "Installing Obsidian Scribe to $PLUGIN_DIR..."
mkdir -p "$PLUGIN_DIR"
cp main.js manifest.json styles.css "$PLUGIN_DIR/" 2>/dev/null || cp main.js manifest.json "$PLUGIN_DIR/"

echo "Done! Please reload Obsidian and enable the plugin in Settings > Community Plugins."
