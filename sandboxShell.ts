import { NativeModules, Platform } from 'react-native';

type SandboxShellNative = {
  showChrome: (title: string) => Promise<void>;
  hideChrome: () => Promise<void>;
  showTransitionCover: () => Promise<void>;
  clearDeepLinkIntent: () => Promise<void>;
  reloadToFetchedUpdate: () => Promise<void>;
  returnToLauncher: () => Promise<void>;
};

const native = NativeModules.SandboxShell as SandboxShellNative | undefined;

/** Matches launcher background — masks expo-updates remount gap. */
export const RELOAD_SCREEN = {
  backgroundColor: '#f2f4f6',
  fade: true,
  spinner: {
    enabled: true,
    color: '#3182f6',
    size: 'medium' as const,
  },
};

export const sandboxShell = {
  available: Platform.OS === 'android' && native != null,

  async showChrome(title: string) {
    if (!native) return;
    await native.showChrome(title);
  },

  async hideChrome() {
    if (!native) return;
    await native.hideChrome();
  },

  async showTransitionCover() {
    if (!native?.showTransitionCover) return;
    await native.showTransitionCover();
  },

  async clearDeepLinkIntent() {
    if (!native?.clearDeepLinkIntent) return;
    await native.clearDeepLinkIntent();
  },

  async reloadToFetchedUpdate() {
    if (!native) {
      const Updates = await import('expo-updates');
      await Updates.reloadAsync({ reloadScreenOptions: RELOAD_SCREEN });
      return;
    }
    await native.reloadToFetchedUpdate();
  },

  async returnToLauncher() {
    if (!native) return;
    await native.returnToLauncher();
  },
};
