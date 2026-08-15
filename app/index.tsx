import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { hanjaLookup, HanjaLookupResponse } from '@/lib/api';

// Phase 4에서 AsyncStorage로 교체 예정
const DUMMY_RECENT_SEARCHES = ['학교', '가족', '친구'];

export default function HomeScreen() {
  const [word, setWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HanjaLookupResponse | null>(null);
  const [recentSearches, setRecentSearches] = useState(DUMMY_RECENT_SEARCHES);

  const runLookup = async (target: string) => {
    if (!target.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await hanjaLookup(target.trim());
      setResult(data);
      setRecentSearches((prev) => [
        target.trim(),
        ...prev.filter((w) => w !== target.trim()),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchPress = () => runLookup(word);

  const handleRecentPress = (recentWord: string) => {
    setWord(recentWord);
    runLookup(recentWord);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <ThemedText type="title">한자한자</ThemedText>
        <ThemedText style={styles.subtitle}>
          모르는 단어를 입력하면 한자와 뜻을 풀이해줘요
        </ThemedText>

        <ThemedView style={styles.searchRow}>
          <TextInput
            value={word}
            onChangeText={setWord}
            placeholder="단어 입력 (예: 학교)"
            style={styles.input}
            onSubmitEditing={handleSearchPress}
            returnKeyType="search"
          />
          <Pressable
            style={[styles.searchButton, (loading || !word.trim()) && styles.searchButtonDisabled]}
            onPress={handleSearchPress}
            disabled={loading || !word.trim()}>
            <ThemedText style={styles.searchButtonText}>검색</ThemedText>
          </Pressable>
        </ThemedView>

        {loading && (
          <ThemedView style={styles.resultBox}>
            <ActivityIndicator />
          </ThemedView>
        )}

        {error && !loading && (
          <ThemedView style={styles.resultBox}>
            <ThemedText style={styles.errorText}>
              풀이를 가져오지 못했어요: {error}
            </ThemedText>
          </ThemedView>
        )}

        {result && !loading && !error && (
          <ThemedView style={styles.resultBox}>
            <ThemedText type="subtitle">{result.word}</ThemedText>
            {result.hanja.map((h, i) => (
              <ThemedText key={i} style={styles.hanjaLine}>
                {h.char} ({h.sound}) — {h.meaning}
              </ThemedText>
            ))}
            <ThemedText style={styles.explanation}>{result.explanation}</ThemedText>
          </ThemedView>
        )}

        <ThemedText type="defaultSemiBold" style={styles.recentTitle}>
          최근 검색
        </ThemedText>
        <FlatList
          data={recentSearches}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.recentFlatList}
          contentContainerStyle={styles.recentList}
          renderItem={({ item }) => (
            <Pressable style={styles.recentChip} onPress={() => handleRecentPress(item)}>
              <ThemedText>{item}</ThemedText>
            </Pressable>
          )}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  subtitle: {
    opacity: 0.7,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  resultBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    gap: 6,
  },
  hanjaLine: {
    fontSize: 18,
  },
  explanation: {
    marginTop: 8,
    lineHeight: 22,
  },
  errorText: {
    color: '#d33',
  },
  recentTitle: {
    marginTop: 8,
  },
  recentFlatList: {
    flexGrow: 0,
  },
  recentList: {
    gap: 8,
    alignItems: 'center',
  },
  recentChip: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
