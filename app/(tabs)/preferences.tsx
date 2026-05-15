import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePreferencesStore } from '../../src/stores/preferencesStore';

function ChipList({
  items, onRemove, emptyText,
}: { items: string[]; onRemove: (i: string) => void; emptyText: string }) {
  if (items.length === 0)
    return <Text style={styles.empty}>{emptyText}</Text>;
  return (
    <View style={styles.chipRow}>
      {items.map((item) => (
        <TouchableOpacity key={item} style={styles.chip} onPress={() => onRemove(item)}>
          <Text style={styles.chipText}>{item}</Text>
          <Ionicons name="close" size={13} color="#888" />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function AddInput({ onAdd, placeholder }: { onAdd: (v: string) => void; placeholder: string }) {
  const [value, setValue] = useState('');
  const submit = () => {
    const v = value.trim();
    if (!v) return;
    onAdd(v);
    setValue('');
  };
  return (
    <View style={styles.addRow}>
      <TextInput
        style={styles.addInput}
        placeholder={placeholder}
        placeholderTextColor="#444"
        value={value}
        onChangeText={setValue}
        onSubmitEditing={submit}
        returnKeyType="done"
      />
      <TouchableOpacity style={styles.addBtn} onPress={submit}>
        <Ionicons name="add" size={20} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

export default function PreferencesScreen() {
  const { neverUse, alwaysHave, addNeverUse, removeNeverUse, addAlwaysHave, removeAlwaysHave } =
    usePreferencesStore();

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="close-circle-outline" size={18} color="#f87171" />
            <Text style={styles.sectionTitle}>Kullanmıyorum</Text>
          </View>
          <Text style={styles.sectionDesc}>
            Tarif oluştururken bu malzemeler listene eklenmez.
          </Text>
          <ChipList
            items={neverUse}
            onRemove={removeNeverUse}
            emptyText="Henüz yok — örn: tuz, şeker"
          />
          <AddInput onAdd={addNeverUse} placeholder="Malzeme ekle... (örn: tuz)" />
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="home-outline" size={18} color="#4ade80" />
            <Text style={styles.sectionTitle}>Evde Hep Var</Text>
          </View>
          <Text style={styles.sectionDesc}>
            Bu malzemeleri zaten evin var, tarif listesine eklenmez.
          </Text>
          <ChipList
            items={alwaysHave}
            onRemove={removeAlwaysHave}
            emptyText="Henüz yok — örn: zeytinyağı, karabiber"
          />
          <AddInput onAdd={addAlwaysHave} placeholder="Malzeme ekle... (örn: zeytinyağı)" />
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  scroll: { padding: 20, paddingTop: 12, gap: 16 },

  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { color: '#e5e5e5', fontSize: 16, fontWeight: '600' },
  sectionDesc: { color: '#555', fontSize: 13, lineHeight: 18 },

  divider: { height: 0.5, backgroundColor: '#222' },

  empty: { color: '#333', fontSize: 13, fontStyle: 'italic' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#1a1a1a', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 0.5, borderColor: '#2a2a2a',
  },
  chipText: { color: '#e5e5e5', fontSize: 13 },

  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addInput: {
    flex: 1, backgroundColor: '#1a1a1a', borderRadius: 10, padding: 12,
    color: '#e5e5e5', fontSize: 14, borderWidth: 0.5, borderColor: '#2a2a2a',
  },
  addBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#4ade80', alignItems: 'center', justifyContent: 'center',
  },
});
