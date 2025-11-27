import {
  Notice,
  Plugin,
  setIcon,
  TFile,
  moment,
  WorkspaceLeaf,
} from "obsidian";
import { ScribeSettings, DEFAULT_SETTINGS } from "./settings/settings";
import { ScribeSettingTab } from "./settings/settingsTab";
import { AudioRecorder } from "./services/recorder";
import { transcribeAudio } from "./services/transcription";
import { RecordingModal } from "./ui/recordingModal";

import { appendToDailyNote } from "./utils/dailyNote";

export default class ObsidianScribePlugin extends Plugin {
  settings: ScribeSettings;
  recorder: AudioRecorder;
  statusBarItem: HTMLElement;
  ribbonIconEl: HTMLElement;
  transcriptionFile: TFile | null = null;

  async onload() {
    await this.loadSettings();

    this.recorder = new AudioRecorder();
    this.statusBarItem = this.addStatusBarItem();
    this.updateStatusBar();

    // Ribbon Icon
    this.ribbonIconEl = this.addRibbonIcon(
      "feather",
      "Start Recording",
      (evt: MouseEvent) => {
        this.startRecording();
      },
    );

    // Command
    this.addCommand({
      id: "start-recording",
      name: "Start Recording",
      callback: () => {
        this.startRecording();
      },
      hotkeys: [{ modifiers: ["Mod", "Shift"], key: "R" }],
    });

    // Settings Tab
    this.addSettingTab(new ScribeSettingTab(this.app, this));
  }

  onunload() {
    if (this.recorder.isRecording()) {
      this.recorder.stopRecording();
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async startRecording() {
    try {
      await this.recorder.startRecording();
      new RecordingModal(this.app, this).open();
      setIcon(this.ribbonIconEl, "square");
      this.ribbonIconEl.setAttribute("aria-label", "Stop Recording");
      this.updateStatusBar();
    } catch (error) {
      new Notice("Failed to start recording: " + error.message);
    }
  }

  async stopRecordingAndTranscribe() {

    try {
      new Notice("Stopping recording... Finalizing transcription...");
      setIcon(this.ribbonIconEl, "feather");
      this.ribbonIconEl.setAttribute("aria-label", "Start Recording");
      this.updateStatusBar();

      // Get the full audio blob for saving
      const audioBlob = await this.recorder.stopRecording();

      const text = await transcribeAudio(
        audioBlob,
        this.settings.apiKey,
        this.settings.provider,
        this.settings.baseUrl,
        this.settings.model,
        this.settings.enablePostProcessing,
        this.settings.userSpeakerLabel,
      );
      await this.handleTranscriptionResult(text, audioBlob);
      new Notice("Transcription complete!");

    } catch (error) {
      new Notice("Transcription failed: " + error.message);
      console.error(error);
    } finally {
      this.transcriptionFile = null;
      this.updateStatusBar();
    }
  }

  async handleTranscriptionResult(text: string, audioBlob: Blob) {
    const timestamp = moment().format(this.settings.folderTimestampFormat);
    const folderName = `${this.settings.transcriptionFolder}/${timestamp}`;

    // 1. Create Folder
    if (
      !this.app.vault.getAbstractFileByPath(this.settings.transcriptionFolder)
    ) {
      await this.app.vault.createFolder(this.settings.transcriptionFolder);
    }
    if (!this.app.vault.getAbstractFileByPath(folderName)) {
      await this.app.vault.createFolder(folderName);
    }

    // 2. Save Audio File
    const audioFileName = `${folderName}/${this.settings.audioFilename}`;
    const arrayBuffer = await audioBlob.arrayBuffer();
    await this.app.vault.createBinary(audioFileName, arrayBuffer);

    // 3. Create Transcription Note
    const noteFileName = `${folderName}/${this.settings.transcriptionFilename}`;
    const noteContent = `# Transcription ${timestamp}\n\n![[${this.settings.audioFilename}]]\n\n${text}`;

    let file = this.app.vault.getAbstractFileByPath(noteFileName);
    if (!file) {
      file = await this.app.vault.create(noteFileName, noteContent);
    }

    // 4. Link to Daily Note (if enabled)
    if (this.settings.dailyNoteLinking) {
      await appendToDailyNote(this.app, file as TFile, this.settings);
    }

    // 5. Open the new note (if enabled)
    if (this.settings.autoOpenTranscription) {
      this.app.workspace.getLeaf(false).openFile(file as TFile);
    }
  }

  updateStatusBar() {
    if (this.recorder && this.recorder.isRecording()) {
      this.statusBarItem.setText("🔴 Recording...");
      this.statusBarItem.addClass("mod-error");
    } else {
      this.statusBarItem.setText("");
      this.statusBarItem.removeClass("mod-error");
    }
  }
}
