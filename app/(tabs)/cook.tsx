import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchRecipeIngredients } from '../../src/lib/gemini';
import { useListStore } from '../../src/stores/listStore';
import { usePreferencesStore } from '../../src/stores/preferencesStore';
import { RecipeIngredient } from '../../src/types';

function matches(ingredient: string, preference: string): boolean {
  return ingredient.toLowerCase().includes(preference.toLowerCase()) ||
    preference.toLowerCase().includes(ingredient.toLowerCase());
}

export default function CookScreen() {
  const { addItem } = useListStore();
  const { neverUse, alwaysHave } = usePreferencesStore();

  const [mealName, setMealName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [added, setAdded] = useState(false);

  const handleFetch = async () => {
    if (!mealName.trim()) return;
    setLoading(true);
    setError(null);
    setIngredients([]);
    setAdded(false);

    try {
      const raw = await fetchRecipeIngredients(mealName.trim());

      const filtered = raw.map((ing) => {
        if (neverUse.some((p) => matches(ing.name, p)))
          return { ...ing, filteredReason: 'neverUse' as const };
        if (alwaysHave.some((p) => matches(ing.name, p)))
          return { ...ing, filteredReason: 'alwaysHave' as const };
        return ing;
      });

      setIngredients(filtered);
    } catch (e: any) {
      setError(e.message ?? 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    const toAdd = ingredients.filter((i) => !i.filteredReason);
    toAdd.forEach((ing) => {
      const id = Date.now().toString() + Math.random();
      addItem({ name: ing.name, quantity: ing.quantity, unit: ing.unit, note: '', category: 'Genel', id });
    });
    setAdded(true);
  };

  const activeCount = ingredients.filter((i) => !i.filteredReason).length;

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
            onChangeText={(t) => { setMealName(t); setIngredients([]); setAdded(false); }}
            onSubmitEditing={handleFetch}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.fetchBtn, !mealName.trim() && styles.fetchBtnDisabled]}
            onPress={handleFetch}
            disabled={!mealName.trim() || loading}
          >
            {loading
              ? <ActivityIndicator color="#000" size="small" />
              : <Ionicons name="sparkles" size={18} color="#000" />}
          </TouchableOpacity>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        {ingredients.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{mealName} — Malzemeler</Text>

            {ingredients.map((ing, i) => {
              const filtered = !!ing.filteredReason;
              return (
                <View key={i} style={[styles.ingRow, filtered && styles.ingRowFiltered]}>
                  <Ionicons
                    name={filtered ? 'close-circle-outline' : 'checkmark-circle-outline'}
                    size={18}
                    color={filtered ? '#555' : '#4ade80'}
                  />
                  <View style={styles.ingInfo}>
                    <Text style={[styles.ingName, filtered && styles.ingNameFiltered]}>
                      {ing.name}
                    </Text>
                    <Text style={[styles.ingQty, filtered && styles.ingNameFiltered]}>
                      {ing.quantity} {ing.unit}
                    </Text>
                  </View>
                  {ing.filteredReason && (
                    <View style={[styles.badge,
                      ing.filteredReason === 'neverUse' ? styles.badgeNever : styles.badgeHave]}>
                      <Text style={styles.badgeText}>
                        {ing.filteredReason === 'neverUse' ? 'Kullanmıyorsun' : 'Evde var'}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}

            {!added ? (
              <TouchableOpacity
                style={[styles.addBtn, activeCount === 0 && styles.addBtnDisabled]}
                onPress={handleAdd}
                disabled={activeCount === 0}
              >
                <Ionicons name="cart-outline" size={18} color="#000" />
                <Text style={styles.addBtnText}>
                  {activeCount} ürünü listeye ekle
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.successRow}>
                <Ionicons name="checkmark-circle" size={20} color="#4ade80" />
                <Text style={styles.successText}>Liste ekle!</Text>
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
  inputRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  input: {
    flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14,
    color: '#e5e5e5', fontSize: 15, borderWidth: 0.5, borderColor: '#2a2a2a',
  },
  fetchBtn: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: '#4ade80', alignItems: 'center', justifyContent: 'center',
  },
  fetchBtnDisabled: { backgroundColor: '#1a1a1a' },
  error: { color: '#f87171', fontSize: 13 },

  sectionTitle: { color: '#555', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 },

  ingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#1a1a1a', borderRadius: 12, padding: 12,
    borderWidth: 0.5, borderColor: '#222',
  },
  ingRowFiltered: { opacity: 0.45 },
  ingInfo: { flex: 1 },
  ingName: { color: '#e5e5e5', fontSize: 15 },
  ingNameFiltered: { color: '#555' },
  ingQty: { color: '#555', fontSize: 12, marginTop: 2 },

  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeNever: { backgroundColor: '#2d1515' },
  badgeHave: { backgroundColor: '#1a2d1a' },
  badgeText: { color: '#888', fontSize: 11 },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#4ade80', borderRadius: 14, padding: 15, marginTop: 8,
  },
  addBtnDisabled: { backgroundColor: '#1a1a1a' },
  addBtnText: { color: '#000', fontWeight: '700', fontSize: 15 },

  successRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  successText: { color: '#4ade80', fontSize: 15, fontWeight: '600' },
});
