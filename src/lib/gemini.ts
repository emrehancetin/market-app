import { ProductInfo, RecipeIngredient } from '../types';

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

const LOCAL_LOOKUP: [string[], string][] = [
  [
    ['elma', 'armut', 'muz', 'portakal', 'mandalina', 'limon', 'üzüm', 'çilek', 'kiraz', 'şeftali',
     'kayısı', 'erik', 'karpuz', 'kavun', 'incir', 'nar', 'avokado', 'ananas', 'mango', 'greyfurt',
     'domates', 'salatalık', 'biber', 'patlıcan', 'kabak', 'soğan', 'sarımsak', 'patates', 'havuç',
     'ıspanak', 'marul', 'maydanoz', 'dereotu', 'nane', 'roka', 'pırasa', 'kereviz', 'brokoli',
     'karnabahar', 'lahana', 'bezelye', 'enginar', 'turp', 'pancar', 'taze fasulye', 'taze soğan',
     'kuru soğan', 'tatlı patates', 'zencefil'],
    'Meyve & Sebze',
  ],
  [
    ['süt', 'yoğurt', 'peynir', 'kaşar', 'beyaz peynir', 'tulum', 'çökelek', 'lor', 'labne',
     'tereyağı', 'margarin', 'krema', 'yumurta', 'ayran', 'kefir', 'reçel', 'bal', 'pekmez',
     'tahin', 'helva', 'zeytin', 'nutella', 'çikolata spread'],
    'Süt & Kahvaltı',
  ],
  [
    ['tavuk', 'piliç', 'dana', 'kuzu', 'kıyma', 'köfte', 'bonfile', 'antrikot', 'biftek', 'pirzola',
     'but', 'göğüs', 'kanat', 'bütün tavuk', 'hindi', 'balık', 'somon', 'levrek', 'çipura',
     'karides', 'midye', 'ton balığı', 'sucuk', 'salam', 'sosis', 'pastırma', 'jambon', 'kavurma'],
    'Et & Tavuk',
  ],
  [
    ['ekmek', 'somun', 'pide', 'simit', 'poğaça', 'açma', 'çörek', 'kruvasan', 'sandviç', 'tost',
     'börek', 'pasta', 'kek', 'kurabiye', 'baklava', 'kadayıf', 'revani'],
    'Ekmek & Fırın',
  ],
  [
    ['su', 'maden suyu', 'soda', 'çay', 'kahve', 'nescafe', 'türk kahvesi', 'meyve suyu', 'nektar',
     'kola', 'fanta', 'sprite', 'gazoz', 'ayran', 'bira', 'şarap', 'viski', 'rakı', 'limonata',
     'ice tea', 'enerji içeceği', 'smoothie', 'komposto'],
    'İçecekler',
  ],
  [
    ['un', 'şeker', 'tuz', 'pirinç', 'bulgur', 'makarna', 'erişte', 'yufka', 'yağ', 'zeytinyağı',
     'ayçiçeği yağı', 'mısır yağı', 'sirke', 'ketçap', 'mayonez', 'hardal', 'sos', 'salça',
     'mercimek', 'nohut', 'fasulye', 'barbunya', 'bakla', 'soya', 'mısır', 'bezelye', 'konserve',
     'baharat', 'karabiber', 'kimyon', 'pul biber', 'kırmızı biber', 'köri', 'tarçın', 'karanfil',
     'defne', 'baking soda', 'kabartma tozu', 'maya', 'nişasta', 'çorba', 'hazır çorba'],
    'Temel Gıda',
  ],
  [
    ['deterjan', 'çamaşır suyu', 'yumuşatıcı', 'bulaşık', 'tuvalet kağıdı', 'kağıt havlu', 'peçete',
     'çöp torbası', 'sünger', 'bez', 'fırça', 'paspas', 'temizleyici', 'javel', 'çamaşır deterjanı'],
    'Temizlik',
  ],
  [
    ['şampuan', 'saç kremi', 'saç maskesi', 'sabun', 'vücut şampuanı', 'duş jeli', 'diş macunu',
     'diş fırçası', 'ağız suyu', 'deodorant', 'kolonya', 'parfüm', 'krem', 'nemlendirici', 'losyon',
     'güneş kremi', 'makyaj', 'ruj', 'fondöten', 'traş', 'traş köpüğü', 'pamuk', 'ped', 'tampon'],
    'Kişisel Bakım',
  ],
  [
    ['dondurma', 'dondurulmuş', 'donmuş', 'buzluk'],
    'Dondurulmuş',
  ],
  [
    ['cips', 'çikolata', 'bisküvi', 'gofret', 'kraker', 'kuruyemiş', 'fındık', 'fıstık', 'badem',
     'ceviz', 'antep fıstığı', 'kaju', 'çekirdek', 'leblebi', 'mısır gevreği', 'müsli', 'granola',
     'kuru üzüm', 'kuru kayısı', 'kuru incir', 'lokum', 'şekerleme', 'sakız', 'çubuk kraker'],
    'Atıştırmalık',
  ],
];

function lookupLocally(itemName: string): string | null {
  const normalized = itemName.toLowerCase();
  for (const [keywords, category] of LOCAL_LOOKUP) {
    if (keywords.some((k) => normalized.includes(k) || k.includes(normalized))) {
      return category;
    }
  }
  return null;
}

const categoryCache = new Map<string, string>();

const CATEGORY_PROMPT = `Bir market ürününün kategorisini belirle. Aşağıdaki listeden SADECE BİRİNİ yaz, başka hiçbir şey yazma:

Meyve & Sebze → elma, armut, muz, domates, salatalık, biber, maydanoz, soğan, patates, ıspanak
Süt & Kahvaltı → süt, yoğurt, peynir, tereyağı, yumurta, reçel, bal, zeytin, labne, kaşar
Et & Tavuk → tavuk, dana, kuzu, kıyma, balık, sucuk, salam, sosis, karides, hindi
Ekmek & Fırın → ekmek, simit, pide, poğaça, börek, pasta, kek, kruvasan
İçecekler → su, çay, kahve, meyve suyu, kola, maden suyu, ayran, bira, limonata
Temel Gıda → un, şeker, tuz, pirinç, makarna, yağ, salça, baharat, konserve, mercimek, nohut
Temizlik → deterjan, çamaşır suyu, tuvalet kağıdı, çöp torbası, sünger, bulaşık deterjanı
Kişisel Bakım → şampuan, sabun, diş macunu, deodorant, krem, traş köpüğü
Dondurulmuş → dondurma, dondurulmuş sebze, dondurulmuş pizza, donmuş ürün
Atıştırmalık → cips, çikolata, bisküvi, gofret, kuruyemiş, fındık, kraker

Ürün: "`;

export async function fetchCategory(itemName: string): Promise<string> {
  const key = itemName.toLowerCase();
  if (categoryCache.has(key)) return categoryCache.get(key)!;

  const local = lookupLocally(itemName);
  if (local) {
    categoryCache.set(key, local);
    return local;
  }

  const text = await callGemini(CATEGORY_PROMPT + itemName + `"`);
  const match = CATEGORIES.find((c) =>
    text.trim().toLowerCase().includes(c.toLowerCase())
  );
  const category = match ?? 'Genel';
  categoryCache.set(key, category);
  return category;
}

export async function fetchRecipeIngredients(mealName: string): Promise<RecipeIngredient[]> {
  const text = await callGemini(
    `"${mealName}" yemeği için Türkiye mutfağında tipik olarak kullanılan malzeme listesini oluştur. 4 kişilik porsiyon. Sadece şu JSON formatında döndür, başka hiçbir şey yazma: {"ingredients":[{"name":"malzeme adı","quantity":2,"unit":"adet"}]}. Birimler için şunları kullan: adet, kg, gr, lt, ml, yemek kaşığı, tatlı kaşığı, çay kaşığı, su bardağı, demet, diş, tutam.`
  );

  const codeBlock = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  const jsonStr = codeBlock ? codeBlock[1] : text.match(/\{[\s\S]*\}/)?.[0];
  if (!jsonStr) throw new Error('Geçersiz API cevabı');

  const parsed = JSON.parse(jsonStr);
  return parsed.ingredients as RecipeIngredient[];
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
