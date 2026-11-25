import { Capacitor } from '@capacitor/core';
import { isTauri } from '@tauri-apps/api/core';
import {
	AdMob,
	AdmobConsentStatus,
	InterstitialAdPluginEvents
} from '@capacitor-community/admob';
import type { Message } from './types';

const TEST_ADS = true;
const WEB_PLACEHOLDER = import.meta.env.DEV;

const ANDROID_AD_UNIT = TEST_ADS
	? 'ca-app-pub-3940256099942544/1033173712'
	: 'ca-app-pub-7883554104697203/2597749229';

class Ads {
	private initialised = false;
	private initialising = false;
	private loading = false;
	private loaded = false;
	private showing = false;
	private deathSeen = false;
	private loadedAt = 0;
	private enabled = false;

	private isSupported(): boolean {
		return this.enabled &&
			Capacitor.isNativePlatform() &&
			Capacitor.getPlatform() === 'android';
	}

	private isWebPlaceholder(): boolean {
		return WEB_PLACEHOLDER &&
			!Capacitor.isNativePlatform() &&
			!isTauri();
	}

	setEnabled(enabled: boolean): void {
		this.enabled = enabled;
		if (enabled) {
			if (this.initialised) {
				void this.preload();
			} else {
				void this.initialise();
			}
		}
	}

	async initialise(): Promise<void> {
		if (!this.isSupported() || this.initialised || this.initialising) {
			return;
		}

		this.initialising = true;

		try {
			let consent = await AdMob.requestConsentInfo();

			if (!this.isSupported()) {
				return;
			}

			if (
				consent.isConsentFormAvailable &&
				consent.status === AdmobConsentStatus.REQUIRED
			) {
				consent = await AdMob.showConsentForm();
			}

			if (!this.isSupported() || !consent.canRequestAds) {
				return;
			}

			await AdMob.initialize();

			await AdMob.addListener(
				InterstitialAdPluginEvents.Dismissed,
				() => this.finished()
			);

			await AdMob.addListener(
				InterstitialAdPluginEvents.FailedToShow,
				() => this.finished()
			);

			this.initialised = true;
			void this.preload();
		} catch (error) {
			console.warn('AdMob initialisation failed:', error);
		} finally {
			this.initialising = false;
		}
	}

	private async preload(): Promise<void> {
		if (
			!this.isSupported() ||
			!this.initialised ||
			this.loading ||
			this.loaded ||
			this.showing
		) {
			return;
		}

		this.loading = true;

		try {
			await AdMob.prepareInterstitial({
				adId: ANDROID_AD_UNIT,
				isTesting: TEST_ADS,
				immersiveMode: true
			});

			this.loaded = true;
			this.loadedAt = Date.now();
		} catch (error) {
			console.warn('Interstitial unavailable:', error);
		} finally {
			this.loading = false;
		}
	}

	private finished(): void {
		this.showing = false;
		this.loaded = false;
		void this.preload();
	}

	private async show(): Promise<void> {
		if (this.isWebPlaceholder()) {
			window.alert('Test interstitial advertisement');
			return;
		}

		if (!this.isSupported() || !this.initialised || this.showing) {
			return;
		}

		if (Date.now() - this.loadedAt > 50 * 60 * 1000) {
			this.loaded = false;
		}

		if (!this.loaded) {
			void this.preload();
			return;
		}

		this.loaded = false;
		this.showing = true;

		try {
			await AdMob.showInterstitial();
		} catch (error) {
			console.warn('Interstitial failed:', error);

			if (this.showing) {
				this.finished();
			}
		}
	}

	inspect(message: Message): void {
		if (!this.isSupported() && !this.isWebPlaceholder()) {
			return;
		}

		if (!Array.isArray(message.embeds)) {
			return;
		}

		const dead = message.embeds.some(embed =>
			embed.image?.url.endsWith('/death.png')
		);

		if (dead && !this.deathSeen) {
			this.deathSeen = true;
			void this.show();
		} else if (!dead) {
			this.deathSeen = false;
		}

		if (!this.loaded && !dead) {
			void this.preload();
		}
	}

	reset(): void {
		this.deathSeen = false;
	}

	async privacyOptions(): Promise<void> {
		if (this.isSupported()) {
			await AdMob.showPrivacyOptionsForm();
		}
	}
}

export const ads = new Ads();