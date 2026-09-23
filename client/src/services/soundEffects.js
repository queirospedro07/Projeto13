// SoundService stub: silent, zero overhead, non-intrusive
class SoundService {
  enabled = false;
  setEnabled() {}
  playJoinCall() {}
  playLeaveCall() {}
  playMute() {}
  playUnmute() {}
  playMessage() {}
  playSuccess() {}
  playLevelUp() {}
  playStreak() {}
  playQuizCorrect() {}
  playQuizWrong() {}
}

export const soundEffects = new SoundService();
export default soundEffects;