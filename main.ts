import { Editor, MarkdownView, Notice, Plugin, setIcon, Modal, App, TFile, moment, normalizePath } from 'obsidian';
import { ScribeSettings, DEFAULT_SETTINGS, ScribeSettingTab } from './settings';
import { AudioRecorder } from './recorder';
import { transcribeAudio } from './transcription';

export default class ObsidianScribePlugin extends Plugin {
    settings: ScribeSettings;
    recorder: AudioRecorder;
    statusBarItem: HTMLElement;
    ribbonIconEl: HTMLElement;

    async onload() {
        await this.loadSettings();

        this.recorder = new AudioRecorder();
        this.statusBarItem = this.addStatusBarItem();
        this.updateStatusBar();

        // Ribbon Icon
        this.ribbonIconEl = this.addRibbonIcon('feather', 'Start Recording', (evt: MouseEvent) => {
            this.startRecording();
        });

        // Command
        this.addCommand({
            id: 'start-recording',
            name: 'Start Recording',
            callback: () => {
                this.startRecording();
            },
            hotkeys: [{ modifiers: ["Mod", "Shift"], key: "R" }]
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
            setIcon(this.ribbonIconEl, 'square');
            this.ribbonIconEl.setAttribute('aria-label', 'Stop Recording');
            this.updateStatusBar();
        } catch (error) {
            new Notice('Failed to start recording: ' + error.message);
        }
    }

    async stopRecordingAndTranscribe() {
        try {
            new Notice('Stopping recording... Transcribing...');
            setIcon(this.ribbonIconEl, 'feather');
            this.ribbonIconEl.setAttribute('aria-label', 'Start Recording');
            this.updateStatusBar();

            const audioBlob = await this.recorder.stopRecording();
            const text = await transcribeAudio(
                audioBlob,
                this.settings.apiKey,
                this.settings.provider,
                this.settings.baseUrl,
                this.settings.model,
                this.settings.enablePostProcessing,
                this.settings.userSpeakerLabel
            );

            await this.handleTranscriptionResult(text, audioBlob);
            new Notice('Transcription complete!');
        } catch (error) {
            new Notice('Transcription failed: ' + error.message);
            console.error(error);
        } finally {
            this.updateStatusBar();
        }
    }

    async handleTranscriptionResult(text: string, audioBlob: Blob) {
        const timestamp = moment().format('YYYY-MM-DD HHmm');
        const folderName = `scribed/${timestamp}`;

        // 1. Create Folder
        if (!this.app.vault.getAbstractFileByPath('scribed')) {
            await this.app.vault.createFolder('scribed');
        }
        if (!this.app.vault.getAbstractFileByPath(folderName)) {
            await this.app.vault.createFolder(folderName);
        }

        // 2. Save Audio File
        const audioFileName = `${folderName}/recording.webm`;
        const arrayBuffer = await audioBlob.arrayBuffer();
        await this.app.vault.createBinary(audioFileName, arrayBuffer);

        // 3. Create Transcription Note
        const noteFileName = `${folderName}/transcription.md`;
        const noteContent = `# Transcription ${timestamp}\n\n![[recording.webm]]\n\n${text}`;

        let file = this.app.vault.getAbstractFileByPath(noteFileName);
        if (!file) {
            file = await this.app.vault.create(noteFileName, noteContent);
        }

        // 4. Link to Daily Note
        await this.appendToDailyNote(file as TFile);

        // 5. Open the new note
        this.app.workspace.getLeaf(false).openFile(file as TFile);
    }

    async appendToDailyNote(transcriptionFile: TFile) {
        const dailyNoteSettings = this.getDailyNoteSettings();
        const date = moment();
        const dailyNoteFileName = date.format(dailyNoteSettings.format) + '.md';
        const dailyNotePath = normalizePath(dailyNoteSettings.folder + '/' + dailyNoteFileName);

        let dailyNote = this.app.vault.getAbstractFileByPath(dailyNotePath);

        if (!dailyNote) {
            // If the folder doesn't exist, create it
            if (dailyNoteSettings.folder && !this.app.vault.getAbstractFileByPath(dailyNoteSettings.folder)) {
                await this.app.vault.createFolder(dailyNoteSettings.folder);
            }
            dailyNote = await this.app.vault.create(dailyNotePath, '');
        }

        if (dailyNote instanceof TFile) {
            const content = await this.app.vault.read(dailyNote);
            const link = `- [[${transcriptionFile.path}|Transcription ${moment().format('HH:mm')}]]`;

            if (content.includes('## Meetings')) {
                // Append to existing section
                const lines = content.split('\n');
                const meetingsIndex = lines.findIndex(line => line.trim() === '## Meetings');

                // Find end of section (next header or end of file)
                let insertIndex = meetingsIndex + 1;
                while (insertIndex < lines.length && !lines[insertIndex].startsWith('#')) {
                    insertIndex++;
                }

                // Insert before the next header
                lines.splice(insertIndex, 0, link);
                await this.app.vault.modify(dailyNote, lines.join('\n'));
            } else {
                // Create section at the end
                const newContent = content + `\n\n## Meetings\n${link}`;
                await this.app.vault.modify(dailyNote, newContent);
            }

            new Notice(`Linked to daily note: ${dailyNote.basename}`);
        }
    }

    getDailyNoteSettings() {
        try {
            // @ts-ignore
            const dailyNotesPlugin = this.app.internalPlugins.getPluginById("daily-notes");
            if (dailyNotesPlugin && dailyNotesPlugin.enabled) {
                return {
                    format: dailyNotesPlugin.instance.options.format || "YYYY-MM-DD",
                    folder: dailyNotesPlugin.instance.options.folder || ".",
                };
            }
        } catch (err) {
            console.info("Daily Notes plugin not found or not enabled", err);
        }
        return {
            format: "YYYY-MM-DD",
            folder: ".",
        };
    }

    updateStatusBar() {
        if (this.recorder && this.recorder.isRecording()) {
            this.statusBarItem.setText('🔴 Recording...');
            this.statusBarItem.addClass('mod-error');
        } else {
            this.statusBarItem.setText('');
            this.statusBarItem.removeClass('mod-error');
        }
    }
}

class RecordingModal extends Modal {
    plugin: ObsidianScribePlugin;

    constructor(app: App, plugin: ObsidianScribePlugin) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('scribe-recording-modal');

        contentEl.createEl('h2', { text: 'Listening...' });

        const animationContainer = contentEl.createDiv({ cls: 'scribe-animation' });
        animationContainer.createDiv({ cls: 'pulse-ring' });

        const stopBtn = contentEl.createEl('button', { text: 'Stop & Save' });
        stopBtn.addClass('mod-cta');
        stopBtn.onclick = async () => {
            this.close();
            await this.plugin.stopRecordingAndTranscribe();
        };
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
