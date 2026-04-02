
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUserFromCookies, setLoginCookies } from './cookieService';

const FIREBASE_URL = 'https://moblie-ec4d3-default-rtdb.firebaseio.com';


export const getCurrentUser = async () => {
  try {
    const cookieUser = await getCurrentUserFromCookies();
    if (cookieUser) {
      return cookieUser;
    }
    const userJson = await AsyncStorage.getItem('currentUser');
    if (userJson) {
      return JSON.parse(userJson);
    }
    return null;
  } catch (error) {
    console.error('獲取用戶錯誤:', error);
    return null;
  }
};


export const saveUser = async (username: string, userData: any) => {
  try {
    const user = {
      username,
      data: userData,
      loginTime: new Date().toISOString()
    };
    await AsyncStorage.setItem('currentUser', JSON.stringify(user));
    await setLoginCookies(username, userData);
    return true;
  } catch (error) {
    console.error('保存用戶錯誤:', error);
    return false;
  }
};


export const clearUser = async () => {
  try {
    await AsyncStorage.removeItem('currentUser');
    return true;
  } catch (error) {
    console.error('清除用戶錯誤:', error);
    return false;
  }
};


export const favoriteSchool = async (schoolId: string, schoolName: string) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('請先登入');
    }

    const url = `${FIREBASE_URL}/users/${user.username}/like.json`;
    const getResponse = await fetch(url);
    let currentLikes: Record<string, string> = {};
    
    if (getResponse.ok) {
      const data = await getResponse.json();
      if (data && typeof data === 'object') {
        currentLikes = { ...data };
      }
    }

    if (currentLikes[schoolId]) {
      throw new Error('已收藏此學校');
    }

    currentLikes[schoolId] = schoolName;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(currentLikes),
    });

    if (!response.ok) {
      throw new Error('收藏失敗');
    }

    user.data.like = currentLikes;
    await setLoginCookies(user.username, user.data);
    
    return true;
  } catch (error: any) {
    console.error('收藏錯誤:', error);
    throw error;
  }
};


export const unfavoriteSchool = async (schoolId: string) => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('請先登入');
    }

    const url = `${FIREBASE_URL}/users/${user.username}/like.json`;
    const getResponse = await fetch(url);
    let currentLikes: Record<string, string> = {};
    
    if (getResponse.ok) {
      const data = await getResponse.json();
      if (data && typeof data === 'object') {
        currentLikes = { ...data };
      }
    }

    delete currentLikes[schoolId];

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(currentLikes),
    });

    if (!response.ok) {
      throw new Error('取消收藏失敗');
    }

    user.data.like = currentLikes;
    await setLoginCookies(user.username, user.data);
    
    return true;
  } catch (error: any) {
    console.error('取消收藏錯誤:', error);
    throw error;
  }
};


export const isSchoolFavorited = async (schoolId: string): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    if (!user || !user.data || !user.data.like) {
      return false;
    }

    const currentLikes = user.data.like;
    if (typeof currentLikes === 'object' && !Array.isArray(currentLikes)) {
      return Object.prototype.hasOwnProperty.call(currentLikes, schoolId);
    }
    return false;
  } catch (error) {
    console.error('檢查收藏錯誤:', error);
    return false;
  }
};


export const getFavorites = async () => {
  try {
    const user = await getCurrentUser();
    if (!user || !user.data || !user.data.like) {
      return {};
    }
    return user.data.like;
  } catch (error) {
    console.error('獲取收藏列表錯誤:', error);
    return {};
  }
};