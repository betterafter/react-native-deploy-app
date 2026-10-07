import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import * as Updates from 'expo-updates';

const idleMessage =
  '콘솔의 QR 테스트 빌드를 스캔하면 이 앱이 그 화면을 불러옵니다. 설치 파일 빌드는 각 프로젝트의 APK·IPA로 설치합니다.';

export default function App() {
  const [message, setMessage] = useState(idleMessage);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    async function arm(url: string | null) {
      const manifest = readManifest(url);
      if (!manifest || !active) return;
      if (!Updates.isEnabled) {
        setMessage('이 설치본은 QR 테스트 로딩이 꺼져 있습니다. 샌드박스를 다시 빌드해서 설치하세요.');
        return;
      }
      setBusy(true);
      try {
        Updates.setUpdateURLAndRequestHeadersOverride({
          updateUrl: manifest,
          requestHeaders: {},
        });
        if (active) {
          setMessage('이 빌드를 저장했습니다. 앱을 완전히 종료한 다음 다시 열면 화면이 로드됩니다.');
        }
      } catch (error) {
        if (active) {
          setMessage(error instanceof Error ? error.message : '테스트 주소를 저장하지 못했습니다.');
        }
      } finally {
        if (active) setBusy(false);
      }
    }

    void Linking.getInitialURL().then((url) => {
      void arm(url);
    });
    const subscription = Linking.addEventListener('url', ({ url }) => {
      void arm(url);
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.kicker}>react-native-deploy</Text>
          <Text style={styles.title}>Sandbox</Text>
          {busy ? <ActivityIndicator color="#3182f6" /> : null}
          <Text style={styles.body}>{message}</Text>
        </View>
        <StatusBar style="dark" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function readManifest(url: string | null): string | null {
  if (!url) return null;
  const parsed = Linking.parse(url);
  const raw = parsed.queryParams?.manifest;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string' || !/^https?:\/\//.test(value)) return null;
  return value;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f2f4f6',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 12,
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
    fontSize: 16,
    lineHeight: 24,
  },
});
