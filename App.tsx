import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.kicker}>react-native-deploy</Text>
        <Text style={styles.title}>Sandbox</Text>
        <Text style={styles.body}>
          Expo SDK에 포함된 네이티브 기능이 들어 있는 샌드박스입니다. 이 앱이 설치된
          폰에서는 배포한 화면을 여기서 확인하고, 없으면 각 프로젝트 설치 파일로
          테스트합니다.
        </Text>
      </View>
      <StatusBar style="dark" />
    </SafeAreaView>
    </SafeAreaProvider>
  );
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
