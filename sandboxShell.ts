import { NativeModules, Platform } from 'react-native';

type SandboxShellNative = {
  showChrome: (title: string) => Promise<void>;
  hideChrome: () => Promise<void>;
  reloadToFetchedUpdate: () => Promise<void>;
  returnToLauncher: () => Promise<void>;
};

const native = NativeModules.SandboxShell as SandboxShellNative | undefined;

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

  async reloadToFetchedUpdate() {
    if (!native) {
      const Updates = await import('expo-updates');
      await Updates.reloadAsync();
      return;
    }
    await native.reloadToFetchedUpdate();
  },

  async returnToLauncher() {
    if (!native) return;
    await native.returnToLauncher();
  },
};
