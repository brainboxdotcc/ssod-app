const BASE_URL = '/audio/';
const FADE_MS = 3000;
const MAX_VOLUME = 0.3;

type Track = { name: string; audio: HTMLAudioElement };

class AudioController {
    private desired: string | null = null;
    private current: Track | null = null;
    private pending: Track | null = null;
    private fadingOut: Track | null = null;
    private muted = true;
    private volume: number;
    private generation = 0;
    private frame: number | null = null;
    private waitingForGesture = false;
    private loop = true;
    private onTrackEnd: (() => void) | null = null;

    constructor(
        private readonly directory: string,
        private readonly muteKey: string
    ) {
        try {
            this.muted = localStorage.getItem(muteKey) !== 'false';
			this.volume = directory === 'music' ? 20 : 100;
            const stored = localStorage.getItem(`${muteKey}-volume`);
            if (stored !== null) {
                const value = Number(stored);
                if (Number.isFinite(value)) {
                    this.volume = Math.max(0, Math.min(100, value));
                }
            }
        } catch { /* Storage may be disabled. */ }
    }

    private get targetVolume(): number {
        return MAX_VOLUME * this.volume / 100;
    }

    private retryOnGesture = () => {
        if (this.isMuted() || !this.desired) return;
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

    isMuted(): boolean {
        return this.muted || this.volume === 0;
    }

    getVolume(): number {
        return this.volume;
    }

    setVolume(value: number): void {
        if (!Number.isFinite(value)) return;

        this.volume = Math.max(0, Math.min(100, value));

        try {
            localStorage.setItem(`${this.muteKey}-volume`, String(this.volume));
        } catch { /* Storage may be disabled. */ }

        if (this.volume === 0) {
            this.stopPlayback();
            return;
        }

        if (this.muted) return;

        if (this.current) {
            this.current.audio.volume = this.targetVolume;
        }

        if (this.pending) {
            this.pending.audio.volume = 0;
        }

        if (!this.current && !this.pending && this.desired) {
            this.request(this.desired);
        }
    }

    setMuted(muted: boolean): void {
        this.muted = muted;

        try {
            localStorage.setItem(this.muteKey, String(muted));
        } catch { /* Storage may be disabled. */ }

        if (muted) {
            this.stopPlayback();
        } else if (this.volume > 0 && this.desired) {
            this.request(this.desired);
        }
    }

    setLoop(loop: boolean, onTrackEnd: (() => void) | null = null): void {
        this.loop = loop;
        this.onTrackEnd = onTrackEnd;

        if (this.current) this.current.audio.loop = loop;
        if (this.pending) this.pending.audio.loop = loop;
    }

    acceptName(value: string | undefined): void {
        const name = value?.trim().toLowerCase();

        if (!name || name === 'none') {
            this.desired = null;
            this.stopPlayback();
            return;
        }

        if (!/^[a-z0-9_-]+$/.test(name)) return;

        if (name === this.desired) {
            if (!this.isMuted() && !this.current && !this.pending) {
                this.request(name);
            }
            return;
        }

        this.desired = name;

        if (!this.isMuted()) {
            this.request(name);
        }
    }

    private cancelFrame(): void {
        if (this.frame !== null) {
            cancelAnimationFrame(this.frame);
        }
        this.frame = null;
    }

    private dispose(track: Track | null): void {
        if (!track) return;

        track.audio.pause();
        track.audio.removeAttribute('src');
        track.audio.load();
    }

    private stopPlayback(): void {
        this.clearGestureRetry();
        this.generation++;
        this.cancelFrame();

        this.dispose(this.fadingOut);
        this.fadingOut = null;

        this.dispose(this.pending);
        this.pending = null;

        this.dispose(this.current);
        this.current = null;
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
            this.current.audio.volume = this.targetVolume;
            return;
        }

        if (this.current) {
            this.current.audio.volume = this.targetVolume;
        }

        const audio = new Audio(
            BASE_URL + this.directory + '/' + encodeURIComponent(name) + '.ogg'
        );

        audio.loop = this.loop;
        audio.preload = 'auto';
        audio.volume = 0;

        const track: Track = { name, audio };
        this.pending = track;

        const fail = () => {
            if (generation !== this.generation) return;

            console.warn(`Unable to play ${this.directory}: ${name}`);
            this.dispose(track);
            this.pending = null;
        };

        audio.addEventListener('error', fail, { once: true });

        audio.addEventListener('canplay', () => {
            if (generation !== this.generation || this.isMuted()) return;

            void audio.play().then(() => {
                if (generation !== this.generation || this.isMuted()) {
                    this.dispose(track);
                    return;
                }

                this.pending = null;

                const previous = this.current;
                this.fadingOut = previous;
                this.current = track;

                let advancing = false;

                const advance = () => {
                    if (
                        advancing ||
                        generation !== this.generation ||
                        this.isMuted() ||
                        this.loop
                    ) return;

                    advancing = true;
                    this.onTrackEnd?.();
                };

                audio.addEventListener('timeupdate', () => {
                    if (
                        !audio.loop &&
                        Number.isFinite(audio.duration) &&
                        audio.duration - audio.currentTime <= FADE_MS / 1000
                    ) {
                        advance();
                    }
                });

                audio.addEventListener('ended', advance);

                const started = performance.now();
                const oldVolume = previous?.audio.volume ?? 0;

                const step = (now: number) => {
                    if (generation !== this.generation || this.isMuted()) return;

                    const progress = Math.max(
                        0,
                        Math.min(1, (now - started) / FADE_MS)
                    );

                    audio.volume = this.targetVolume * progress;

                    if (previous) {
                        previous.audio.volume = oldVolume * (1 - progress);
                    }

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

                if (
                    generation === this.generation &&
                    !this.isMuted() &&
                    error instanceof DOMException &&
                    error.name === 'NotAllowedError'
                ) {
                    this.awaitGesture();
                }
            });
        }, { once: true });

        audio.load();
    }
}

export const ambience = new AudioController(
    'ambience',
    'seven-spells-ambience-muted'
);

export const music = new AudioController(
    'music',
    'seven-spells-music-muted'
);

export type MusicMode = 'location' | 'shuffle';

const MUSIC_MODE_KEY = 'seven-spells-music-mode';

const MUSIC_TRACKS = [
    'peaceful',
    'adventure',
    'mystery',
    'tension',
    'dread',
    'combat',
    'epic',
    'sorrow',
    'wonder',
    'triumph',
];

let musicMode: MusicMode = 'location';
let locationMusic: string | undefined;
let shuffleQueue: string[] = [];
let lastShuffledTrack: string | null = null;

try {
    if (localStorage.getItem(MUSIC_MODE_KEY) === 'shuffle') {
        musicMode = 'shuffle';
    }
} catch { /* Storage may be disabled. */ }

function refillShuffleQueue(): void {
    shuffleQueue = [...MUSIC_TRACKS];

    for (let i = shuffleQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [shuffleQueue[i], shuffleQueue[j]] =
            [shuffleQueue[j], shuffleQueue[i]];
    }

    if (
        lastShuffledTrack &&
        shuffleQueue[0] === lastShuffledTrack &&
        shuffleQueue.length > 1
    ) {
        [shuffleQueue[0], shuffleQueue[1]] =
            [shuffleQueue[1], shuffleQueue[0]];
    }
}

function nextShuffledTrack(): void {
    if (shuffleQueue.length === 0) {
        refillShuffleQueue();
    }

    const next = shuffleQueue.shift()!;
    lastShuffledTrack = next;

    music.acceptName(next);
}

export function getMusicMode(): MusicMode {
    return musicMode;
}

export function setMusicMode(mode: MusicMode): void {
    if (mode === musicMode) return;

    musicMode = mode;

    try {
        localStorage.setItem(MUSIC_MODE_KEY, mode);
    } catch { /* Storage may be disabled. */ }

    if (mode === 'shuffle') {
        shuffleQueue = [];
        lastShuffledTrack = null;

        music.setLoop(false, nextShuffledTrack);
        nextShuffledTrack();
    } else {
        music.setLoop(true);
        music.acceptName(locationMusic);
    }
}

music.setLoop(
    musicMode === 'location',
    musicMode === 'shuffle' ? nextShuffledTrack : null
);

export function acceptAudioNonce(nonce: unknown): void {
    if (typeof nonce !== 'string' || !nonce.trim()) return;

    const [ambienceName, musicName] = nonce.split(';', 2);

    if (ambienceName !== undefined && ambienceName !== '') {
        ambience.acceptName(ambienceName);
    }

    if (musicName !== undefined && musicName !== '') {
        locationMusic = musicName;

        if (musicMode === 'location') {
            music.acceptName(locationMusic);
        }
    }

    if (musicMode === 'shuffle' && lastShuffledTrack === null) {
        nextShuffledTrack();
    }
}