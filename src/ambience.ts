const BASE_URL = 'https://images.ssod.org/resource/audio/ambience/';
const MUTE_KEY = 'seven-spells-ambience-muted';
const FADE_MS = 3000;
const MAX_VOLUME = 0.3;

type Track = { name: string; audio: HTMLAudioElement };

class AmbienceController {
    private desired: string | null = null;
    private current: Track | null = null;
    private pending: Track | null = null;
    private fadingOut: Track | null = null;
    private muted = true;
    private generation = 0;
    private frame: number | null = null;
    private waitingForGesture = false;

    private retryOnGesture = () => {
        if (this.muted || !this.desired) return;
        this.clearGestureRetry();
        this.request(this.desired);
    };

    private clearGestureRetry(): void {
        if (!this.waitingForGesture) return;
        this.waitingForGesture = false;
        document.removeEventListener('pointerdown', this.retryOnGesture, true);
        document.removeEventListener('keydown', this.retryOnGesture, true);
    }

    private awaitGesture(): void {
        if (this.waitingForGesture) return;
        this.waitingForGesture = true;
        document.addEventListener('pointerdown', this.retryOnGesture, true);
        document.addEventListener('keydown', this.retryOnGesture, true);
    }

    constructor() {
        try { this.muted = localStorage.getItem(MUTE_KEY) !== 'false'; } catch { /* Storage may be disabled. */ }
    }

    isMuted(): boolean { return this.muted; }

    setMuted(muted: boolean): void {
        this.muted = muted;
        try { localStorage.setItem(MUTE_KEY, String(muted)); } catch { /* Storage may be disabled. */ }
        if (muted) {
            this.clearGestureRetry();
            this.generation++;
            this.cancelFrame();
            this.dispose(this.fadingOut);
            this.fadingOut = null;
            this.dispose(this.pending);
            this.pending = null;
            this.dispose(this.current);
            this.current = null;
        } else if (this.desired) {
            this.request(this.desired);
        }
    }

    acceptNonce(nonce: unknown): void {
        if (typeof nonce !== 'string') return;
        const [ambience] = nonce.split(';', 1);
        const name = ambience?.trim().toLowerCase();
        if (!name || name === 'none' || !/^[a-z0-9_-]+$/.test(name)) return;
        if (name === this.desired) {
            if (!this.muted && !this.current && !this.pending) this.request(name);
            return;
        }
        this.desired = name;
        if (!this.muted) this.request(name);
    }

    private cancelFrame(): void {
        if (this.frame !== null) cancelAnimationFrame(this.frame);
        this.frame = null;
    }

    private dispose(track: Track | null): void {
        if (!track) return;
        track.audio.pause();
        track.audio.removeAttribute('src');
        track.audio.load();
    }

    private request(name: string): void {
        const generation = ++this.generation;
        this.clearGestureRetry();
        this.cancelFrame();
        this.dispose(this.fadingOut);
        this.fadingOut = null;
        this.dispose(this.pending);
        this.pending = null;

        if (this.current?.name === name) {
            this.current.audio.volume = MAX_VOLUME;
            return;
        }
        if (this.current) this.current.audio.volume = MAX_VOLUME;

        const audio = new Audio(BASE_URL + encodeURIComponent(name) + '.ogg');
        audio.loop = true;
        audio.preload = 'auto';
        audio.volume = 0;
        const track = { name, audio };
        this.pending = track;

        const fail = () => {
            if (generation !== this.generation) return;
            console.warn(`Unable to play ambience: ${name}`);
            this.dispose(track);
            this.pending = null;
        };

        audio.addEventListener('error', fail, { once: true });
        audio.addEventListener('canplay', () => {
            if (generation !== this.generation || this.muted) return;
            void audio.play().then(() => {
                if (generation !== this.generation || this.muted) {
                    this.dispose(track);
                    return;
                }
                this.pending = null;
                const previous = this.current;
                this.fadingOut = previous;
                this.current = track;
                const started = performance.now();
                const oldVolume = previous?.audio.volume ?? 0;
                const step = (now: number) => {
                    if (generation !== this.generation || this.muted) return;
                    const progress = Math.max(0, Math.min(1, (now - started) / FADE_MS));
                    audio.volume = MAX_VOLUME * progress;
                    if (previous) previous.audio.volume = oldVolume * (1 - progress);
                    if (progress < 1) {
                        this.frame = requestAnimationFrame(step);
                    } else {
                        this.frame = null;
                        this.dispose(previous);
                        this.fadingOut = null;
                    }
                };
                this.frame = requestAnimationFrame(step);
            }).catch((error: unknown) => {
                fail();
                if (generation === this.generation && !this.muted &&
                    error instanceof DOMException && error.name === 'NotAllowedError') {
                    this.awaitGesture();
                }
            });
        }, { once: true });
        audio.load();
    }
}

export const ambience = new AmbienceController();
