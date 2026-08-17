import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'recent_searches';
const MAX_ITEMS = 10;

export async function loadRecentSearches(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveRecentSearches(words: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(words.slice(0, MAX_ITEMS)));
  } catch {
    // 저장 실패해도 앱 사용에는 지장 없으므로 조용히 무시
  }
}
