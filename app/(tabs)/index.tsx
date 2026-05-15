import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useListStore } from "../../src/stores/listStore";
import { ListItem, ProductInfo } from "../../src/types";

async function fetchProductInfo(itemName: string): Promise<ProductInfo> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error("API anahtarı bulunamadı");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Türkiye'deki büyük marketlerde (Migros, CarrefourSA, A101, BİM, Şok) "${itemName}" ürününün hangi bölümde olduğunu, o bölümde yakınında yer alan 3-4 ürünü ve alırken dikkat edilmesi gereken kısa bir ipucunu söyle. Sadece şu JSON formatında cevap ver, başka hiçbir şey yazma: {"section":"bölüm adı","nearbyProducts":["ürün1","ürün2","ürün3"],"tips":"ipucu"}`,
              },
            ],
          },
        ],
        generationConfig: { maxOutputTokens: 512, thinkingConfig: { thinkingBudget: 0 } },
      }),
    },
  );

  if (!response.ok) throw new Error(`API hatası: ${response.status}`);

  const data = await response.json();
  const text: string = data.candidates[0].content.parts[0].text;
  const codeBlock = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  const jsonStr = codeBlock ? codeBlock[1] : text.match(/\{[\s\S]*\}/)?.[0];
  if (!jsonStr) throw new Error("Geçersiz API cevabı");

  const parsed = JSON.parse(jsonStr);
  return {
    section: parsed.section,
    nearbyProducts: parsed.nearbyProducts,
    tips: parsed.tips,
    fromCache: false,
  };
}

export default function HomeScreen() {
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useSpeechRecognitionEvent("result", (e) => {
    const text = e.results[0]?.transcript ?? "";
    if (text) {
      setInputText(text);
      if (e.isFinal) {
        setIsListening(false);
        ExpoSpeechRecognitionModule.stop();
      }
    }
  });

  useSpeechRecognitionEvent("end", () => setIsListening(false));
  useSpeechRecognitionEvent("error", () => setIsListening(false));

  const toggleListening = async () => {
    if (isListening) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) return;
    setInputText("");
    setIsListening(true);
    ExpoSpeechRecognitionModule.start({ lang: "tr-TR", interimResults: true });
  };
  const {
    currentList,
    addItem,
    toggleItem,
    deleteItem,
    updateNote,
    setProductInfo,
    saveCurrentList,
  } = useListStore();
  const [inputText, setInputText] = useState("");
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null);
  const [noteText, setNoteText] = useState("");
  const [noteModalVisible, setNoteModalVisible] = useState(false);

  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoItem, setInfoItem] = useState<ListItem | null>(null);
  const [infoData, setInfoData] = useState<ProductInfo | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);

  const handleProductInfo = async (item: ListItem) => {
    setInfoItem(item);
    setInfoError(null);

    if (item.productInfo) {
      setInfoData({ ...item.productInfo, fromCache: true });
      setInfoModalVisible(true);
      return;
    }

    setInfoData(null);
    setInfoLoading(true);
    setInfoModalVisible(true);

    try {
      const info = await fetchProductInfo(item.name);
      setProductInfo(item.id, info);
      setInfoData(info);
    } catch (e: any) {
      setInfoError(e.message ?? "Bilgi alınamadı");
    } finally {
      setInfoLoading(false);
    }
  };

  const checkedCount = currentList.items.filter((i) => i.checked).length;
  const totalCount = currentList.items.length;

  const handleAdd = () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText("");

    const units = [
      "kg",
      "gr",
      "g",
      "lt",
      "litre",
      "ml",
      "adet",
      "paket",
      "şişe",
      "kutu",
      "demet",
      "tane",
    ];
    const unitPattern = units.join("|");

    // "2kg elma", "2 kg elma", "elma 2kg", "elma 2 kg" hepsini yakala
    const regex = new RegExp(
      `^(?:(\\d+(?:[.,]\\d+)?)\\s*(${unitPattern})?\\s+)?(.+?)(?:\\s+(\\d+(?:[.,]\\d+)?)\\s*(${unitPattern})?)?$`,
      "i",
    );

    let name = text;
    let quantity = 1;
    let unit = "adet";

    // Önce başta sayı var mı? "2kg elma" veya "2 kg elma"
    const startNum = text.match(
      new RegExp(`^(\\d+(?:[.,]\\d+)?)\\s*(${unitPattern})?\\s+(.+)$`, "i"),
    );
    // Sonda sayı var mı? "elma 2kg" veya "elma 2 kg"
    const endNum = text.match(
      new RegExp(`^(.+?)\\s+(\\d+(?:[.,]\\d+)?)\\s*(${unitPattern})?$`, "i"),
    );

    if (startNum) {
      quantity = parseFloat(startNum[1].replace(",", "."));
      unit = startNum[2]?.toLowerCase() || "adet";
      name = startNum[3];
    } else if (endNum) {
      name = endNum[1];
      quantity = parseFloat(endNum[2].replace(",", "."));
      unit = endNum[3]?.toLowerCase() || "adet";
    }

    // İlk harfi büyüt
    name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

    addItem({
      name,
      quantity,
      unit,
      note: "",
      category: "Genel",
    });
  };

  const openNoteModal = (item: ListItem) => {
    setSelectedItem(item);
    setNoteText(item.note);
    setNoteModalVisible(true);
  };

  const saveNote = () => {
    if (selectedItem) {
      updateNote(selectedItem.id, noteText);
    }
    setNoteModalVisible(false);
    setSelectedItem(null);
    setNoteText("");
  };

  const grouped = currentList.items.reduce<Record<string, ListItem[]>>(
    (acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    },
    {},
  );

  const sections = Object.entries(grouped);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>{currentList.name}</Text>
          {totalCount > 0 && (
            <TouchableOpacity style={styles.saveBtn} onPress={saveCurrentList}>
              <Ionicons name="archive-outline" size={16} color="#000" />
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.subtitle}>
          {totalCount === 0
            ? "Liste boş, ürün ekle"
            : `${totalCount} ürün · ${checkedCount} tamamlandı`}
        </Text>
      </View>

      {/* Liste */}
      {totalCount === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="basket-outline" size={64} color="#333" />
          <Text style={styles.emptyText}>Henüz ürün yok</Text>
          <Text style={styles.emptySubtext}>Aşağıdan ürün ekleyebilirsin</Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={([cat]) => cat}
          contentContainerStyle={styles.listContent}
          renderItem={({ item: [category, items] }) => (
            <View>
              <Text style={styles.categoryLabel}>{category}</Text>
              {items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  {/* Checkbox */}
                  <TouchableOpacity
                    onPress={() => toggleItem(item.id)}
                    style={[
                      styles.checkbox,
                      item.checked && styles.checkboxDone,
                    ]}
                  >
                    {item.checked && (
                      <Ionicons name="checkmark" size={13} color="#000" />
                    )}
                  </TouchableOpacity>

                  {/* İsim + Not */}
                  <TouchableOpacity
                    style={styles.itemInfo}
                    onPress={() => openNoteModal(item)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.itemName,
                        item.checked && styles.itemNameDone,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {item.note ? (
                      <Text style={styles.itemNote}>{item.note}</Text>
                    ) : (
                      <Text style={styles.itemNotePlaceholder}>
                        Not ekle...
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.infoBtn}
                    onPress={() => handleProductInfo(item)}
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={20}
                      color="#3b82f6"
                    />
                  </TouchableOpacity>
                  {/* Miktar */}
                  <Text style={styles.itemQty}>
                    {item.quantity} {item.unit}
                  </Text>

                  {/* Sil */}
                  <TouchableOpacity
                    onPress={() => deleteItem(item.id)}
                    style={styles.deleteBtn}
                  >
                    <Ionicons name="trash-outline" size={16} color="#444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        />
      )}

      {/* Quick Add Bar */}
      <View style={styles.addBar}>
        <Ionicons name="add" size={20} color="#555" />
        <TextInput
          style={styles.addInput}
          placeholder="Ürün ekle..."
          placeholderTextColor="#444"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleAdd}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          returnKeyType="done"
        />
        {isFocused || inputText.length > 0 ? (
          <TouchableOpacity style={styles.micBtn} onPress={handleAdd}>
            <Ionicons name="arrow-up" size={18} color="#000" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.micBtn, isListening && styles.micBtnActive]}
            onPress={toggleListening}
          >
            <Ionicons name={isListening ? "stop" : "mic"} size={18} color="#000" />
          </TouchableOpacity>
        )}
      </View>

      {/* Ürün Bilgi Modalı */}
      <Modal
        visible={infoModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setInfoModalVisible(false)}
        />
        <View style={styles.modalSheet}>
          <View style={styles.infoModalHeader}>
            <Text style={styles.modalTitle}>{infoItem?.name}</Text>
            {infoData && (
              <View
                style={[
                  styles.cacheBadge,
                  infoData.fromCache
                    ? styles.cacheBadgeCached
                    : styles.cacheBadgeFresh,
                ]}
              >
                <Text style={styles.cacheBadgeText}>
                  {infoData.fromCache ? "Önbellekten" : "Claude'dan"}
                </Text>
              </View>
            )}
          </View>

          {infoLoading && (
            <View style={styles.infoLoading}>
              <ActivityIndicator color="#3b82f6" />
              <Text style={styles.infoLoadingText}>Bilgi alınıyor...</Text>
            </View>
          )}

          {infoError && <Text style={styles.infoError}>{infoError}</Text>}

          {infoData && !infoLoading && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>Bölüm</Text>
                <View style={styles.infoSectionRow}>
                  <Ionicons name="location-outline" size={16} color="#3b82f6" />
                  <Text style={styles.infoSectionText}>{infoData.section}</Text>
                </View>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>Yakınındaki Ürünler</Text>
                <View style={styles.tagRow}>
                  {infoData.nearbyProducts.map((p) => (
                    <View key={p} style={styles.tag}>
                      <Text style={styles.tagText}>{p}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>İpucu</Text>
                <Text style={styles.infoTip}>{infoData.tips}</Text>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Not Modalı */}
      <Modal
        visible={noteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setNoteModalVisible(false)}
        />
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>{selectedItem?.name} — Not</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="örn: 2 kg, Sütaş marka, organik olsun..."
            placeholderTextColor="#555"
            value={noteText}
            onChangeText={setNoteText}
            multiline
            autoFocus
          />
          <TouchableOpacity style={styles.modalSaveBtn} onPress={saveNote}>
            <Text style={styles.modalSaveTxt}>Kaydet</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f0f" },

  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { color: "#fff", fontSize: 22, fontWeight: "600" },
  subtitle: { color: "#555", fontSize: 13, marginTop: 2 },
  saveBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#4ade80", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
  },
  saveBtnText: { color: "#000", fontSize: 13, fontWeight: "600" },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  emptyText: { color: "#444", fontSize: 16, fontWeight: "500" },
  emptySubtext: { color: "#333", fontSize: 13 },

  listContent: { paddingHorizontal: 16, paddingBottom: 12 },
  categoryLabel: {
    color: "#555",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    borderWidth: 0.5,
    borderColor: "#222",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: { backgroundColor: "#4ade80", borderColor: "#4ade80" },
  itemInfo: { flex: 1 },
  itemName: { color: "#e5e5e5", fontSize: 15 },
  itemNameDone: { color: "#555", textDecorationLine: "line-through" },
  itemNote: { color: "#4ade80", fontSize: 12, marginTop: 2 },
  itemNotePlaceholder: { color: "#333", fontSize: 12, marginTop: 2 },
  itemQty: { color: "#555", fontSize: 13 },
  deleteBtn: { padding: 4 },

  addBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#1a1a1a",
    margin: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: "#222",
  },
  addInput: { flex: 1, color: "#e5e5e5", fontSize: 15 },
  micBtnActive: { backgroundColor: "#ef4444" },
  micBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#4ade80",
    alignItems: "center",
    justifyContent: "center",
  },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  modalSheet: {
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 16,
  },
  modalTitle: { color: "#e5e5e5", fontSize: 16, fontWeight: "500" },
  modalInput: {
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 14,
    color: "#e5e5e5",
    fontSize: 14,
    minHeight: 80,
    borderWidth: 0.5,
    borderColor: "#2a2a2a",
    textAlignVertical: "top",
  },
  modalSaveBtn: {
    backgroundColor: "#4ade80",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  modalSaveTxt: { color: "#000", fontWeight: "600", fontSize: 15 },

  infoBtn: { padding: 4 },

  infoModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  cacheBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  cacheBadgeCached: { backgroundColor: "#1e3a5f" },
  cacheBadgeFresh: { backgroundColor: "#1a3a2a" },
  cacheBadgeText: { color: "#93c5fd", fontSize: 11, fontWeight: "500" },

  infoLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 20,
  },
  infoLoadingText: { color: "#555", fontSize: 14 },

  infoError: { color: "#f87171", fontSize: 14, paddingVertical: 12 },

  infoSection: { marginTop: 16, gap: 6 },
  infoLabel: {
    color: "#555",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  infoSectionRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoSectionText: { color: "#e5e5e5", fontSize: 15 },

  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: {
    backgroundColor: "#1e293b",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: { color: "#93c5fd", fontSize: 13 },

  infoTip: { color: "#a3a3a3", fontSize: 14, lineHeight: 20 },
});
