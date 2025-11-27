import { requestUrl, RequestUrlParam } from 'obsidian';

export async function transcribeAudio(
    audioBlob: Blob,
    apiKey: string,
    provider: 'openai' | 'groq' | 'gemini' | 'custom',
    baseUrl?: string,
    model?: string,
    enablePostProcessing?: boolean,
    userSpeakerLabel?: string
): Promise<string> {
    if (!apiKey && provider !== 'custom') { // Custom might not need API key if local
        throw new Error('API Key is missing. Please check your settings.');
    }

    let rawTranscript: string;

    if (provider === 'openai') {
        rawTranscript = await transcribeOpenAI(audioBlob, apiKey);
    } else if (provider === 'groq') {
        // Placeholder for Groq implementation
        throw new Error('Groq support not yet implemented');
    } else if (provider === 'gemini') {
        rawTranscript = await transcribeGemini(audioBlob, apiKey);
    } else if (provider === 'custom') {
        rawTranscript = await transcribeCustom(audioBlob, apiKey, baseUrl, model);
    } else {
        throw new Error('Unknown provider');
    }

    // Post-process if enabled
    if (enablePostProcessing && apiKey) {
        return await postProcessTranscription(rawTranscript, apiKey, userSpeakerLabel || 'Me');
    }

    return rawTranscript;
}

async function transcribeOpenAI(audioBlob: Blob, apiKey: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('model', 'whisper-1');

    try {
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorBody = await response.json();
            throw new Error(`OpenAI API Error: ${errorBody.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.text;
    } catch (error) {
        console.error('Transcription error:', error);
        throw error;
    }
}

async function transcribeGemini(audioBlob: Blob, apiKey: string): Promise<string> {
    const base64Audio = await blobToBase64(audioBlob);

    // Clean base64 string (remove data URL prefix if present)
    const base64Data = base64Audio.split(',')[1] || base64Audio;

    const payload = {
        contents: [{
            parts: [
                {
                    text: "Transcribe the following audio file exactly as spoken."
                },
                {
                    inlineData: {
                        mimeType: "audio/webm", // MediaRecorder defaults to webm
                        data: base64Data
                    }
                }
            ]
        }]
    };

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error('Gemini API Error Body:', errorBody);
            throw new Error(`Gemini API Error: ${errorBody.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('Gemini returned no text.');
        }

        return text;
    } catch (error) {
        console.error('Gemini Transcription error:', error);
        throw error;
    }
}

function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error('Failed to convert blob to base64'));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

async function transcribeCustom(audioBlob: Blob, apiKey: string, baseUrl?: string, model?: string): Promise<string> {
    const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/audio/transcriptions` : 'http://localhost:8000/v1/audio/transcriptions';
    const modelId = model || 'whisper-1';

    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('model', modelId);

    try {
        const headers: Record<string, string> = {};
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: formData
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            throw new Error(`Custom API Error: ${errorBody.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return data.text;
    } catch (error) {
        console.error('Custom Transcription error:', error);
        throw error;
    }
}

async function postProcessTranscription(rawTranscript: string, apiKey: string, userSpeakerLabel: string): Promise<string> {
    const prompt = `You are a transcription post-processor. Given a raw audio transcription, your task is to:

1. Identify different speakers and label them. Use "${userSpeakerLabel}" for the primary speaker when identifiable, and "Person 1", "Person 2", etc. for others.
2. Format the transcript with speaker labels (e.g., "${userSpeakerLabel}: Hello there")
3. Create a concise summary of the conversation
4. Extract any action items as a checklist

Format your response EXACTLY as follows:

## Transcript
[Speaker-labeled conversation here]

## Summary
[2-3 sentence summary]

## Action Items
- [ ] Action item 1
- [ ] Action item 2

If there are no action items, write "No action items identified."

Here is the raw transcript:

${rawTranscript}`;

    const payload = {
        contents: [{
            parts: [{
                text: prompt
            }]
        }]
    };

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error('Gemini Post-Processing Error:', errorBody);
            // Fall back to raw transcript if post-processing fails
            return rawTranscript;
        }

        const data = await response.json();
        const processedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!processedText) {
            console.warn('Gemini returned no processed text, using raw transcript');
            return rawTranscript;
        }

        return processedText;
    } catch (error) {
        console.error('Post-processing error:', error);
        // Fall back to raw transcript on error
        return rawTranscript;
    }
}
