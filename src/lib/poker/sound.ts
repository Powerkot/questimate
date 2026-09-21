let snowballAudio: HTMLAudioElement | null = null;

export function playHit(): void {
  try {
    snowballAudio ??= new Audio("/sounds/snowball-hit.mp3");
    snowballAudio.currentTime = 0;
    snowballAudio.volume = 0.8;
    void snowballAudio.play().catch(() => {
      /* autoplay may be blocked until the visitor interacts with the page */
    });
  } catch {
    /* audio is optional */
  }
}

export function vibrateHit(): void {
  try {
    navigator.vibrate?.([40, 30, 80]);
  } catch {
    /* ignore */
  }
}
