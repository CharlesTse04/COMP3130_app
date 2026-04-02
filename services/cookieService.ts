
import AsyncStorage from '@react-native-async-storage/async-storage';


const COOKIE_KEYS = {
  USERNAME: '@cookie_username',
  USER_DATA: '@cookie_userdata',
  SESSION_ID: '@cookie_sessionid',
  LOGIN_TIME: '@cookie_logintime',
  EXPIRE_TIME: '@cookie_expiretime'
};


export const setCookie = async (key: string, value: any, options?: {
  expires?: number; 
}) => {
  try {
    const data = {
      value: value,
      expires: options?.expires ? 
        new Date(Date.now() + options.expires * 60 * 60 * 1000).toISOString() : 
        null
    };
    
    await AsyncStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`設置 Cookie ${key} 失敗:`, error);
    return false;
  }
};


export const getCookie = async (key: string): Promise<any> => {
  try {
    const item = await AsyncStorage.getItem(key);
    if (!item) return null;
    
    const data = JSON.parse(item);
    
    
    if (data.expires && new Date(data.expires) < new Date()) {
      
      await AsyncStorage.removeItem(key);
      return null;
    }
    
    return data.value;
  } catch (error) {
    console.error(`獲取 Cookie ${key} 失敗:`, error);
    return null;
  }
};


export const removeCookie = async (key: string) => {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`刪除 Cookie ${key} 失敗:`, error);
    return false;
  }
};


export const clearAllCookies = async () => {
  try {
    const keys = Object.values(COOKIE_KEYS);
    for (const key of keys) {
      await AsyncStorage.removeItem(key);
    }
    return true;
  } catch (error) {
    console.error('清空 Cookie 失敗:', error);
    return false;
  }
};


export const setLoginCookies = async (username: string, userData: any, options?: {
  rememberMe?: boolean;
}) => {
  try {
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    
    const expiresHours = options?.rememberMe ? 168 : 24; 
    
    
    await setCookie(COOKIE_KEYS.USERNAME, username, { expires: expiresHours });
    await setCookie(COOKIE_KEYS.USER_DATA, userData, { expires: expiresHours });
    await setCookie(COOKIE_KEYS.SESSION_ID, sessionId, { expires: expiresHours });
    await setCookie(COOKIE_KEYS.LOGIN_TIME, new Date().toISOString(), { expires: expiresHours });
    await setCookie(COOKIE_KEYS.EXPIRE_TIME, expiresHours, { expires: expiresHours });
    
    console.log('登入 Cookie 設置成功');
    return true;
  } catch (error) {
    console.error('設置登入 Cookie 失敗:', error);
    return false;
  }
};


export const getCurrentUserFromCookies = async () => {
  try {
    const username = await getCookie(COOKIE_KEYS.USERNAME);
    const userData = await getCookie(COOKIE_KEYS.USER_DATA);
    
    if (!username || !userData) {
      return null;
    }
    
    return {
      username,
      data: userData,
      sessionId: await getCookie(COOKIE_KEYS.SESSION_ID),
      loginTime: await getCookie(COOKIE_KEYS.LOGIN_TIME),
      expireTime: await getCookie(COOKIE_KEYS.EXPIRE_TIME)
    };
  } catch (error) {
    console.error('從 Cookie 獲取用戶失敗:', error);
    return null;
  }
};


export const isLoggedInFromCookies = async (): Promise<boolean> => {
  const user = await getCurrentUserFromCookies();
  return user !== null;
};


export const logoutFromCookies = async () => {
  return await clearAllCookies();
};


export const checkCookieValidity = async (): Promise<{
  valid: boolean;
  reason?: string;
}> => {
  try {
    const user = await getCurrentUserFromCookies();
    
    if (!user) {
      return { valid: false, reason: '未找到用戶 Cookie' };
    }
    
    
    if (!user.sessionId) {
      return { valid: false, reason: '無效的會話' };
    }
    
    
    if (!user.data || typeof user.data !== 'object') {
      return { valid: false, reason: '用戶數據損壞' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, reason: '檢查 Cookie 時出錯' };
  }
};


export const refreshCookies = async () => {
  try {
    const user = await getCurrentUserFromCookies();
    if (!user) return false;
    
    
    await setLoginCookies(user.username, user.data, {
      rememberMe: user.expireTime === 168 
    });
    
    return true;
  } catch (error) {
    console.error('刷新 Cookie 失敗:', error);
    return false;
  }
};