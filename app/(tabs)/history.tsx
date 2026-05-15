import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useListStore } from "../../src/stores/listStore";
import { ShoppingList } from "../../src/types";

export default function HistoryScreen() {
  const { savedLists, loadList, cloneList, deleteFromHistory } = useListStore();

  const handleLoad = (list: ShoppingList) => {
    Alert.alert(
      "Load List",
      `"${list.name}" listesini aktif listeye taşı? Mevcut liste kaydedilmez.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Load", onPress: () => loadList(list.id) },
      ]
    );
  };

  const handleDelete = (list: ShoppingList) => {
    Alert.alert(
      "Delete",
      `"${list.name}" geçmişten silinsin mi?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteFromHistory(list.id) },
      ]
    );
  };

  if (savedLists.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="time-outline" size={64} color="#333" />
        <Text style={styles.emptyText}>Henüz kaydedilmiş liste yok</Text>
        <Text style={styles.emptySubtext}>Ana ekranda "Save" butonuna bas</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>{savedLists.length} kayıtlı liste</Text>
      </View>

      <FlatList
        data={savedLists}
        keyExtractor={(l) => l.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item: list }) => {
          const checked = list.items.filter((i) => i.checked).length;
          const total = list.items.length;
          const date = new Date(list.createdAt).toLocaleDateString("tr-TR", {
            day: "numeric", month: "short", year: "numeric",
          });

          return (
            <View style={styles.card}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{list.name}</Text>
                <Text style={styles.cardMeta}>{date} · {total} ürün · {checked} tamamlandı</Text>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => cloneList(list.id)}
                >
                  <Ionicons name="copy-outline" size={18} color="#4ade80" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleLoad(list)}
                >
                  <Ionicons name="arrow-undo-outline" size={18} color="#3b82f6" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleDelete(list)}
                >
                  <Ionicons name="trash-outline" size={18} color="#444" />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },

  empty: { flex: 1, backgroundColor: "#0f0f0f", justifyContent: "center", alignItems: "center", gap: 8 },
  emptyText: { color: "#444", fontSize: 16, fontWeight: "500" },
  emptySubtext: { color: "#333", fontSize: 13 },

  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  title: { color: "#fff", fontSize: 22, fontWeight: "600" },
  subtitle: { color: "#555", fontSize: 13, marginTop: 2 },

  listContent: { paddingHorizontal: 16, paddingBottom: 24 },

  card: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#1a1a1a", borderRadius: 12,
    padding: 14, marginBottom: 8,
    borderWidth: 0.5, borderColor: "#222",
  },
  cardInfo: { flex: 1, gap: 4 },
  cardName: { color: "#e5e5e5", fontSize: 15, fontWeight: "500" },
  cardMeta: { color: "#555", fontSize: 12 },

  cardActions: { flexDirection: "row", gap: 4 },
  actionBtn: { padding: 6 },
});
