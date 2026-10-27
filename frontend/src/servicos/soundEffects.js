class SoundService {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }
  getAudioContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }
  reproduzirTom(freq, type = 'sine', duracao = 0.08, volume = 0.05) {
    if (!this.enabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duracao);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duracao);
    } catch {}
  }
  play(soundNome = 'click') {
    switch (soundNome) {
      case 'click':
        return this.reproduzirClick();
      case 'success':
        return this.reproduzirSucesso();
      case 'join':
        return this.reproduzirAderirChamada();
      case 'leave':
        return this.reproduzirSairChamada();
      case 'message':
        return this.reproduzirMensagem();
      case 'levelUp':
        return this.reproduzirNivelUp();
      case 'streak':
        return this.reproduzirSequencia();
      default:
        return this.reproduzirClick();
    }
  }
  definirAtivo(val) {
    this.enabled = !!val;
  }
  reproduzirClick() {
    this.reproduzirTom(800, 'sine', 0.04, 0.03);
  }
  reproduzirAderirChamada() {
    this.reproduzirTom(520, 'sine', 0.1, 0.06);
    setTimeout(() => this.reproduzirTom(659, 'sine', 0.15, 0.06), 100);
  }
  reproduzirSairChamada() {
    this.reproduzirTom(659, 'sine', 0.1, 0.06);
    setTimeout(() => this.reproduzirTom(520, 'sine', 0.15, 0.06), 100);
  }
  reproduzirMute() {
    this.reproduzirTom(300, 'triangle', 0.08, 0.04);
  }
  reproduzirAtivarMicrofone() {
    this.reproduzirTom(600, 'sine', 0.08, 0.04);
  }
  reproduzirSilenciarAudio() {
    this.reproduzirTom(280, 'triangle', 0.09, 0.05);
    setTimeout(() => this.reproduzirTom(190, 'triangle', 0.12, 0.05), 80);
  }
  reproduzirAtivarAudio() {
    this.reproduzirTom(190, 'sine', 0.08, 0.05);
    setTimeout(() => this.reproduzirTom(380, 'sine', 0.12, 0.05), 80);
  }
  reproduzirMensagem() {
    this.reproduzirTom(880, 'sine', 0.08, 0.05);
  }
  reproduzirSucesso() {
    this.reproduzirTom(587.33, 'sine', 0.08, 0.05);
    setTimeout(() => this.reproduzirTom(880, 'sine', 0.15, 0.05), 90);
  }
  reproduzirNivelUp() {
    this.reproduzirTom(440, 'triangle', 0.1, 0.06);
    setTimeout(() => this.reproduzirTom(554.37, 'triangle', 0.1, 0.06), 100);
    setTimeout(() => this.reproduzirTom(659.25, 'triangle', 0.2, 0.07), 200);
  }
  reproduzirSequencia() {
    this.reproduzirTom(523.25, 'sine', 0.09, 0.05);
    setTimeout(() => this.reproduzirTom(659.25, 'sine', 0.12, 0.05), 100);
  }
  reproduzirQuestionarioCorreta() {
    this.reproduzirSucesso();
  }
  reproduzirQuestionarioErrada() {
    this.reproduzirTom(220, 'sawtooth', 0.15, 0.04);
  }
  reproduzirToque() {
    this.reproduzirTom(440, 'sine', 0.12, 0.08);
    setTimeout(() => this.reproduzirTom(554.37, 'sine', 0.12, 0.08), 130);
    setTimeout(() => this.reproduzirTom(659.25, 'sine', 0.25, 0.08), 260);
  }
}

export const soundEffects = new SoundService();

export default soundEffects;
