import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Share,
  Platform,
  Alert,
  Clipboard
} from 'react-native';
import { SchoolProperties } from '@/services/schoolApi';
import Icon from 'react-native-vector-icons/MaterialIcons'; 
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getCurrentUserFromCookies, setLoginCookies } from '@/services/cookieService';

interface SchoolInfoProps {
  properties: SchoolProperties;
  language: string;
  displayDistrict: string;
  displayGender: string;
  displaySession: string;
  displayReligion: string;
  displayFinanceType: string;
  getGenderValue: (gender: string) => string;
  id: string;
}

export default function SchoolInfo({
  properties,
  language,
  displayDistrict,
  displayGender,
  displaySession,
  displayReligion,
  displayFinanceType,
  getGenderValue,
  id,
}: SchoolInfoProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndFavorite = async () => {
      try {
        const user = await getCurrentUserFromCookies();
        if (user) {
          setIsLoggedIn(true);
          setUserId(user.username);
          if (id && user.data && user.data.like) {
            const isFav = Object.prototype.hasOwnProperty.call(user.data.like, id);
            setIsFavorite(isFav);
          }
        } else {
          setIsLoggedIn(false);
          setUserId(null);
          setIsFavorite(false);
        }
      } catch (error) {
        console.error('檢查收藏狀態失敗:', error);
        setIsFavorite(false);
      }
    };
    checkAuthAndFavorite();
  }, [id]);

  const handleFavoritePress = async () => {
    if (!isLoggedIn) {
      Alert.alert(
        language === 'zh' ? '需要登入' : 'Login Required',
        language === 'zh' ? '請先登入以使用收藏功能' : 'Please login to manage favorites.',
        [
          { text: language === 'zh' ? '取消' : 'Cancel', style: 'cancel' },
          { text: language === 'zh' ? '登入' : 'Login', onPress: () => router.push('/tabs/(tabs)/login') }
        ]
      );
      return;
    }

    setIsLoading(true);
    try {
      const url = `https://moblie-ec4d3-default-rtdb.firebaseio.com/users/${userId}/like.json`;
      const getResponse = await fetch(url);
      let currentLikes: Record<string, string> = {};
      
      if (getResponse.ok) {
        const data = await getResponse.json();
        if (data && typeof data === 'object') {
          currentLikes = { ...data };
        }
      }

      if (isFavorite) {
        delete currentLikes[id];
      } else {
        currentLikes[id] = properties.Facility_Name || properties.設施名稱 || id;
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentLikes),
      });

      if (response.ok) {
        setIsFavorite(!isFavorite);
        const user = await getCurrentUserFromCookies();
        if (user) {
          user.data.like = currentLikes;
          await setLoginCookies(user.username, user.data);
        }
      }
    } catch (error) {
      console.error('收藏操作失敗:', error);
      Alert.alert(language === 'zh' ? '錯誤' : 'Error', language === 'zh' ? '操作失敗' : 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  
  const generateShareContent = () => {
    const isChinese = language === 'zh';
    
    
    let content = isChinese 
      ? `${properties.設施名稱 || properties.Facility_Name}\n\n`
      : `${properties.Facility_Name || properties.設施名稱}\n\n`;
    
    
    const tags = [];
    if (displayDistrict) tags.push(displayDistrict);
    if (displayGender) tags.push(displayGender);
    if (displaySession) tags.push(displaySession);
    if (displayReligion) tags.push(displayReligion);
    
    if (tags.length > 0) {
      content += `${tags.join(' • ')}\n\n`;
    }
    
    
    content += isChinese ? '學校詳情:\n' : 'School Details:\n';
    
    if (isChinese && properties.設施名稱) {
      content += `中文名稱: ${properties.設施名稱}\n`;
    }
    
    if (properties.Facility_Name) {
      content += `${isChinese ? '英文名稱' : 'English Name'}: ${properties.Facility_Name}\n`;
    }
    
    const address = isChinese ? properties.地址 || properties.Address : properties.Address || properties.地址;
    if (address) {
      content += `${isChinese ? '地址' : 'Address'}: ${address}\n`;
    }
    
    if (displayReligion) {
      content += `${isChinese ? '宗教' : 'Religion'}: ${displayReligion}\n`;
    }
    
    if (displayFinanceType) {
      content += `${isChinese ? '資助種類' : 'Finance Type'}: ${displayFinanceType}\n`;
    }
    
    
    content += `\n---\n${isChinese ? '來自學校資訊應用程式' : 'From School Info App'}`;
    
    return content;
  };

  
  const handleShare = async () => {
    try {
      const shareContent = generateShareContent();
      
      const result = await Share.share({
        message: shareContent,
        title: language === 'zh' ? '學校資訊分享' : 'Share School Information',
        
        url: Platform.OS === 'ios' ? undefined : undefined,
      }, {
        
        dialogTitle: language === 'zh' ? '分享學校資訊' : 'Share School Info',
        
        subject: language === 'zh' ? '學校資訊' : 'School Information',
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          
          console.log('Shared via:', result.activityType);
        } else {
          
          console.log('Share completed');
        }
      } else if (result.action === Share.dismissedAction) {
        
        console.log('Share dismissed');
      }
    } catch (error: any) {
      Alert.alert(
        language === 'zh' ? '分享失敗' : 'Share Failed',
        error.message,
        [{ text: 'OK' }]
      );
    }
  };

  
  const handleCopyToClipboard = async () => {
    try {
      const shareContent = generateShareContent();
      await Clipboard.setString(shareContent);
      
      
      Alert.alert(
        language === 'zh' ? '已複製' : 'Copied',
        language === 'zh' ? '學校資訊已複製到剪貼板' : 'School information copied to clipboard',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert(
        language === 'zh' ? '複製失敗' : 'Copy Failed',
        error.message,
        [{ text: 'OK' }]
      );
    }
  };

  
  const handleMoreOptions = () => {
    Alert.alert(
      language === 'zh' ? '分享選項' : 'Share Options',
      language === 'zh' ? '選擇您要執行的操作：' : 'Choose an action:',
      [
        {
          text: language === 'zh' ? '分享' : 'Share',
          onPress: handleShare,
        },
        {
          text: language === 'zh' ? '複製到剪貼板' : 'Copy to Clipboard',
          onPress: handleCopyToClipboard,
        },
        {
          text: language === 'zh' ? '取消' : 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      
      <View style={styles.header}>
        <Text style={styles.title}>
          {language === 'zh' ? '學校資訊' : 'School Information'}
        </Text>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleFavoritePress}
          disabled={isLoading}
        >
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorite ? "#dc2626" : "#94a3b8"} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.badgesRow}>
        {displayDistrict && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{displayDistrict}</Text>
          </View>
        )}
        {displayGender && (
          <View style={[styles.badge, { backgroundColor: '#dbeafe' }]}>
            <Text style={[styles.badgeText, { color: '#1e40af' }]}>{displayGender}</Text>
          </View>
        )}
        {displaySession && (
          <View style={[styles.badge, { backgroundColor: '#dcfce7' }]}>
            <Text style={[styles.badgeText, { color: '#166534' }]}>{displaySession}</Text>
          </View>
        )}
      </View>

      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            {language === 'zh' ? '英文名稱:' : 'English Name:'}
          </Text>
          <Text style={styles.detailValue}>{properties.Facility_Name || '-'}</Text>
        </View>
        
        {language === 'zh' && properties.設施名稱 && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>中文名稱:</Text>
            <Text style={styles.detailValue}>{properties.設施名稱}</Text>
          </View>
        )}
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>
            {language === 'zh' ? '地址:' : 'Address:'}
          </Text>
          <Text style={styles.detailValue}>
            {language === 'zh' ? properties.地址 || properties.Address || '-' : properties.Address || properties.地址 || '-'}
          </Text>
        </View>
        
        {displayReligion && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {language === 'zh' ? '宗教:' : 'Religion:'}
            </Text>
            <Text style={styles.detailValue}>{displayReligion}</Text>
          </View>
        )}
        
        {displayFinanceType && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              {language === 'zh' ? '資助種類:' : 'Finance Type:'}
            </Text>
            <Text style={styles.detailValue}>{displayFinanceType}</Text>
          </View>
        )}
      </View>

      
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerButton}
          onPress={handleCopyToClipboard}
        >
          <Icon name="content-copy" size={20} color="#64748b" />
          <Text style={styles.footerButtonText}>
            {language === 'zh' ? '複製' : 'Copy'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.footerButton}
          onPress={Platform.OS === 'ios' ? handleShare : handleMoreOptions}
        >
          <Icon name="share" size={20} color="#3b82f6" />
          <Text style={[styles.footerButtonText, { color: '#3b82f6' }]}>
            {language === 'zh' ? '分享' : 'Share'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  favoriteButton: {
    padding: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  detailsSection: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailLabel: {
    width: 100,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  footerButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
});