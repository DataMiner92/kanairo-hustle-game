/**
 * Client-Side Audio & WebSocket Manager for Gemini Live API (gemini-3.8-live)
 * Encapsulates 16kHz PCM capture, 24kHz gapless playback scheduling, and interruption support.
 */

export type LiveConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'LISTENING' | 'SPEAKING' | 'ERROR';

export interface LiveAudioCallbacks {
  onStatusChange?: (status: LiveConnectionStatus) => void;
  onTranscription?: (speaker: 'user' | 'model', text: string) => void;
  onVolumeChange?: (userLevel: number, modelLevel: number) => void;
  onError?: (err: string) => void;
}

export class LiveAudioClient {
  private ws: WebSocket | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;

  private nextPlayTime: number = 0;
  private activeSources: AudioBufferSourceNode[] = [];

  private isRecording: boolean = false;
  private status: LiveConnectionStatus = 'DISCONNECTED';
  private callbacks: LiveAudioCallbacks = {};

  constructor(callbacks: LiveAudioCallbacks = {}) {
    this.callbacks = callbacks;
  }

  public setCallbacks(callbacks: LiveAudioCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  private updateStatus(newStatus: LiveConnectionStatus) {
    this.status = newStatus;
    if (this.callbacks.onStatusChange) {
      this.callbacks.onStatusChange(newStatus);
    }
  }

  public getStatus(): LiveConnectionStatus {
    return this.status;
  }

  /**
   * Connect to WebSocket proxy on server (/api/live-voice)
   */
  public async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    this.updateStatus('CONNECTING');

    return new Promise((resolve, reject) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/live-voice`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.updateStatus('CONNECTED');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);

            if (msg.type === 'connected') {
              this.updateStatus('CONNECTED');
            } else if (msg.type === 'live_turn') {
              if (msg.interrupted) {
                this.stopAudioPlayback();
              }

              if (msg.userTranscription) {
                if (this.callbacks.onTranscription) {
                  this.callbacks.onTranscription('user', msg.userTranscription);
                }
              }

              if (msg.text) {
                if (this.callbacks.onTranscription) {
                  this.callbacks.onTranscription('model', msg.text);
                }
              }

              if (msg.audio) {
                this.playAudioChunk(msg.audio);
              }
            } else if (msg.type === 'error' || msg.error) {
              const errMsg = msg.message || msg.error;
              console.error('Live API Error:', errMsg);
              if (this.callbacks.onError) this.callbacks.onError(errMsg);
              this.updateStatus('ERROR');
            }
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e);
          }
        };

        this.ws.onerror = (e) => {
          console.error('WebSocket connection error:', e);
          this.updateStatus('ERROR');
          if (this.callbacks.onError) this.callbacks.onError('WebSocket connection error');
          reject(e);
        };

        this.ws.onclose = () => {
          this.stopRecording();
          this.stopAudioPlayback();
          this.updateStatus('DISCONNECTED');
        };
      } catch (err: any) {
        this.updateStatus('ERROR');
        reject(err);
      }
    });
  }

  /**
   * Start 16kHz microphone capture and streaming
   */
  public async startRecording(): Promise<void> {
    if (this.isRecording) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      // 16kHz AudioContext for microphone capture according to Gemini Live requirements
      this.inputAudioCtx = new AudioCtx({ sampleRate: 16000 });
      if (this.inputAudioCtx.state === 'suspended') {
        await this.inputAudioCtx.resume();
      }

      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const source = this.inputAudioCtx.createMediaStreamSource(this.micStream);
      // Buffer size 4096 = ~0.25 sec chunks at 16kHz
      this.processor = this.inputAudioCtx.createScriptProcessor(4096, 1, 1);

      source.connect(this.processor);
      this.processor.connect(this.inputAudioCtx.destination);

      this.processor.onaudioprocess = (e) => {
        if (!this.isRecording || !this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);

        // Calculate volume level for visualizer
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        if (this.callbacks.onVolumeChange) {
          this.callbacks.onVolumeChange(Math.min(1, rms * 5), 0);
        }

        // Convert Float32 to 16-bit PCM Little Endian base64
        const base64Audio = this.float32ToPCM16Base64(inputData);
        this.ws.send(JSON.stringify({ type: 'audio', audio: base64Audio }));
      };

      this.isRecording = true;
      this.updateStatus('LISTENING');
    } catch (err: any) {
      console.error('Failed to start microphone recording:', err);
      if (this.callbacks.onError) {
        this.callbacks.onError(`Microphone error: ${err.message || 'Permission denied'}`);
      }
      this.updateStatus('ERROR');
      throw err;
    }
  }

  /**
   * Stop microphone recording
   */
  public stopRecording() {
    this.isRecording = false;
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.inputAudioCtx && this.inputAudioCtx.state !== 'closed') {
      this.inputAudioCtx.close().catch(() => {});
      this.inputAudioCtx = null;
    }
    if (this.status === 'LISTENING') {
      this.updateStatus('CONNECTED');
    }
  }

  /**
   * Send game state context to Live API so Radio Mtaa Bazuu knows current coordinates, money, heat, etc.
   */
  public sendGameContext(context: {
    money: number;
    streetCred: number;
    policeHeat: number;
    zone: string;
    activeMission?: string;
    weather: string;
    isInVehicle: boolean;
    vehicleName?: string;
  }) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'context', gameContext: context }));
    }
  }

  /**
   * Send typed text into the conversation
   */
  public sendText(text: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'text', text }));
      if (this.callbacks.onTranscription) {
        this.callbacks.onTranscription('user', text);
      }
    }
  }

  /**
   * Play 24kHz raw PCM audio chunks from Gemini Live model
   */
  private playAudioChunk(base64Data: string) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.outputAudioCtx || this.outputAudioCtx.state === 'closed') {
        this.outputAudioCtx = new AudioCtx({ sampleRate: 24000 });
      }
      if (this.outputAudioCtx.state === 'suspended') {
        this.outputAudioCtx.resume().catch(() => {});
      }

      const pcm16 = this.base64ToPCM16(base64Data);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 32768.0;
      }

      const audioBuffer = this.outputAudioCtx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = this.outputAudioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputAudioCtx.destination);

      // Schedule gapless playback
      const currentTime = this.outputAudioCtx.currentTime;
      if (this.nextPlayTime < currentTime) {
        this.nextPlayTime = currentTime;
      }

      source.start(this.nextPlayTime);
      this.nextPlayTime += audioBuffer.duration;

      this.activeSources.push(source);
      this.updateStatus('SPEAKING');

      // Model speaking audio wave
      if (this.callbacks.onVolumeChange) {
        this.callbacks.onVolumeChange(0, 0.75);
      }

      source.onended = () => {
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) this.activeSources.splice(idx, 1);
        if (this.activeSources.length === 0) {
          if (this.callbacks.onVolumeChange) this.callbacks.onVolumeChange(0, 0);
          if (this.isRecording) {
            this.updateStatus('LISTENING');
          } else {
            this.updateStatus('CONNECTED');
          }
        }
      };
    } catch (e) {
      console.error('Error playing audio chunk:', e);
    }
  }

  /**
   * Stop all active playback sources immediately on interruption
   */
  public stopAudioPlayback() {
    this.activeSources.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch (_) {}
    });
    this.activeSources = [];
    if (this.outputAudioCtx) {
      this.nextPlayTime = this.outputAudioCtx.currentTime;
    }
    if (this.callbacks.onVolumeChange) {
      this.callbacks.onVolumeChange(0, 0);
    }
  }

  /**
   * Disconnect and clean up all resources
   */
  public disconnect() {
    this.stopRecording();
    this.stopAudioPlayback();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.outputAudioCtx && this.outputAudioCtx.state !== 'closed') {
      this.outputAudioCtx.close().catch(() => {});
      this.outputAudioCtx = null;
    }
    this.updateStatus('DISCONNECTED');
  }

  // --- Audio Format Conversion Utilities ---
  private float32ToPCM16Base64(float32: Float32Array): string {
    const buffer = new ArrayBuffer(float32.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToPCM16(base64: string): Int16Array {
    const binary = atob(base64);
    const pcmLength = Math.floor(binary.length / 2);
    const pcm = new Int16Array(pcmLength);
    for (let i = 0; i < pcmLength; i++) {
      const low = binary.charCodeAt(i * 2);
      const high = binary.charCodeAt(i * 2 + 1);
      let val = (high << 8) | low;
      if (val >= 0x8000) val -= 0x10000;
      pcm[i] = val;
    }
    return pcm;
  }
}
