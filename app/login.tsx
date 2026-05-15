import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../src/stores/authStore';

export default function LoginScreen() {
  const { signIn, signUp } = useAuthStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    const err = mode === 'login'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password);
    setLoading(false);
    if (err) setError(err);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>🛒</Text>
        <Text style={styles.title}>Market App</Text>
        <Text style={styles.subtitle}>
          {mode === 'login' ? 'Hesabına giriş yap' : 'Yeni hesap oluştur'}
        </Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="E-posta"
            placeholderTextColor="#555"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Şifre"
            placeholderTextColor="#555"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.submitTxt}>
                  {mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
                </Text>
            }
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}>
          <Text style={styles.switchTxt}>
            {mode === 'login'
              ? 'Hesabın yok mu? Kayıt ol'
              : 'Zaten hesabın var mı? Giriş yap'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 32, gap: 8 },
  logo: { fontSize: 48, textAlign: 'center' },
  title: { color: '#fff', fontSize: 26, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: '#555', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  form: { gap: 12 },
  input: {
    backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14,
    color: '#e5e5e5', fontSize: 15,
    borderWidth: 0.5, borderColor: '#2a2a2a',
  },
  error: { color: '#f87171', fontSize: 13 },
  submitBtn: {
    backgroundColor: '#4ade80', borderRadius: 12,
    padding: 15, alignItems: 'center', marginTop: 4,
  },
  submitTxt: { color: '#000', fontWeight: '700', fontSize: 15 },
  switchTxt: { color: '#555', fontSize: 13, textAlign: 'center', marginTop: 24 },
});
