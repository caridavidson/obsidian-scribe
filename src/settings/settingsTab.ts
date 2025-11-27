import { App, PluginSettingTab, Setting } from "obsidian";
import type ObsidianScribePlugin from "../main";

export class ScribeSettingTab extends PluginSettingTab {
  plugin: ObsidianScribePlugin;

  constructor(app: App, plugin: ObsidianScribePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl("h2", { text: "Obsidian Scribe Settings" });

    new Setting(containerEl)
      .setName("Transcription Provider")
      .setDesc("Choose the AI provider for transcription.")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("openai", "OpenAI")
          .addOption("groq", "Groq")
          .addOption("gemini", "Gemini")
          .addOption("custom", "Custom / Local")
          .setValue(this.plugin.settings.provider)
          .onChange(async (value) => {
            this.plugin.settings.provider = value as
              | "openai"
              | "groq"
              | "gemini"
              | "custom";
            this.display(); // Refresh to show/hide relevant fields
            await this.plugin.saveSettings();
          }),
      );

    if (this.plugin.settings.provider === "custom") {
      new Setting(containerEl)
        .setName("Base URL")
        .setDesc(
          "The base URL for the custom provider (e.g., http://localhost:8000/v1).",
        )
        .addText((text) =>
          text
            .setPlaceholder("http://localhost:8000/v1")
            .setValue(this.plugin.settings.baseUrl)
            .onChange(async (value) => {
              this.plugin.settings.baseUrl = value;
              await this.plugin.saveSettings();
            }),
        );

      new Setting(containerEl)
        .setName("Model ID")
        .setDesc("The model ID to use (e.g., whisper-1).")
        .addText((text) =>
          text
            .setPlaceholder("whisper-1")
            .setValue(this.plugin.settings.model)
            .onChange(async (value) => {
              this.plugin.settings.model = value;
              await this.plugin.saveSettings();
            }),
        );
    }

    new Setting(containerEl)
      .setName("API Key")
      .setDesc("Enter your API key for the selected provider.")
      .addText((text) =>
        text
          .setPlaceholder("Enter your secret key")
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.apiKey = value;
            await this.plugin.saveSettings();
          }),
      );

    containerEl.createEl("h3", { text: "Post-Processing" });

    new Setting(containerEl)
      .setName("Enable Post-Processing")
      .setDesc(
        "Add speaker labels, summary, and action items to transcriptions.",
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enablePostProcessing)
          .onChange(async (value) => {
            this.plugin.settings.enablePostProcessing = value;
            this.display();
            await this.plugin.saveSettings();
          }),
      );

    if (this.plugin.settings.enablePostProcessing) {
      new Setting(containerEl)
        .setName("Your Speaker Label")
        .setDesc(
          'How you want to be identified in transcripts (e.g., "Me", your name).',
        )
        .addText((text) =>
          text
            .setPlaceholder("Me")
            .setValue(this.plugin.settings.userSpeakerLabel)
            .onChange(async (value) => {
              this.plugin.settings.userSpeakerLabel = value;
              await this.plugin.saveSettings();
            }),
        );
    }

    containerEl.createEl("h3", { text: "Storage & Organization" });

    new Setting(containerEl)
      .setName("Transcription Folder")
      .setDesc("Folder where transcriptions will be saved.")
      .addText((text) =>
        text
          .setPlaceholder("scribed")
          .setValue(this.plugin.settings.transcriptionFolder)
          .onChange(async (value) => {
            this.plugin.settings.transcriptionFolder = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Folder Timestamp Format")
      .setDesc(
        "Moment.js format for folder timestamps (e.g., YYYY-MM-DD HHmm).",
      )
      .addText((text) =>
        text
          .setPlaceholder("YYYY-MM-DD HHmm")
          .setValue(this.plugin.settings.folderTimestampFormat)
          .onChange(async (value) => {
            this.plugin.settings.folderTimestampFormat = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Audio Filename")
      .setDesc("Name for the audio file.")
      .addText((text) =>
        text
          .setPlaceholder("recording.webm")
          .setValue(this.plugin.settings.audioFilename)
          .onChange(async (value) => {
            this.plugin.settings.audioFilename = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Transcription Filename")
      .setDesc("Name for the transcription markdown file.")
      .addText((text) =>
        text
          .setPlaceholder("transcription.md")
          .setValue(this.plugin.settings.transcriptionFilename)
          .onChange(async (value) => {
            this.plugin.settings.transcriptionFilename = value;
            await this.plugin.saveSettings();
          }),
      );

    containerEl.createEl("h3", { text: "Daily Note Integration" });

    new Setting(containerEl)
      .setName("Link to Daily Note")
      .setDesc("Automatically add a link to your daily note.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.dailyNoteLinking)
          .onChange(async (value) => {
            this.plugin.settings.dailyNoteLinking = value;
            this.display();
            await this.plugin.saveSettings();
          }),
      );

    if (this.plugin.settings.dailyNoteLinking) {
      new Setting(containerEl)
        .setName("Daily Note Section")
        .setDesc("Section heading where links will be added.")
        .addText((text) =>
          text
            .setPlaceholder("## Meetings")
            .setValue(this.plugin.settings.dailyNoteSection)
            .onChange(async (value) => {
              this.plugin.settings.dailyNoteSection = value;
              await this.plugin.saveSettings();
            }),
        );

      new Setting(containerEl)
        .setName("Link Format")
        .setDesc(
          "Format for the link. Use {path} for file path, {time} for timestamp.",
        )
        .addText((text) =>
          text
            .setPlaceholder("- [[{path}|Transcription {time}]]")
            .setValue(this.plugin.settings.linkFormat)
            .onChange(async (value) => {
              this.plugin.settings.linkFormat = value;
              await this.plugin.saveSettings();
            }),
        );

      new Setting(containerEl)
        .setName("Link Timestamp Format")
        .setDesc("Moment.js format for the {time} placeholder.")
        .addText((text) =>
          text
            .setPlaceholder("HH:mm")
            .setValue(this.plugin.settings.linkTimestampFormat)
            .onChange(async (value) => {
              this.plugin.settings.linkTimestampFormat = value;
              await this.plugin.saveSettings();
            }),
        );
    }

    containerEl.createEl("h3", { text: "Behavior" });

    new Setting(containerEl)
      .setName("Auto-open Transcription")
      .setDesc("Automatically open the transcription file after completion.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoOpenTranscription)
          .onChange(async (value) => {
            this.plugin.settings.autoOpenTranscription = value;
            await this.plugin.saveSettings();
          }),
      );

  }
}
