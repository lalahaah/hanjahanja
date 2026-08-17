import AsyncStorage from '@react-native-async-storage/async-storage';
import { HanjaLookupResponse } from './api';

const STORAGE_KEY = 'favorite_words';

export async function loadFavorites(): Promise<HanjaLookupResponse[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveFavorites(items: HanjaLookupResponse[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // 저장 실패해도 앱 사용에는 지장 없으므로 조용히 무시
  }
}
