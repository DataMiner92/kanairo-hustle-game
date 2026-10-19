import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const server = http.createServer(app);

// Shared Gemini client with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// REST Fallback endpoint for text / chat queries
app.post('/api/voice-assistant', async (req, res) => {
  try {
    const { message, gameContext } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const contextSummary = gameContext
      ? `[PLAYER STATUS: Money Ksh ${gameContext.money}, Cred ${gameContext.streetCred}/100, Police Heat ${gameContext.policeHeat}/100, Zone: ${gameContext.zone || 'Kayole'}, Mission: "${gameContext.activeMission || 'None'}", Weather: ${gameContext.weather}, In Vehicle: ${gameContext.isInVehicle ? 'Yes (' + gameContext.vehicleName + ')' : 'No'}]`
      : '';

    const prompt = `${contextSummary}\nPlayer says: "${message}"\n\nRespond as "Radio Mtaa Bazuu" in authentic, concise, vibrant Nairobi Sheng/Swahili/English (2-3 short punchy sentences max). Give practical, clever street advice tailored to their exact game stats!`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are "Radio Mtaa Bazuu" — the authentic street-smart AI radio dispatcher and elder brother in Nairobi for the open-world game Kanairo: Mtaa Hustle. Speak lively, colorful Sheng mixed with Swahili and English. Be humorous, supportive, and street-wise.',
      },
    });

    res.json({ reply: response.text || 'Niaje bazuu! Tuko live kwa barabara za Kanairo.' });
  } catch (err: any) {
    console.error('Voice Assistant REST Error:', err);
    res.status(500).json({ error: err?.message || 'Failed to generate assistant response' });
  }
});

// WebSocket Server for Gemini Live API real-time voice conversations
const wss = new WebSocketServer({ server, path: '/api/live-voice' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('Client connected to Live Voice WebSocket');

  if (!process.env.GEMINI_API_KEY) {
    clientWs.send(JSON.stringify({ error: 'GEMINI_API_KEY is missing on server.' }));
    clientWs.close();
    return;
  }

  let session: any = null;

  try {
    session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
        },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
        systemInstruction: `You are "Radio Mtaa Bazuu" — the real-time AI voice copilot, street connect, and dispatch DJ in Nairobi for the open-world RPG "Kanairo: Mtaa Hustle".
You speak colorful, authentic Nairobi Sheng blended with Swahili and English (e.g. "Niaje bazuu!", "Kaa chonjo na hawa Kanjo", "Gari ishajaa, twende CBD!", "Weka form safi").
You are watching the player's live screen. You know about:
- Their starting bedsitter in Kayole with only Ksh 200.
- Achieng's Kibandaski (madondo, mandazi, chai moto for hunger & energy).
- Mwas Tech & Electronics (cheap smartphones, tools, intel).
- Otieno's Boda stage and the Nganya matatu "Kiboko ya Barabara" (Route 19).
- Evading Inspector K and county Kanjo arrests by paying bail or keeping a low profile.
- Driving matatus along Jogoo Road Highway to the CBD, picking passengers, and charging surged fares during Nairobi rain!
- Career paths: Maboyz wa Mtaa, Matatu Hustler, Legit Entrepreneur, or Undercover DCI Agent.
Keep all spoken answers concise, conversational, punchy, and atmospheric (1 to 3 short sentences). Sound like an energetic, friendly brother speaking over a two-way walkie-talkie radio!`,
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          if (clientWs.readyState !== WebSocket.OPEN) return;

          // 1. Audio data chunk (24kHz PCM)
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;

          // 2. Transcriptions & Text parts
          const parts = message.serverContent?.modelTurn?.parts || [];
          let text = '';
          for (const p of parts) {
            if (p.text) text += p.text;
          }

          // 3. User input transcription
          // @ts-ignore
          const userTranscription = message.serverContent?.turnComplete ? '' : (message as any).serverContent?.inputAudioTranscription?.text;

          // 4. Interruption notice
          const interrupted = !!message.serverContent?.interrupted;

          clientWs.send(
            JSON.stringify({
              type: 'live_turn',
              audio,
              text,
              userTranscription,
              interrupted,
            })
          );
        },
        onclose: () => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.close();
          }
        },
        onerror: (err: any) => {
          console.error('Gemini Live session error:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'error', message: err?.message || 'Live session error' }));
          }
        },
      },
    });

    clientWs.send(JSON.stringify({ type: 'connected', message: 'Radio Mtaa Bazuu is online!' }));

    // Listen for client messages (Audio PCM from microphone, text queries, or game context updates)
    clientWs.on('message', (rawData) => {
      try {
        const msg = JSON.parse(rawData.toString());

        if (msg.type === 'audio' && msg.audio) {
          // Send 16kHz PCM audio chunk to Live API
          session.sendRealtimeInput({
            audio: {
              data: msg.audio,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        } else if (msg.type === 'text' && msg.text) {
          // Send text message into the session
          session.sendClientContent({
            turns: [
              {
                role: 'user',
                parts: [{ text: msg.text }],
              },
            ],
            turnComplete: true,
          });
        } else if (msg.type === 'context' && msg.gameContext) {
          // Inform model of updated player game state
          const ctxText = `[GAME UPDATE: Money=Ksh ${msg.gameContext.money}, Cred=${msg.gameContext.streetCred}/100, Heat=${msg.gameContext.policeHeat}/100, Zone=${msg.gameContext.zone}, Weather=${msg.gameContext.weather}, InVehicle=${msg.gameContext.isInVehicle}${msg.gameContext.vehicleName ? ' (' + msg.gameContext.vehicleName + ')' : ''}]`;
          session.sendClientContent({
            turns: [
              {
                role: 'user',
                parts: [{ text: ctxText }],
              },
            ],
            turnComplete: false,
          });
        }
      } catch (e) {
        console.error('Error handling WebSocket message:', e);
      }
    });

    clientWs.on('close', () => {
      try {
        if (session) session.close();
      } catch (_) {}
    });
  } catch (err: any) {
    console.error('Failed to establish Live session:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ type: 'error', message: err?.message || 'Failed to start Live session' }));
    }
  }
});

// Vite middleware or static serving
const startServer = async () => {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Kanairo server running on http://0.0.0.0:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
