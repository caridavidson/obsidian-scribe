export interface ScribeSettings {
  apiKey: string;
  provider: "openai" | "groq" | "gemini" | "custom";
  baseUrl: string;
  model: string;
  enablePostProcessing: boolean;
  userSpeakerLabel: string;

  // Storage & Organization
  transcriptionFolder: string;
  audioFilename: string;
  transcriptionFilename: string;
  folderTimestampFormat: string;

  // Daily Note Integration
  dailyNoteLinking: boolean;
  dailyNoteSection: string;
  linkFormat: string;
  linkTimestampFormat: string;

  // Behavior
  autoOpenTranscription: boolean;
  openNoteOnStart: boolean;
}

export const DEFAULT_SETTINGS: ScribeSettings = {
  apiKey: "",
  provider: "gemini",
  baseUrl: "",
  model: "",
  enablePostProcessing: true,
  userSpeakerLabel: "Me",

  // Storage & Organization
  transcriptionFolder: "scribed",
  audioFilename: "recording.webm",
  transcriptionFilename: "transcription.md",
  folderTimestampFormat: "YYYY-MM-DD HHmm",

  // Daily Note Integration
  dailyNoteLinking: true,
  dailyNoteSection: "## Meetings",
  linkFormat: "- [[{path}|Transcription {time}]]",
  linkTimestampFormat: "HH:mm",

  // Behavior
  autoOpenTranscription: true,
  openNoteOnStart: true,
};
