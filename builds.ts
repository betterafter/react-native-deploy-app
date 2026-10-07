import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'rnd.sandbox.builds.v1';
const MAX_BUILDS = 30;

export type SavedBuild = {
  id: string;
  manifestUrl: string;
  title: string;
  savedAt: string;
};

export async function loadBuilds(): Promise<SavedBuild[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedBuild[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveAll(builds: SavedBuild[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(builds.slice(0, MAX_BUILDS)));
}

export async function upsertBuild(input: {
  manifestUrl: string;
  title?: string;
}): Promise<SavedBuild[]> {
  const builds = await loadBuilds();
  const title = input.title?.trim() || titleFromManifest(input.manifestUrl);
  const next: SavedBuild = {
    id: input.manifestUrl,
    manifestUrl: input.manifestUrl,
    title,
    savedAt: new Date().toISOString(),
  };
  const without = builds.filter((b) => b.manifestUrl !== input.manifestUrl);
  const merged = [next, ...without];
  await saveAll(merged);
  return merged;
}

export async function removeBuild(manifestUrl: string): Promise<SavedBuild[]> {
  const builds = (await loadBuilds()).filter((b) => b.manifestUrl !== manifestUrl);
  await saveAll(builds);
  return builds;
}

export async function clearBuilds(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

function titleFromManifest(manifestUrl: string): string {
  try {
    const url = new URL(manifestUrl);
    const appId = url.searchParams.get('appId') ?? 'app';
    const id = url.searchParams.get('id');
    return id ? `${appId} · ${id.slice(0, 8)}` : appId;
  } catch {
    return '저장된 빌드';
  }
}
