import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { router } from 'expo-router';
import { SchoolProperties } from '@/services/schoolApi';
import { 
  getCurrentUserFromCookies,  
  isLoggedInFromCookies,      
  setLoginCookies             
} from '@/services/cookieService';
import { useLanguage } from '@/contexts/LanguageContext';

interface SchoolContactProps {
  properties: SchoolProperties;
  language: string;
  id: string;
}

export default function SchoolContact({ properties, language, id }: SchoolContactProps) {

  const displayPhone = properties.聯絡電話 || properties.Telephone;
  const displayFax = properties.傳真號碼 || properties.Fax_Number;
  const displayWebsite = properties.網頁 || properties.Website;
  const { t } = useLanguage();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null); 

  // 检查登录状态和收藏状态
  useEffect(() => {
    const checkAuthAndFavorite = async () => {
      try {
        const user = await getCurrentUserFromCookies();
        
        if (user) {
          setIsLoggedIn(true);
          setUserId(user.username);
          
          // 检查是否收藏了当前学校
          if (id && user.data && user.data.like) {
            const likeData = user.data.like;
            
            // 方法1: 检查对象是否包含该学校ID作为键
            const isFav = Object.prototype.hasOwnProperty.call(likeData, id);
            
            setIsFavorite(isFav);
            console.log('检查收藏状态:', { 
              schoolId: id, 
              isFavorited: isFav, 
              likeKeys: Object.keys(likeData) 
            });
          }
        } else {
          setIsLoggedIn(false);
          setUserId(null);
          setIsFavorite(false);
        }
      } catch (error) {
        console.error('检查收藏状态失败:', error);
        setIsFavorite(false);
      }
    };

    checkAuthAndFavorite();
  }, [id]);

  // 收藏学校
  const favoriteSchool = async (schoolId: string, schoolName: string): Promise<boolean> => {
    try {
      if (!userId) return false;
      
      // 获取当前用户的收藏数据
      const url = `https://moblie-ec4d3-default-rtdb.firebaseio.com/users/${userId}/like.json`;
      const getResponse = await fetch(url);
      
      let currentLikes: Record<string, string> = {};
      
      if (getResponse.ok) {
        const data = await getResponse.json();
        
        // 如果已有收藏数据，复制过来
        if (data && typeof data === 'object') {
          currentLikes = { ...data };
        }
      }
      
      // 添加新的收藏
      currentLikes[schoolId] = schoolName;
      
      // 更新到 Firebase
      const updateUrl = `https://moblie-ec4d3-default-rtdb.firebaseio.com/users/${userId}/like.json`;
      const response = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentLikes),
      });

      return response.ok;
    } catch (error) {
      console.error('收藏失败:', error);
      return false;
    }
  };

  // 取消收藏
  const unfavoriteSchool = async (schoolId: string): Promise<boolean> => {
    try {
      if (!userId) return false;

      // 获取当前用户的收藏数据
      const getUrl = `https://moblie-ec4d3-default-rtdb.firebaseio.com/users/${userId}/like.json`;
      const getResponse = await fetch(getUrl);
      
      let currentLikes: Record<string, string> = {};
      
      if (getResponse.ok) {
        const data = await getResponse.json();
        if (data && typeof data === 'object') {
          currentLikes = { ...data };
        }
      }

      // 删除指定的收藏
      if (currentLikes[schoolId]) {
        delete currentLikes[schoolId];
      }

      // 更新到 Firebase
      const updateUrl = `https://moblie-ec4d3-default-rtdb.firebaseio.com/users/${userId}/like.json`;
      const response = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentLikes),
      });

      return response.ok;
    } catch (error) {
      console.error('取消收藏失败:', error);
      return false;
    }
  };

  // 处理收藏按钮点击
  const handleFavoritePress = async () => {
    try {
      setIsLoading(true);
      
      // 检查用户是否登录
      const user = await getCurrentUserFromCookies();
      if (!user) {
        Alert.alert(
          'Login Required',
          'Please login to manage favorites.',
          [
            { 
              text: 'Cancel', 
              style: 'cancel' 
            },
            { 
              text: 'Go to Login',
              onPress: () => router.push({ pathname: '/tabs/(tabs)/login' })
            }
          ]
        );
        return;
      }

      // 验证学校信息
      if (!id || !properties.Facility_Name) {
        Alert.alert('Error', 'Missing school information');
        return;
      }

      if (isFavorite) {
        // 取消收藏
        const success = await unfavoriteSchool(id);
        if (success) {
          setIsFavorite(false);
          
          // 更新本地 cookie 数据
          if (user.data.like && typeof user.data.like === 'object') {
            delete user.data.like[id];
            await setLoginCookies(user.username, user.data);
          }
          
          Alert.alert('Success', 'Removed from favorites');
        } else {
          Alert.alert('Error', 'Operation failed');
        }
      } else {
        // 添加收藏
        const success = await favoriteSchool(id, properties.Facility_Name);
        if (success) {
          setIsFavorite(true);
          
          // 更新本地 cookie 数据
          if (!user.data.like) {
            user.data.like = {};
          }
          user.data.like[id] = properties.Facility_Name;
          await setLoginCookies(user.username, user.data);
          
          Alert.alert('Success', 'Added to favorites');
        } else {
          Alert.alert('Error', 'Failed to add to favorites');
        }
      }
    } catch (error: any) {
      console.error('操作失败:', error);
      Alert.alert('Error', error.message || 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWebsitePress = (url: string) => {
    Linking.openURL(url.startsWith('http') ? url : `https://${url}`).catch(err => {
      Alert.alert('Error', 'Could not open link');
    });
  };

  const handlePhonePress = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(err => {
      Alert.alert('Error', 'Could not make call');
    });
  };

  if (!displayPhone && !displayFax && !displayWebsite) {
    return null;
  }

  return (
    <View style={styles.contactSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {language === 'zh' ? '聯絡方式' : 'Contact'}
        </Text>
      </View>
      
      {displayPhone && (
        <TouchableOpacity 
          style={styles.contactRow}
          onPress={() => handlePhonePress(displayPhone)}
        >
          <Text style={styles.contactLabel}>📞 {language === 'zh' ? '電話:' : 'Phone:'}</Text>
          <Text style={styles.contactLink}>{displayPhone}</Text>
        </TouchableOpacity>
      )}
      
      {displayFax && (
        <View style={styles.contactRow}>
          <Text style={styles.contactLabel}>📠 {language === 'zh' ? '傳真:' : 'Fax:'}</Text>
          <Text style={styles.contactValue}>{displayFax}</Text>
        </View>
      )}
      
      {displayWebsite && (
        <TouchableOpacity 
          style={styles.contactRow}
          onPress={() => handleWebsitePress(displayWebsite)}
        >
          <Text style={styles.contactLabel}>🌐 {language === 'zh' ? '網站:' : 'Website:'}</Text>
          <Text style={styles.contactLink} numberOfLines={1}>{displayWebsite}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contactSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  favoriteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userIdText: {
    fontSize: 12,
    color: '#64748b',
    marginRight: 8,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },
  favoriteButtonActive: {
    backgroundColor: '#fecaca',
    borderColor: '#f87171',
    transform: [{ scale: 1.1 }],
  },
  favoriteButtonDisabled: {
    opacity: 0.5,
  },
  favoriteButtonText: {
    fontSize: 20,
    color: '#64748b',
  },
  favoriteButtonTextActive: {
    color: '#dc2626',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  contactLabel: {
    width: 90,
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  contactLink: {
    flex: 1,
    fontSize: 14,
    color: '#3b82f6',
    textDecorationLine: 'underline',
    paddingVertical: 4,
  },
  contactValue: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    paddingVertical: 4,
  },
  loginHint: {
    fontSize: 13,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  refreshButton: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  refreshButtonText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
});