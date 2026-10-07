# react-native-deploy-app

[react-native-deploy](https://github.com/betterafter/react-native-deploy) 콘솔에서 한 번 설치해 두는 샌드박스 앱입니다.

Expo Go가 카메라, 위치, 알림, 파일, 센서처럼 Expo SDK 네이티브를 앱 안에 미리 넣어 두는 것과 같습니다. 이 프로젝트는 [Expo Go가 SDK 57에서 포함하는 네이티브 모듈](https://github.com/expo/expo/blob/sdk-57/apps/expo-go/package.json)을 설치본에 넣습니다. 런타임 버전은 `57.0.0`입니다.

콘솔에 `npx rnd deploy --export`로 올린 화면은 이 앱을 다시 설치하지 않고 QR로 엽니다. 여기 없는 자체 네이티브가 생긴 프로젝트는 그 프로젝트의 APK·IPA로 확인합니다.

QR을 스캔하면 샌드박스가 그 빌드 주소를 저장합니다. 앱을 완전히 종료한 뒤 다시 열면 화면이 로드됩니다. 다른 빌드로 바뀌지 않으면 앱 저장공간을 지운 다음 QR을 다시 스캔하세요. 화면이 켜지자마자 종료되면 샌드박스를 다시 설치합니다.

폰 홈 화면의 앱 이름은 빌드할 때의 `app.json` `name`입니다. 콘솔 상단 띠에 보이는 이름은 그와 별개로, R2에 올린 **파일 이름**입니다.

## 설치 파일 만들기

`app.json`의 `runtimeVersion`과 `updates`가 네이티브 빌드에 들어가야 QR 테스트가 동작합니다. 설정을 바꾼 뒤에는 prebuild부터 다시 하세요.

```bash
npm install
npx expo prebuild
cd android && ./gradlew assembleRelease
```

APK는 `android/app/build/outputs/apk/release/`에 생깁니다. iOS는 Xcode에서 `ios/` 아카이브를 내보냅니다.

테스터에게 보여줄 이름으로 파일을 바꾼 뒤 R2에 올립니다. 파일을 `MySandBox.apk`로 올리면 콘솔 띠는 MySandBox입니다.

콘솔 연결 방법은 [react-native-deploy README의 샌드박스 앱](https://github.com/betterafter/react-native-deploy#샌드박스-앱)을 보면 됩니다.
