# Obsidian Scribe

An Obsidian plugin for recording and transcribing audio notes with AI-powered speaker diarization, summaries, and action item extraction.

> 💝 **Love this plugin?** Consider [buying me a coffee](https://pay.qonto.com/payment-links/019ac53d-dd28-7d8d-a974-5f0f24b6e86a?resource_id=019ac53d-dd1f-7693-aade-000226277560) to support development!

## Features

- 🎙️ **One-Click Recording**: Start recording with a ribbon icon or hotkey (`Cmd+Shift+R`)
- 🤖 **Multiple AI Providers**: Support for OpenAI Whisper, Google Gemini, and custom/local endpoints
- 👥 **Speaker Diarization**: Automatically identifies and labels different speakers
- 📝 **Smart Summaries**: Generates concise summaries of conversations
- ✅ **Action Items**: Extracts tasks as Obsidian checkboxes
- 📁 **Organized Storage**: Saves recordings in `scribed/{timestamp}/` folders
- 🔗 **Daily Note Integration**: Automatically links transcriptions to your daily notes
- 🎨 **Clean UI**: Visual recording modal with status indicators
- ⚙️ **Fully Configurable**: Customize folders, filenames, link formats, and more

## Installation

### From Release
1. Download the latest release from the [Releases](https://github.com/yourusername/obsidian-scribe/releases) page
2. Extract the files to `{vault}/.obsidian/plugins/obsidian-scribe/`
3. Reload Obsidian
4. Enable "Obsidian Scribe" in Settings → Community Plugins

### Manual Installation
```bash
cd {vault}/.obsidian/plugins
git clone https://github.com/yourusername/obsidian-scribe.git
cd obsidian-scribe
yarn install
yarn build
```

## Configuration

### Transcription Provider

**Gemini** (Recommended)
- Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- Uses Gemini 2.5 Flash for fast, accurate transcription

**OpenAI**
- Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
- Uses Whisper model

**Custom/Local**
- Point to any OpenAI-compatible endpoint (e.g., LocalAI, Whisper.cpp)
- Set Base URL (e.g., `http://localhost:8000/v1`)
- Specify Model ID

### Post-Processing

Enable post-processing to add:
- **Speaker Labels**: Identifies "Me", "Person 1", "Person 2", etc.
- **Summary**: 2-3 sentence overview
- **Action Items**: Extracted as checkboxes

Configure your speaker label in settings (default: "Me").

### Storage & Organization

Customize:
- Transcription folder location
- Folder timestamp format
- Audio and transcription filenames

### Daily Note Integration

Configure:
- Toggle auto-linking on/off
- Custom section heading
- Link format with `{path}` and `{time}` placeholders
- Link timestamp format

## Usage

1. **Start Recording**
   - Click the feather icon in the ribbon, OR
   - Press `Cmd+Shift+R` (Windows: `Ctrl+Shift+R`)

2. **Stop Recording**
   - Click "Stop & Save" in the modal

3. **View Transcription**
   - Automatically opens in a new note
   - Saved to `scribed/{timestamp}/transcription.md`
   - Audio file: `scribed/{timestamp}/recording.webm`
   - Link added to daily note under `## Meetings`

## Output Format

```markdown
# Transcription 2025-11-27 1200

![[recording.webm]]

## Transcript
Me: Let's discuss the project timeline.
Person 1: I think we need two weeks for development.
Me: That sounds reasonable.

## Summary
Discussion about project timeline with agreement on a two-week development period.

## Action Items
- [ ] Create project plan
- [ ] Schedule kickoff meeting
```

## Development

```bash
# Install dependencies
yarn install

# Build for development
yarn dev

# Build for production
yarn build

# Type check
yarn tsc
```

## Privacy & Data

- Audio is processed by your chosen AI provider (Gemini, OpenAI, or local)
- No data is stored by this plugin beyond your vault
- For maximum privacy, use a local transcription endpoint

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support This Project

This plugin is **free and open source**. If you find it valuable:

- ⭐ **Star this repository** on GitHub
- ☕ **[Buy me a coffee](https://pay.qonto.com/payment-links/019ac53d-dd28-7d8d-a974-5f0f24b6e86a?resource_id=019ac53d-dd1f-7693-aade-000226277560)** to support development
- 💬 **Share feedback** and help improve the project
- 🐛 **Report bugs** or contribute code

Your support helps maintain and improve this project for everyone!

## License

MIT License with Donation Request - see [LICENSE](LICENSE) file for details

## Acknowledgments

- Built with [Obsidian API](https://github.com/obsidianmd/obsidian-api)
- Powered by Google Gemini and OpenAI
- Inspired by the Obsidian community

---

Made with ❤️ for the Obsidian community
