import Constants from 'expo-constants';
import { connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

if (__DEV__) {
  // 웹(브라우저)에서는 localhost로 충분하지만, 실기기(Expo Go)에서는 PC의 LAN IP가 필요함.
  // Expo 개발 서버 주소(hostUri, 예: "192.168.0.26:8081")에서 호스트만 추출해 재사용.
  const hostUri = Constants.expoConfig?.hostUri;
  const emulatorHost = hostUri ? hostUri.split(':')[0] : 'localhost';
  connectFunctionsEmulator(functions, emulatorHost, 5001);
}

export interface HanjaInfo {
  char: string;
  sound: string;
  meaning: string;
  origin: string;
}

export interface RelatedWord {
  word: string;
  meaning: string;
}

export interface Idiom {
  idiom: string;
  meaning: string;
}

export interface HanjaLookupResponse {
  word: string;
  hanja: HanjaInfo[];
  explanation: string;
  example: string;
  relatedWords: RelatedWord[];
  idioms: Idiom[];
}

const hanjaLookupCallable = httpsCallable<{ word: string }, HanjaLookupResponse>(
  functions,
  'hanjaLookup'
);

export async function hanjaLookup(word: string): Promise<HanjaLookupResponse> {
  const result = await hanjaLookupCallable({ word });
  return result.data;
}
