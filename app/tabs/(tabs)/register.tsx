import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Register() {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultType, setResultType] = useState<'success' | 'error'>('success');
  const [resultText, setResultText] = useState('');

  const handleRegister = async () => {
    if (!username.trim()) {
      setResultType('error');
      setResultText(t('login.enterUsername'));
      setShowResultModal(true);
      return;
    }

    try {
      setLoading(true);

      const checkUrl = `https://moblie-ec4d3-default-rtdb.firebaseio.com/users/${username}.json`;
      const checkResponse = await fetch(checkUrl);

      if (checkResponse.ok) {
        const existingUser = await checkResponse.json();
        if (existingUser) {
          setResultType('error');
          setResultText(t('login.usernameExists'));
          setShowResultModal(true);
          return;
        }
      }

      const newUser = {
        password: password,
        like: {}
      };

      const url = `https://moblie-ec4d3-default-rtdb.firebaseio.com/users/${username}.json`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        setResultType('success');
        setResultText(t('login.registerSuccess'));
        setShowResultModal(true);
        setUsername('');
        setPassword('');
      } else {
        setResultType('error');
        setResultText(t('login.registerFailed'));
        setShowResultModal(true);
      }
    } catch (error) {
      console.error(t('login.registerError'), error);
      setResultType('error');
      setResultText(t('login.registerFailed'));
      setShowResultModal(true);
    } finally {
      setLoading(false);
    }
  };

  const closeResultModal = () => {
    setShowResultModal(false);
    if (resultType === 'success') {
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Modal
        visible={showResultModal}
        transparent
        animationType="fade"
        onRequestClose={closeResultModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconWrap}>
              <Ionicons
                name={resultType === 'success' ? 'checkmark-circle' : 'alert-circle'}
                size={48}
                color={resultType === 'success' ? '#22c55e' : '#ef4444'}
              />
            </View>
            <Text style={styles.modalTitle}>
              {resultType === 'success' ? t('common.success') : t('common.error')}
            </Text>
            <Text style={styles.modalMessage}>{resultText}</Text>
            <TouchableOpacity
              style={[
                styles.modalButton,
                resultType === 'success' ? styles.modalButtonSuccess : styles.modalButtonError
              ]}
              onPress={closeResultModal}
            >
              <Text style={styles.modalButtonText}>
                {resultType === 'success' ? t('login.backToLogin') : t('app.ok')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.languageSwitcherContainer}>
          <LanguageSwitcher />
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
          <Text style={styles.backButtonText}>{t('app.back')}</Text>
        </TouchableOpacity>

        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="person-add" size={50} color="white" />
          </View>
          <Text style={styles.headerTitle}>{t('login.registerButton')}</Text>
          <Text style={styles.headerSubtitle}>{t('login.registerSubtitle')}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Ionicons name="person-outline" size={20} color="#64748b" />
            </View>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder={t('login.enterUsernamePlaceholder')}
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputIconContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#64748b" />
            </View>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={t('login.enterPasswordPlaceholder')}
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color="#64748b"
              />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>{t('login.registering')}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={loading}
            >
              <Ionicons name="person-add-outline" size={20} color="white" />
              <Text style={styles.registerButtonText}>{t('login.registerButton')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Ionicons name="log-in-outline" size={18} color="#3b82f6" />
            <Text style={styles.loginLinkText}>{t('login.haveAccount')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  languageSwitcherContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 6,
  },
  backButtonText: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#3b82f6',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    marginBottom: -20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  inputIconContainer: {
    padding: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1e293b',
  },
  eyeButton: {
    padding: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  loginLinkText: {
    fontSize: 15,
    color: '#3b82f6',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalIconWrap: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonSuccess: {
    backgroundColor: '#22c55e',
  },
  modalButtonError: {
    backgroundColor: '#ef4444',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
