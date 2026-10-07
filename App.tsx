import { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import * as Updates from 'expo-updates';
import {
  clearBuilds,
  loadBuilds,
  removeBuild,
  type SavedBuild,
  upsertBuild,
} from './builds';

export default function App() {
  const [builds, setBuilds] = useState<SavedBuild[]>([]);
  const [message, setMessage] = useState('콘솔 QR을 스캔하면 아래에 저장됩니다. 항목을 누르면 실행합니다.');
  const [busy, setBusy] = useState(false);
  const [booting, setBooting] = useState(true);

  const refresh = useCallback(async () => {
    setBuilds(await loadBuilds());
  }, []);

  const saveFromUrl = useCallback(
    async (url: string | null) => {
      if (isHomeUrl(url)) {
        setMessage('런처입니다. 저장된 빌드를 눌러 실행하세요.');
        await refresh();
        return;
      }
      const parsed = readTestLink(url);
      if (!parsed) return;
      const next = await upsertBuild(parsed);
      setBuilds(next);
      setMessage(`저장됨: ${next[0]?.title ?? '빌드'}. 아래 목록에서 눌러 실행하세요.`);
    },
    [refresh],
  );

  const openBuild = useCallback(async (build: SavedBuild) => {
    if (!Updates.isEnabled) {
      setMessage('이 설치본은 QR 테스트 로딩이 꺼져 있습니다. 샌드박스를 다시 빌드해서 설치하세요.');
      return;
    }
    setBusy(true);
    setMessage(`${build.title} 다운로드 중…`);
    try {
      Updates.setUpdateURLAndRequestHeadersOverride({
        updateUrl: build.manifestUrl,
        requestHeaders: {},
      });
      const result = await Updates.fetchUpdateAsync();
      // reloadAsync() often kills the activity without relaunching on this setup.
      // Soft-restart via rnd-sandbox://run so the downloaded update actually opens.
      setMessage(
        result.isNew
          ? '다운로드 완료. 앱을 다시 여는 중…'
          : '준비됨. 앱을 다시 여는 중…',
      );
      await Linking.openURL('rnd-sandbox://run');
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : '빌드를 실행하지 못했습니다. 앱을 완전히 종료한 뒤 다시 열어 보세요.',
      );
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      await refresh();
      if (!active) return;
      const initial = await Linking.getInitialURL();
      await saveFromUrl(initial);
      if (active) setBooting(false);
    })();
    const subscription = Linking.addEventListener('url', ({ url }) => {
      void saveFromUrl(url);
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, [refresh, saveFromUrl]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.kicker}>react-native-deploy</Text>
          <Text style={styles.title}>Sandbox</Text>
          <Text style={styles.body}>{message}</Text>
          {busy || booting ? <ActivityIndicator color="#3182f6" style={styles.spinner} /> : null}
        </View>

        <FlatList
          data={builds}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>아직 저장된 빌드가 없습니다.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Pressable
                style={styles.cardMain}
                disabled={busy}
                onPress={() => void openBuild(item)}
              >
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardMeta}>{formatWhen(item.savedAt)}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="삭제"
                disabled={busy}
                onPress={() => {
                  void removeBuild(item.manifestUrl).then(setBuilds);
                }}
                style={styles.deleteBtn}
              >
                <Text style={styles.deleteText}>삭제</Text>
              </Pressable>
            </View>
          )}
        />

        {builds.length > 0 ? (
          <Pressable
            disabled={busy}
            onPress={() => {
              void clearBuilds().then(() => {
                setBuilds([]);
                setMessage('저장 목록을 비웠습니다.');
              });
            }}
            style={styles.clearBtn}
          >
            <Text style={styles.clearText}>목록 비우기</Text>
          </Pressable>
        ) : null}
        <StatusBar style="dark" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function isHomeUrl(url: string | null): boolean {
  if (!url) return false;
  const parsed = Linking.parse(url);
  const path = (parsed.path ?? '').replace(/^\//, '');
  return parsed.scheme === 'rnd-sandbox' && (parsed.hostname === 'home' || path === 'home');
}

function readTestLink(url: string | null): { manifestUrl: string; title?: string } | null {
  if (!url) return null;
  const parsed = Linking.parse(url);
  if (parsed.scheme !== 'rnd-sandbox') return null;
  const raw = parsed.queryParams?.manifest;
  const manifest = Array.isArray(raw) ? raw[0] : raw;
  if (typeof manifest !== 'string' || !/^https?:\/\//.test(manifest)) return null;
  const titleRaw = parsed.queryParams?.title;
  const title = Array.isArray(titleRaw) ? titleRaw[0] : titleRaw;
  return {
    manifestUrl: manifest,
    title: typeof title === 'string' ? title : undefined,
  };
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${day} ${hh}:${mm}`;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f2f4f6',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  kicker: {
    color: '#3182f6',
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    color: '#191f28',
    fontSize: 32,
    fontWeight: '800',
  },
  body: {
    color: '#4e5968',
    fontSize: 15,
    lineHeight: 22,
  },
  spinner: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  empty: {
    color: '#8b95a1',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e8eb',
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cardMain: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  cardTitle: {
    color: '#191f28',
    fontSize: 16,
    fontWeight: '700',
  },
  cardMeta: {
    color: '#8b95a1',
    fontSize: 12,
  },
  deleteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  deleteText: {
    color: '#f04452',
    fontSize: 13,
    fontWeight: '600',
  },
  clearBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  clearText: {
    color: '#8b95a1',
    fontSize: 13,
    fontWeight: '600',
  },
});
