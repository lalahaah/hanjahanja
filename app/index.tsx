import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { hanjaLookup, HanjaLookupResponse } from '@/lib/api';
import { loadFavorites, saveFavorites } from '@/lib/favorites';
import { loadRecentSearches, saveRecentSearches } from '@/lib/recent-searches';

export default function HomeScreen() {
  const theme = Colors[useColorScheme() ?? 'light'];

  const [word, setWord] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HanjaLookupResponse | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<HanjaLookupResponse[]>([]);

  useEffect(() => {
    loadRecentSearches().then(setRecentSearches);
    loadFavorites().then(setFavorites);
  }, []);

  const runLookup = async (target: string) => {
    if (!target.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await hanjaLookup(target.trim());
      setResult(data);
      setRecentSearches((prev) => {
        const next = [target.trim(), ...prev.filter((w) => w !== target.trim())];
        saveRecentSearches(next);
        return next;
      });
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

  const handleFavoritePress = (favorite: HanjaLookupResponse) => {
    setWord(favorite.word);
    setError(null);
    setResult(favorite);
  };

  const isFavorited = !!result && favorites.some((f) => f.word === result.word);

  const toggleFavorite = () => {
    if (!result) return;
    setFavorites((prev) => {
      const exists = prev.some((f) => f.word === result.word);
      const next = exists ? prev.filter((f) => f.word !== result.word) : [result, ...prev];
      saveFavorites(next);
      return next;
    });
  };

  const canSearch = !loading && !!word.trim();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled">
        <ThemedView style={styles.header}>
          <ThemedText style={styles.mascot}>🐯</ThemedText>
          <ThemedView style={styles.headerText}>
            <ThemedText style={[styles.title, { color: theme.primaryDark }]}>한자한자</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.icon }]}>
              모르는 단어를 입력하면 한자와 뜻을 풀이해줘요
            </ThemedText>
          </ThemedView>
        </ThemedView>

        <TextInput
          value={word}
          onChangeText={setWord}
          placeholder="단어 입력 (예: 학교)"
          placeholderTextColor={theme.icon}
          style={[
            styles.input,
            { borderColor: theme.cardBorder, color: theme.text, backgroundColor: theme.card },
          ]}
          onSubmitEditing={handleSearchPress}
          returnKeyType="search"
        />

        <Pressable onPress={handleSearchPress} disabled={!canSearch}>
          {({ pressed }) => (
            <ThemedView
              style={[
                styles.searchButton,
                {
                  backgroundColor: canSearch ? theme.primary : theme.primaryDisabled,
                  borderBottomColor: canSearch ? theme.primaryDark : theme.primaryDisabledDark,
                  borderBottomWidth: pressed ? 0 : 4,
                  marginTop: pressed ? 4 : 0,
                },
              ]}>
              <ThemedText style={styles.searchButtonText}>검색</ThemedText>
            </ThemedView>
          )}
        </Pressable>

        {loading && (
          <ThemedView style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <ActivityIndicator color={theme.primary} />
          </ThemedView>
        )}

        {error && !loading && (
          <ThemedView style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <ThemedText style={{ color: theme.danger }}>
              풀이를 가져오지 못했어요: {error}
            </ThemedText>
          </ThemedView>
        )}

        {result && !loading && !error && (
          <ThemedView style={[styles.resultCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <ThemedView style={styles.resultHeaderRow}>
              <ThemedText style={[styles.resultWord, { color: theme.primaryDark }]}>{result.word}</ThemedText>
              <Pressable onPress={toggleFavorite} hitSlop={8}>
                <ThemedText style={styles.favoriteStar}>{isFavorited ? '⭐' : '☆'}</ThemedText>
              </Pressable>
            </ThemedView>

            <ThemedView style={styles.hanjaRow}>
              {result.hanja.map((h, i) => (
                <ThemedView
                  key={i}
                  style={[styles.hanjaBadge, { backgroundColor: theme.secondary }]}>
                  <ThemedText style={styles.hanjaChar}>{h.char}</ThemedText>
                  <ThemedText style={styles.hanjaSound}>{h.sound}</ThemedText>
                  <ThemedText style={styles.hanjaMeaning}>{h.meaning}</ThemedText>
                </ThemedView>
              ))}
            </ThemedView>

            <ThemedText style={styles.explanation}>{result.explanation}</ThemedText>

            {result.hanja.some((h) => h.origin) && (
              <ThemedView style={styles.section}>
                <ThemedText style={[styles.sectionTitle, { color: theme.secondaryDark }]}>
                  📜 한자 이야기
                </ThemedText>
                {result.hanja.map((h, i) => (
                  <ThemedText key={i} style={styles.sectionBody}>
                    {h.char}({h.sound}) — {h.origin}
                  </ThemedText>
                ))}
              </ThemedView>
            )}

            {!!result.example && (
              <ThemedView style={styles.section}>
                <ThemedText style={[styles.sectionTitle, { color: theme.secondaryDark }]}>
                  ✏️ 예문
                </ThemedText>
                <ThemedText style={styles.sectionBody}>{result.example}</ThemedText>
              </ThemedView>
            )}

            {result.relatedWords?.length > 0 && (
              <ThemedView style={styles.section}>
                <ThemedText style={[styles.sectionTitle, { color: theme.secondaryDark }]}>
                  🔗 비슷한 단어
                </ThemedText>
                <ThemedView style={styles.chipWrap}>
                  {result.relatedWords.map((rw, i) => (
                    <Pressable
                      key={i}
                      style={[styles.recentChip, { borderColor: theme.secondary }]}
                      onPress={() => runLookup(rw.word)}>
                      <ThemedText style={{ color: theme.secondaryDark, fontWeight: '700' }}>
                        {rw.word}
                      </ThemedText>
                      <ThemedText style={[styles.relatedMeaning, { color: theme.icon }]}>
                        {rw.meaning}
                      </ThemedText>
                    </Pressable>
                  ))}
                </ThemedView>
              </ThemedView>
            )}

            {result.idioms?.length > 0 && (
              <ThemedView style={styles.section}>
                <ThemedText style={[styles.sectionTitle, { color: theme.secondaryDark }]}>
                  🧧 관련 사자성어
                </ThemedText>
                {result.idioms.map((idiom, i) => (
                  <ThemedView key={i} style={styles.idiomRow}>
                    <ThemedText style={[styles.idiomText, { color: theme.primaryDark }]}>
                      {idiom.idiom}
                    </ThemedText>
                    <ThemedText style={styles.sectionBody}>{idiom.meaning}</ThemedText>
                  </ThemedView>
                ))}
              </ThemedView>
            )}
          </ThemedView>
        )}

        {favorites.length > 0 && (
          <>
            <ThemedText style={[styles.recentTitle, { color: theme.icon }]}>⭐ 즐겨찾기</ThemedText>
            <FlatList
              data={favorites}
              keyExtractor={(item) => item.word}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.recentFlatList}
              contentContainerStyle={styles.recentList}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.recentChip, { borderColor: theme.primary }]}
                  onPress={() => handleFavoritePress(item)}>
                  <ThemedText style={{ color: theme.primaryDark, fontWeight: '700' }}>{item.word}</ThemedText>
                </Pressable>
              )}
            />
          </>
        )}

        {recentSearches.length > 0 && (
          <>
            <ThemedText style={[styles.recentTitle, { color: theme.icon }]}>최근 검색</ThemedText>
            <FlatList
              data={recentSearches}
              keyExtractor={(item) => item}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.recentFlatList}
              contentContainerStyle={styles.recentList}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.recentChip, { borderColor: theme.secondary }]}
                  onPress={() => handleRecentPress(item)}>
                  <ThemedText style={{ color: theme.secondaryDark, fontWeight: '700' }}>{item}</ThemedText>
                </Pressable>
              )}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 20,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mascot: {
    fontSize: 40,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
  },
  input: {
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  searchButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  resultCard: {
    borderWidth: 2,
    borderRadius: 20,
    padding: 18,
    gap: 12,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      },
    }),
  },
  resultHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  favoriteStar: {
    fontSize: 24,
  },
  resultWord: {
    fontSize: 22,
    fontWeight: '800',
  },
  hanjaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  hanjaBadge: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 76,
    gap: 2,
  },
  hanjaChar: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  hanjaSound: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  hanjaMeaning: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
  },
  explanation: {
    lineHeight: 22,
    fontSize: 15,
  },
  section: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relatedMeaning: {
    fontSize: 11,
    marginTop: 2,
  },
  idiomRow: {
    gap: 1,
  },
  idiomText: {
    fontSize: 15,
    fontWeight: '800',
  },
  recentTitle: {
    marginTop: 4,
    fontWeight: '700',
    fontSize: 13,
  },
  recentFlatList: {
    flexGrow: 0,
  },
  recentList: {
    gap: 8,
    alignItems: 'center',
  },
  recentChip: {
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
