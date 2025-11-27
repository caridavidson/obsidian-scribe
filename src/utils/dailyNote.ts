import { App, TFile, moment, normalizePath } from 'obsidian';
import type { ScribeSettings } from '../settings/settings';

export interface DailyNoteSettings {
    format: string;
    folder: string;
}

export function getDailyNoteSettings(app: App): DailyNoteSettings {
    try {
        // @ts-ignore
        const dailyNotesPlugin = app.internalPlugins.getPluginById("daily-notes");
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

export async function appendToDailyNote(
    app: App,
    transcriptionFile: TFile,
    settings: ScribeSettings
): Promise<void> {
    const dailyNoteSettings = getDailyNoteSettings(app);
    const date = moment();
    const dailyNoteFileName = date.format(dailyNoteSettings.format) + '.md';
    const dailyNotePath = normalizePath(dailyNoteSettings.folder + '/' + dailyNoteFileName);

    let dailyNote = app.vault.getAbstractFileByPath(dailyNotePath);

    if (!dailyNote) {
        // If the folder doesn't exist, create it
        if (dailyNoteSettings.folder && !app.vault.getAbstractFileByPath(dailyNoteSettings.folder)) {
            await app.vault.createFolder(dailyNoteSettings.folder);
        }
        dailyNote = await app.vault.create(dailyNotePath, '');
    }

    if (dailyNote instanceof TFile) {
        const content = await app.vault.read(dailyNote);

        // Format the link using template
        const link = settings.linkFormat
            .replace('{path}', transcriptionFile.path)
            .replace('{time}', moment().format(settings.linkTimestampFormat));

        if (content.includes(settings.dailyNoteSection)) {
            // Append to existing section
            const lines = content.split('\n');
            const meetingsIndex = lines.findIndex(line => line.trim() === settings.dailyNoteSection);
            lines.splice(meetingsIndex + 1, 0, link);
            await app.vault.modify(dailyNote, lines.join('\n'));
        } else {
            // Create section at the end
            const newContent = content + `\n\n${settings.dailyNoteSection}\n${link}`;
            await app.vault.modify(dailyNote, newContent);
        }
    }
}
