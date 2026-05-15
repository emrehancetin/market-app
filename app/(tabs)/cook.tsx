import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { fetchRecipeIngredients } from '../../src/lib/gemini';
import { useListStore } from '../../src/stores/listStore';
import { usePreferencesStore } from '../../src/stores/preferencesStore';
import { RecipeIngredient } from '../../src/types';

interface IngredientRow extends RecipeIngredient {
  selected: boolean;
  inList: boolean;
}

function alreadyInList(ingName: string, listNames: string[]): boolean {
  const a = ingName.toLowerCase();
  return listNames.some((b) => a.includes(b) || b.includes(a));
}

export default function CookScreen() {
  const { addItem, currentList } = useListStore();
  const { neverUse, alwaysHave } = usePreferencesStore();

  const [mealName, setMealName] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<IngredientRow[]>([]);
  const [added, setAdded] = useState(false);

  useSpeechRecognitionEvent('result', (e) => {
    const text = e.results[0]?.transcript ?? '';
    if (text) {
      setMealName(text);
      if (e.isFinal) {
        setIsListening(false);
        ExpoSpeechRecognitionModule.stop();
      }
    }
  });
  useSpeechRecognitionEvent('end', () => setIsListening(false));
  useSpeechRecognitionEvent('error', () => setIsListening(false));

  const toggleListening = async () => {
    if (isListening) { ExpoSpeechRecognitionModule.stop(); return; }
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) return;
    setMealName('');
    setRows([]);
    setIsListening(true);
    ExpoSpeechRecognitionModule.start({ lang: 'tr-TR', interimResults: true });
  };

  const handleFetch = async () => {
    if (!mealName.trim()) return;
    setLoading(true);
    setError(null);
    setRows([]);
    setAdded(false);

    try {
      const ingredients = await fetchRecipeIngredients(mealName.trim(), neverUse, alwaysHave);
      const listNames = currentList.items.map((i) => i.name.toLowerCase());
      setRows(ingredients.map((ing) => {
        const inList = alreadyInList(ing.name, listNames);
        return { ...ing, selected: !inList, inList };
      }));
    } catch (e: any) {
      setError(e.message ?? 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const toggle = (i: number) =>
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, selected: !r.selected } : r));

  const handleAdd = () => {
    rows.filter((r) => r.selected).forEach((ing) => {
      addItem({
        id: Date.now().toString() + Math.random(),
        name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        note: '',
        category: 'Genel',
      });
    });
    setAdded(true);
  };

  const selectedCount = rows.filter((r) => r.selected).length;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Text style={styles.label}>Bugün ne pişiriyorsun?</Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="örn: tavuk sote, mercimek çorbası..."
            placeholderTextColor="#444"
            value={mealName}
            onChangeText={(t) => { setMealName(t); setRows([]); setAdded(false); }}
            onSubmitEditing={handleFetch}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.iconBtn, isListening && styles.iconBtnRed]}
            onPress={toggleListening}
          >
            <Ionicons name={isListening ? 'stop' : 'mic'} size={18} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, styles.iconBtnGreen, (!mealName.trim() || loading) && styles.iconBtnDisabled]}
            onPress={handleFetch}
            disabled={!mealName.trim() || loading}
          >
            {loading
              ? <ActivityIndicator color="#000" size="small" />
              : <Ionicons name="sparkles" size={18} color="#000" />}
          </TouchableOpacity>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {rows.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{mealName}</Text>
              <Text style={styles.sectionHint}>Listeye eklemek istemediklerine dokun</Text>
            </View>

            {rows.map((row, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.ingRow, !row.selected && styles.ingRowOff]}
                onPress={() => toggle(i)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={row.selected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={row.selected ? '#4ade80' : '#333'}
                />
                <View style={styles.ingInfo}>
                  <Text style={[styles.ingName, !row.selected && styles.ingNameOff]}>
                    {row.name}
                  </Text>
                  <Text style={[styles.ingQty, !row.selected && styles.ingNameOff]}>
                    {row.quantity} {row.unit}
                  </Text>
                </View>
                {row.inList && (
                  <View style={styles.inListBadge}>
                    <Text style={styles.inListText}>Listede var</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {!added ? (
              <TouchableOpacity
                style={[styles.addBtn, selectedCount === 0 && styles.addBtnDisabled]}
                onPress={handleAdd}
                disabled={selectedCount === 0}
              >
                <Ionicons name="cart-outline" size={18} color="#000" />
                <Text style={styles.addBtnText}>{selectedCount} ürünü listeye ekle</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.successRow}>
                <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
                <Text style={styles.successText}>Listeye eklendi!</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  scroll: { padding: 20, paddingTop: 12, gap: 12 },

  label: { color: '#e5e5e5', fontSize: 17, fontWeight: '600', marginBottom: 4 },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14,
    color: '#e5e5e5', fontSize: 15, borderWidth: 0.5, borderColor: '#2a2a2a',
  },
  iconBtn: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center',
  },
  iconBtnRed: { backgroundColor: '#ef4444' },
  iconBtnGreen: { backgroundColor: '#4ade80' },
  iconBtnDisabled: { backgroundColor: '#1a1a1a', opacity: 0.4 },

  error: { color: '#f87171', fontSize: 13 },

  sectionHeader: { marginTop: 8, gap: 2 },
  sectionTitle: { color: '#e5e5e5', fontSize: 15, fontWeight: '600' },
  sectionHint: { color: '#444', fontSize: 12 },

  ingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#1a1a1a', borderRadius: 12, padding: 12,
    borderWidth: 0.5, borderColor: '#222',
  },
  ingRowOff: { opacity: 0.4 },
  ingInfo: { flex: 1 },
  ingName: { color: '#e5e5e5', fontSize: 15 },
  ingNameOff: { color: '#555' },
  ingQty: { color: '#555', fontSize: 12, marginTop: 2 },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#4ade80', borderRadius: 14, padding: 15, marginTop: 4,
  },
  addBtnDisabled: { backgroundColor: '#1a2a1a', opacity: 0.4 },
  addBtnText: { color: '#000', fontWeight: '700', fontSize: 15 },

  successRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  successText: { color: '#4ade80', fontSize: 15, fontWeight: '600' },

  inListBadge: { backgroundColor: '#1e293b', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  inListText: { color: '#3b82f6', fontSize: 11 },
});
