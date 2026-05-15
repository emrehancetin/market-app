import { ProductInfo } from '../types';

const API_URL = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

const CONFIG = { maxOutputTokens: 512, thinkingConfig: { thinkingBudget: 0 } };

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error('API anahtarı bulunamadı');

  const response = await fetch(API_URL(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: CONFIG,
    }),
  });

  if (!response.ok) throw new Error(`API hatası: ${response.status}`);
  const data = await response.json();
  return data.candidates[0].content.parts[0].text as string;
}

export const CATEGORIES = [
  'Meyve & Sebze',
  'Süt & Kahvaltı',
  'Et & Tavuk',
  'Ekmek & Fırın',
  'İçecekler',
  'Temel Gıda',
  'Temizlik',
  'Kişisel Bakım',
  'Dondurulmuş',
  'Atıştırmalık',
  'Genel',
] as const;

const categoryCache = new Map<string, string>();

export async function fetchCategory(itemName: string): Promise<string> {
  const key = itemName.toLowerCase();
  if (categoryCache.has(key)) return categoryCache.get(key)!;

  const list = CATEGORIES.join(', ');
  const text = await callGemini(
    `"${itemName}" ürünü Türkiye marketlerinde hangi kategoriye girer? Sadece şu listeden birini yaz, başka hiçbir şey yazma: ${list}`
  );

  const match = CATEGORIES.find((c) => text.trim().startsWith(c));
  const category = match ?? 'Genel';
  categoryCache.set(key, category);
  return category;
}

export async function fetchProductInfo(itemName: string): Promise<ProductInfo> {
  const text = await callGemini(
    `Türkiye'deki büyük marketlerde (Migros, CarrefourSA, A101, BİM, Şok) "${itemName}" ürününün hangi bölümde olduğunu, o bölümde yakınında yer alan 3-4 ürünü ve alırken dikkat edilmesi gereken kısa bir ipucunu söyle. Sadece şu JSON formatında cevap ver, başka hiçbir şey yazma: {"section":"bölüm adı","nearbyProducts":["ürün1","ürün2","ürün3"],"tips":"ipucu"}`
  );

  const codeBlock = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  const jsonStr = codeBlock ? codeBlock[1] : text.match(/\{[\s\S]*\}/)?.[0];
  if (!jsonStr) throw new Error('Geçersiz API cevabı');

  const parsed = JSON.parse(jsonStr);
  return {
    section: parsed.section,
    nearbyProducts: parsed.nearbyProducts,
    tips: parsed.tips,
    fromCache: false,
  };
}
