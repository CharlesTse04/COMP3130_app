
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Switch,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { 
  setLoginCookies, 
  getCurrentUserFromCookies, 
  logoutFromCookies,
  checkCookieValidity 
} from '@/services/cookieService';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Login() {
  const { t, language } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutSuccess, setLogoutSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const logoutSuccessOpacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkAuthCookie = async () => {
      try {
        const validity = await checkCookieValidity();
        
        if (validity.valid) {
          const user = await getCurrentUserFromCookies();
          if (user) {
            setIsLoggedIn(true);
            setUserData(user.data);
            setUsername(user.username);
            console.log(t('login.autoLoginSuccess'));
          }
        } else {
          console.log(t('login.cookieInvalid'), validity.reason);
        }
      } catch (error) {
        console.error(t('login.checkCookieFailed'), error);
      }
    };

    checkAuthCookie();
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert(t('common.error'), t('login.enterUsernamePassword'));
      return;
    }

    try {
      setLoading(true);
      
      const url = `https://moblie-ec4d3-default-rtdb.firebaseio.com/users/${username}.json`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data && data.password == password) {
          const success = await setLoginCookies(username, data, {
            rememberMe: rememberMe
          });
          
          if (success) {
            setIsLoggedIn(true);
            setUserData(data);
            
            Alert.alert(t('common.success'), t('login.loginSuccess'));
            
            setTimeout(() => {
              router.back();
            }, 1500);
          } else {
            Alert.alert(t('common.error'), t('login.cookieSaveFailed'));
          }
          
        } else {
          Alert.alert(t('common.error'), t('login.invalidCredentials'));
        }
      } else {
        Alert.alert(t('common.error'), t('login.userNotFound'));
      }
    } catch (error: any) {
      console.error(t('login.loginError'), error);
      Alert.alert(t('common.error'), t('login.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    try {
      setLoggingOut(true);
      await logoutFromCookies();
      setLoggingOut(false);
      setLogoutSuccess(true);
      logoutSuccessOpacity.setValue(0);
      Animated.timing(logoutSuccessOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setTimeout(() => {
        setIsLoggedIn(false);
        setUserData(null);
        setUsername('');
        setPassword('');
        setLogoutSuccess(false);
      }, 1200);
    } catch (error) {
      console.error(t('login.logoutError'), error);
      setLoggingOut(false);
      Alert.alert(t('common.error'), t('login.logoutFailed'));
    }
  };

  const quickLoginAA123 = () => {
    setUsername('AA123');
    setPassword('123456');
  };

  if (isLoggedIn) {
    return (
      <View style={styles.container}>
        <Modal
          visible={showLogoutConfirm}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLogoutConfirm(false)}
        >
          <View style={styles.logoutModalOverlay}>
            <View style={styles.logoutModalContent}>
              <Text style={styles.logoutModalTitle}>{t('login.confirmLogout')}</Text>
              <Text style={styles.logoutModalMessage}>{t('login.confirmLogoutMessage')}</Text>
              <View style={styles.logoutModalButtons}>
                <TouchableOpacity
                  style={styles.logoutModalCancel}
                  onPress={() => setShowLogoutConfirm(false)}
                >
                  <Text style={styles.logoutModalCancelText}>{t('app.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.logoutModalConfirm}
                  onPress={confirmLogout}
                >
                  <Text style={styles.logoutModalConfirmText}>{t('login.logout')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.languageSwitcherContainer}>
          <LanguageSwitcher />
        </View>
        
        <View style={styles.loggedInHeader}>
          <View style={styles.avatarLarge}>
            <Ionicons name="person" size={60} color="white" />
          </View>
          <Text style={styles.welcomeText}>
            {t('login.welcomeBack')}
          </Text>
          <Text style={styles.usernameText}>{username}</Text>
        </View>
        
        <View style={styles.card}>
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="person-outline" size={22} color="#3b82f6" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('login.username')}</Text>
                <Text style={styles.infoValue}>{username}</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.infoRow}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="heart-outline" size={22} color="#ef4444" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{t('login.favoritesCount')}</Text>
                <Text style={styles.infoValue}>
                  {userData?.like ? Object.keys(userData.like).length : 0} {t('login.schools')}
                </Text>
              </View>
            </View>
          </View>
          
          {!loggingOut && !logoutSuccess && (
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="white" />
              <Text style={styles.logoutButtonText}>{t('login.logout')}</Text>
            </TouchableOpacity>
          )}

          {loggingOut && (
            <View style={styles.logoutOverlay}>
              <ActivityIndicator size="large" color="#ef4444" />
              <Text style={styles.logoutOverlayText}>{t('login.loggingOut')}</Text>
            </View>
          )}

          {logoutSuccess && (
            <Animated.View style={[styles.logoutSuccessOverlay, { opacity: logoutSuccessOpacity }]}>
              <View style={styles.logoutSuccessIconWrap}>
                <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
              </View>
              <Text style={styles.logoutSuccessText}>{t('login.logoutSuccess')}</Text>
            </Animated.View>
          )}
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.languageSwitcherContainer}>
          <LanguageSwitcher />
        </View>
        
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="school" size={50} color="white" />
          </View>
          <Text style={styles.headerTitle}>{t('login.firebaseLogin')}</Text>
          <Text style={styles.headerSubtitle}>{t('login.loginSubtitle')}</Text>
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
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color="#64748b" 
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.rememberMeContainer}>
            <Switch
              value={rememberMe}
              onValueChange={setRememberMe}
              trackColor={{ false: '#e2e8f0', true: '#bfdbfe' }}
              thumbColor={rememberMe ? '#3b82f6' : '#f4f3f4'}
            />
            <Text style={styles.rememberMeText}>{t('login.rememberMe')}</Text>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>{t('login.loggingIn')}</Text>
            </View>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={loading}
              >
                <Ionicons name="log-in-outline" size={20} color="white" />
                <Text style={styles.loginButtonText}>{t('login.loginButton')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.registerButton}
                onPress={() => router.push('/tabs/(tabs)/register')}
                disabled={loading}
              >
                <Ionicons name="person-add-outline" size={20} color="#3b82f6" />
                <Text style={styles.registerButtonText}>{t('login.registerButton')}</Text>
              </TouchableOpacity>
            </>
          )}
          
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('login.or')}</Text>
            <View style={styles.dividerLine} />
          </View>
          
          <TouchableOpacity 
            style={styles.quickLoginButton}
            onPress={quickLoginAA123}
            disabled={loading}
          >
            <Ionicons name="flash-outline" size={20} color="#f59e0b" />
            <Text style={styles.quickLoginButtonText}>
              {t('login.quickLogin')}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.testAccountContainer}>
            <Ionicons name="information-circle-outline" size={16} color="#64748b" />
            <Text style={styles.testAccountText}>
              {t('login.testAccountHint')}: AA123 / 123456
            </Text>
          </View>
        </View>
        
        <Text style={styles.footerText}>{t('login.cookieNotice')}</Text>
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
  headerSection: {
    alignItems: 'center',
    paddingVertical: 40,
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
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
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
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeText: {
    marginLeft: 12,
    color: '#64748b',
    fontSize: 14,
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
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3b82f6',
    gap: 8,
  },
  registerButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#94a3b8',
    fontSize: 14,
  },
  quickLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fffbeb',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fcd34d',
    gap: 8,
  },
  quickLoginButtonText: {
    color: '#b45309',
    fontSize: 14,
    fontWeight: '600',
  },
  testAccountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  testAccountText: {
    color: '#64748b',
    fontSize: 12,
  },
  footerText: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 24,
    paddingHorizontal: 40,
  },
  loggedInHeader: {
    alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: '#3b82f6',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  usernameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  infoSection: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutOverlay: {
    marginTop: 20,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    gap: 12,
  },
  logoutOverlayText: {
    fontSize: 16,
    color: '#991b1b',
    fontWeight: '500',
  },
  logoutSuccessOverlay: {
    marginTop: 20,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    gap: 12,
  },
  logoutSuccessIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutSuccessText: {
    fontSize: 18,
    color: '#166534',
    fontWeight: '600',
  },
  logoutModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoutModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  logoutModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  logoutModalMessage: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 24,
  },
  logoutModalButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  logoutModalCancel: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  logoutModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  logoutModalConfirm: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#ef4444',
  },
  logoutModalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
