import { App, PluginSettingTab, Setting } from 'obsidian';
import ObsidianScribePlugin from './main';

export interface ScribeSettings {
    apiKey: string;
    provider: 'openai' | 'groq' | 'gemini' | 'custom';
    baseUrl: string;
    model: string;
    enablePostProcessing: boolean;
    userSpeakerLabel: string;
}

export const DEFAULT_SETTINGS: ScribeSettings = {
    apiKey: '',
    provider: 'gemini',
    baseUrl: '',
    model: '',
    enablePostProcessing: true,
    userSpeakerLabel: 'Me',
}

export class ScribeSettingTab extends PluginSettingTab {
    plugin: ObsidianScribePlugin;

    constructor(app: App, plugin: ObsidianScribePlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl('h2', { text: 'Obsidian Scribe Settings' });

        new Setting(containerEl)
            .setName('Transcription Provider')
            .setDesc('Choose the AI provider for transcription.')
            .addDropdown(dropdown => dropdown
                .addOption('openai', 'OpenAI')
                .addOption('groq', 'Groq')
                .addOption('gemini', 'Gemini')
                .addOption('custom', 'Custom / Local')
                .setValue(this.plugin.settings.provider)
                .onChange(async (value) => {
                    this.plugin.settings.provider = value as 'openai' | 'groq' | 'gemini' | 'custom';
                    this.display(); // Refresh to show/hide relevant fields
                    await this.plugin.saveSettings();
                }));

        if (this.plugin.settings.provider === 'custom') {
            new Setting(containerEl)
                .setName('Base URL')
                .setDesc('The base URL for the custom provider (e.g., http://localhost:8000/v1).')
                .addText(text => text
                    .setPlaceholder('http://localhost:8000/v1')
                    .setValue(this.plugin.settings.baseUrl)
                    .onChange(async (value) => {
                        this.plugin.settings.baseUrl = value;
                        await this.plugin.saveSettings();
                    }));

            new Setting(containerEl)
                .setName('Model ID')
                .setDesc('The model ID to use (e.g., whisper-1).')
                .addText(text => text
                    .setPlaceholder('whisper-1')
                    .setValue(this.plugin.settings.model)
                    .onChange(async (value) => {
                        this.plugin.settings.model = value;
                        await this.plugin.saveSettings();
                    }));
        }

        new Setting(containerEl)
            .setName('API Key')
            .setDesc('Enter your API key for the selected provider.')
            .addText(text => text
                .setPlaceholder('Enter your secret key')
                .setValue(this.plugin.settings.apiKey)
                .onChange(async (value) => {
                    this.plugin.settings.apiKey = value;
                    await this.plugin.saveSettings();
                }));

        containerEl.createEl('h3', { text: 'Post-Processing' });

        new Setting(containerEl)
            .setName('Enable Post-Processing')
            .setDesc('Add speaker labels, summary, and action items to transcriptions.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enablePostProcessing)
                .onChange(async (value) => {
                    this.plugin.settings.enablePostProcessing = value;
                    this.display();
                    await this.plugin.saveSettings();
                }));

        if (this.plugin.settings.enablePostProcessing) {
            new Setting(containerEl)
                .setName('Your Speaker Label')
                .setDesc('How you want to be identified in transcripts (e.g., "Me", your name).')
                .addText(text => text
                    .setPlaceholder('Me')
                    .setValue(this.plugin.settings.userSpeakerLabel)
                    .onChange(async (value) => {
                        this.plugin.settings.userSpeakerLabel = value;
                        await this.plugin.saveSettings();
                    }));
        }
    }
}
