
import { useState } from 'react';
import {
    ambience,
    music,
    getMusicMode,
    setMusicMode,
    type MusicMode
} from '../audio';

type AudioOptionsProps = {
    onChange: () => void;
};

export function AudioOptions({ onChange }: AudioOptionsProps) {
    const [musicVolume, setMusicVolume] = useState(music.getVolume());
    const [ambienceVolume, setAmbienceVolume] = useState(ambience.getVolume());
    const [mode, setMode] = useState<MusicMode>(getMusicMode());

    const changeMusicVolume = (value: number) => {
        setMusicVolume(value);
        music.setVolume(value);
        if (value > 0 && music.isMuted()) music.setMuted(false);
        onChange();
    };

    const changeAmbienceVolume = (value: number) => {
        setAmbienceVolume(value);
        ambience.setVolume(value);
        if (value > 0 && ambience.isMuted()) ambience.setMuted(false);
        onChange();
    };

    const changeMode = (value: MusicMode) => {
        setMode(value);
        setMusicMode(value);
        onChange();
    };

    return (
        <div className="audio-options">
            <div className="page-heading">
                <span className="eyebrow">PREFERENCES</span>
                <h1>Options</h1>
                <p>Configure the sounds of Cryptillia.</p>
            </div>

            <section className="audio-options-panel">
                <h2>Audio</h2>

                <div className="audio-option">
                    <label htmlFor="music-volume">
                        Music volume
                        <span>{musicVolume}%</span>
                    </label>
                    <input
                        id="music-volume"
                        type="range"
                        min="0"
                        max="100"
                        value={musicVolume}
                        onChange={(event) =>
                            changeMusicVolume(Number(event.target.value))
                        }
                    />
                </div>

                <div className="audio-option">
                    <label htmlFor="ambience-volume">
                        Ambience volume
                        <span>{ambienceVolume}%</span>
                    </label>
                    <input
                        id="ambience-volume"
                        type="range"
                        min="0"
                        max="100"
                        value={ambienceVolume}
                        onChange={(event) =>
                            changeAmbienceVolume(Number(event.target.value))
                        }
                    />
                </div>

                <fieldset className="audio-mode">
                    <legend>Music playback</legend>

                    <label>
                        <input
                            type="radio"
                            name="music-mode"
                            checked={mode === 'location'}
                            onChange={() => changeMode('location')}
                        />
                        <span>
                            <strong>Music follows locations</strong>
                            <small>
                                Play music appropriate to your current location.
                            </small>
                        </span>
                    </label>

                    <label>
                        <input
                            type="radio"
                            name="music-mode"
                            checked={mode === 'shuffle'}
                            onChange={() => changeMode('shuffle')}
                        />
                        <span>
                            <strong>Music shuffle</strong>
                            <small>
                                Play every soundtrack track in random order,
                                without repeats.
                            </small>
                        </span>
                    </label>
                </fieldset>
            </section>
        </div>
    );
}
