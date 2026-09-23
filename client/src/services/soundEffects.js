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

  playTone(freq, type = 'sine', duration = 0.08, volume = 0.05) {
    if (!this.enabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (_) {}
  }

  play(soundName = 'click') {
    switch (soundName) {
      case 'click':
        return this.playClick();
      case 'success':
        return this.playSuccess();
      case 'join':
        return this.playJoinCall();
      case 'leave':
        return this.playLeaveCall();
      case 'message':
        return this.playMessage();
      case 'levelUp':
        return this.playLevelUp();
      case 'streak':
        return this.playStreak();
      default:
        return this.playClick();
    }
  }

  setEnabled(val) {
    this.enabled = !!val;
  }

  playClick() {
    this.playTone(800, 'sine', 0.04, 0.03);
  }

  playJoinCall() {
    this.playTone(520, 'sine', 0.1, 0.06);
    setTimeout(() => this.playTone(659, 'sine', 0.15, 0.06), 100);
  }

  playLeaveCall() {
    this.playTone(659, 'sine', 0.1, 0.06);
    setTimeout(() => this.playTone(520, 'sine', 0.15, 0.06), 100);
  }

  playMute() {
    this.playTone(300, 'triangle', 0.08, 0.04);
  }

  playUnmute() {
    this.playTone(600, 'sine', 0.08, 0.04);
  }

  playMessage() {
    this.playTone(880, 'sine', 0.08, 0.05);
  }

  playSuccess() {
    this.playTone(587.33, 'sine', 0.08, 0.05);
    setTimeout(() => this.playTone(880, 'sine', 0.15, 0.05), 90);
  }

  playLevelUp() {
    this.playTone(440, 'triangle', 0.1, 0.06);
    setTimeout(() => this.playTone(554.37, 'triangle', 0.1, 0.06), 100);
    setTimeout(() => this.playTone(659.25, 'triangle', 0.2, 0.07), 200);
  }

  playStreak() {
    this.playTone(523.25, 'sine', 0.09, 0.05);
    setTimeout(() => this.playTone(659.25, 'sine', 0.12, 0.05), 100);
  }

  playQuizCorrect() {
    this.playSuccess();
  }

  playQuizWrong() {
    this.playTone(220, 'sawtooth', 0.15, 0.04);
  }

  playRingtone() {
    this.playTone(440, 'sine', 0.12, 0.08);
    setTimeout(() => this.playTone(554.37, 'sine', 0.12, 0.08), 130);
    setTimeout(() => this.playTone(659.25, 'sine', 0.25, 0.08), 260);
  }
}

export const soundEffects = new SoundService();
export default soundEffects;