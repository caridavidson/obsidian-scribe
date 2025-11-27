import { App, Modal } from "obsidian";
import type ObsidianScribePlugin from "../main";

export class RecordingModal extends Modal {
  plugin: ObsidianScribePlugin;
  private timerInterval: any;
  private timeDisplay: HTMLElement;

  constructor(app: App, plugin: ObsidianScribePlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("scribe-recording-modal");

    contentEl.createEl("h2", { text: "Listening..." });

    this.timeDisplay = contentEl.createEl("p", { text: "00:00" });
    this.updateTimeDisplay();

    this.timerInterval = setInterval(() => {
      this.updateTimeDisplay();
    }, 1000);

    const animationContainer = contentEl.createDiv({ cls: "scribe-animation" });
    animationContainer.createDiv({ cls: "pulse-ring" });

    const stopBtn = contentEl.createEl("button", { text: "Stop & Save" });
    stopBtn.addClass("mod-cta");
    stopBtn.onclick = async () => {
      this.close();
      await this.plugin.stopRecordingAndTranscribe();
    };
  }

  updateTimeDisplay() {
    if (this.plugin.recorder) {
      const seconds = this.plugin.recorder.elapsedTime;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      this.timeDisplay.setText(
        `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`,
      );
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
    clearInterval(this.timerInterval);
  }
}
