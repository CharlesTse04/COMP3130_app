import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { fetchSchoolData, SchoolGeoJSON } from '@/services/schoolApi';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { getCurrentUserFromCookies } from '@/services/cookieService';
import { favoriteSchool, unfavoriteSchool } from '@/services/firebaseAuth';
import { Ionicons } from '@expo/vector-icons'; 

export default function Tab2() {
  const { t, language } = useLanguage();
  const [data, setData] = useState<SchoolGeoJSON | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [maxFeatures, setMaxFeatures] = useState(20);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [userFavorites, setUserFavorites] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  
  const handleLoginPress = () => {
    router.push('/tabs/(tabs)/login');
  };

const fetchUserFavorites = async (forceRefresh: boolean = false) => {
  try {
    const user = await getCurrentUserFromCookies();
    
    if (user && user.username) {
      setUserId(user.username);
      
      let favorites = user.data?.like;
      
      if (forceRefresh) {
        try {
          const url = `https://moblie-ec4d3-default-rtdb.firebaseio.com/users/${user.username}/like.json`;
          const response = await fetch(url);
          if (response.ok) {
            favorites = await response.json();
          }
        } catch (e) {
          console.error('從 Firebase 刷新收藏失敗:', e);
        }
      }
      
      let formattedFavorites: any[] = [];
      
      if (favorites && typeof favorites === 'object' && !Array.isArray(favorites)) {
        formattedFavorites = Object.keys(favorites).map((schoolId, index) => {
          const schoolName = favorites[schoolId];
          return {
            id: index.toString(),
            schoolId: schoolId,
            schoolName: schoolName || schoolId
          };
        });
      } 
      else if (Array.isArray(favorites)) {
        formattedFavorites = favorites.map((item: any, index: number) => {
          if (typeof item === 'string') {
            return {
              id: index.toString(),
              schoolId: item,
              schoolName: item 
            };
          } else if (typeof item === 'object' && item !== null) {
            if (item.schoolId) {
              return {
                id: item.id || index.toString(),
                schoolId: item.schoolId,
                schoolName: item.schoolName || item.schoolId,
                addedAt: item.addedAt
              };
            } else {
              const schoolId = Object.keys(item)[0] || '';
              const schoolName = item[schoolId] || schoolId;
              return {
                id: index.toString(),
                schoolId: schoolId,
                schoolName: schoolName
              };
            }
          }
          return null;
        }).filter(Boolean);
      }
      else {
        formattedFavorites = [];
      }
      
      console.log('格式化后的收藏数据:', formattedFavorites);
      setUserFavorites(formattedFavorites);
    } else {
      setUserId(null);
      setUserFavorites([]);
    }
  } catch (error) {
    console.error('獲取收藏數據失敗:', error);
  }
};

  const isSchoolFavorited = useCallback((schoolId: string): boolean => {
    return userFavorites.some(fav => fav.schoolId === schoolId);
  }, [userFavorites]);

  const getFavoriteData = (schoolId: string): any => {
    return userFavorites.find(fav => fav.schoolId === schoolId);
  };

  const handleToggleFavorite = async (schoolId: string, schoolName: string) => {
    if (!userId) {
      router.push('/tabs/(tabs)/login');
      return;
    }
    try {
      if (isSchoolFavorited(schoolId)) {
        await unfavoriteSchool(schoolId);
      } else {
        await favoriteSchool(schoolId, schoolName);
      }
      await fetchUserFavorites(true);
    } catch (error) {
      console.error('收藏操作失敗:', error);
    }
  };

  const handleToggleFavoritesFilter = async () => {
    if (!showOnlyFavorites) {
      await fetchUserFavorites(true);
      const result = await fetchSchoolData({ maxFeatures: 500 });
      setData(result);
    }
    setShowOnlyFavorites(!showOnlyFavorites);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchSchoolData({ maxFeatures });
      setData(result);
      
      await fetchUserFavorites();
    } catch (err: any) {
      setError(err.message);
      console.error('Fetch error details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [maxFeatures]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchUserFavorites();
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    setSelectedDistrict(null);
    setSelectedGender(null);
  }, [language]);

  const searchSuggestions = useMemo(() => {
    if (!search.trim() || !data?.features) return [];
    
    const query = search.toLowerCase().trim();
    const suggestions: any[] = [];
    
    data.features.forEach(school => {
      const properties = school.properties;
      const schoolId = properties.SCHOOL_NO || '';
      const chineseName = properties.設施名稱 || '';
      const englishName = properties.Facility_Name || '';
      const address = properties.地址 || properties.Address || '';
      const district = properties.分區 || properties.District || '';
      
      const matchesSchoolId = schoolId.toLowerCase().includes(query);
      const matchesChinese = chineseName.toLowerCase().includes(query);
      const matchesEnglish = englishName.toLowerCase().includes(query);
      const matchesAddress = address.toLowerCase().includes(query);
      const matchesDistrict = district.toLowerCase().includes(query);
      
      if (matchesSchoolId || matchesChinese || matchesEnglish || matchesAddress || matchesDistrict) {
        suggestions.push({
          school,
          matchType: matchesSchoolId ? 'id' : 
                    matchesChinese ? 'name' : 
                    matchesEnglish ? 'name' : 
                    matchesAddress ? 'address' : 'district',
          matchText: matchesSchoolId ? schoolId : 
                    matchesChinese ? chineseName : 
                    matchesEnglish ? englishName : 
                    matchesAddress ? address : district
        });
      }
    });
    
    const uniqueSuggestions = Array.from(
      new Map(suggestions.map(item => [item.school.properties.Facility_Name, item])).values()
    ).slice(0, 10);
    
    return uniqueSuggestions;
  }, [search, data]);

  const districts = Array.from(
    new Set(
      data?.features?.map(school => {
        if (language === 'zh') {
          return school.properties.分區 || school.properties.District || '';
        }
        return school.properties.District || school.properties.分區 || '';
      }) || []
    )
  ).filter(Boolean).sort();

  const getTranslatedGender = (gender: string) => {
    if (language === 'zh') return gender;
    switch (gender) {
      case '男女': return 'Co-ed';
      case '男校': return 'Boys';
      case '女校': return 'Girls';
      default: return gender;
    }
  };

  const genders = Array.from(
    new Set(
      data?.features?.map(school => {
        const gender = school.properties.就讀學生性別 || school.properties.Students_Gender || '';
        return getTranslatedGender(gender);
      }) || []
    )
  ).filter(Boolean).sort();

  const favoriteSchoolIds = useMemo(() => {
    return new Set(userFavorites.map(fav => fav.schoolId));
  }, [userFavorites]);

  const filteredSchools = useMemo(() => {
    const filtered = (data?.features?.filter(school => {
      const schoolId = school.properties.SCHOOL_NO || school.properties['SCHOOL_NO.'] || '';
      
      if (showOnlyFavorites && userId) {
        if (!favoriteSchoolIds.has(schoolId)) return false;
      }

      if (search) {
        const query = search.toLowerCase();
        const chineseName = (school.properties.設施名稱 || '').toLowerCase();
        const englishName = (school.properties.Facility_Name || '').toLowerCase();
        const address = (school.properties.地址 || school.properties.Address || '').toLowerCase();
        const district = language === 'zh' 
          ? (school.properties.分區 || '').toLowerCase()
          : (school.properties.District || '').toLowerCase();
        const id = schoolId.toLowerCase();
        
        if (!chineseName.includes(query) && 
            !englishName.includes(query) && 
            !address.includes(query) &&
            !district.includes(query) &&
            !id.includes(query)) {
          return false;
        }
      }

      if (selectedDistrict) {
        const district = language === 'zh' 
          ? school.properties.分區 || school.properties.District || ''
          : school.properties.District || school.properties.分區 || '';
        if (district !== selectedDistrict) return false;
      }

      if (selectedGender) {
        const originalGender = school.properties.就讀學生性別 || school.properties.Students_Gender || '';
        const translatedGender = getTranslatedGender(originalGender);
        if (translatedGender !== selectedGender) return false;
      }

      return true;
    }) || []);

    return filtered.sort((a, b) => {
      const aId = a.properties.SCHOOL_NO || a.properties['SCHOOL_NO.'] || '';
      const bId = b.properties.SCHOOL_NO || b.properties['SCHOOL_NO.'] || '';
      const aFavorited = favoriteSchoolIds.has(aId);
      const bFavorited = favoriteSchoolIds.has(bId);
      
      if (aFavorited && !bFavorited) return -1;
      if (!aFavorited && bFavorited) return 1;
      return 0;
    });
  }, [data?.features, showOnlyFavorites, userId, favoriteSchoolIds, search, selectedDistrict, selectedGender, language]);

  const handleSearchChange = (text: string) => {
    setSearch(text);
    setShowSuggestions(text.trim().length > 0);
  };

  const handleSuggestionPress = (suggestion: any) => {
    setSearch(suggestion.matchText);
    setShowSuggestions(false);
  };

  const handleSchoolPress = (school: any) => {
    const properties = school.properties;
    const schoolNo = properties.SCHOOL_NO || 
                     properties['SCHOOL_NO.'] || 
                     properties['學校編號'];
    
    const schoolName = properties.設施名稱 || properties.Facility_Name;
    
    if (schoolNo) {
      router.push({
        pathname: '/tabs/(tabs)/school/[id]',
        params: { 
          id: schoolNo,
          name: schoolName,
          type: 'number'
        }
      });
    } else if (schoolName) {
      const encodedName = encodeURIComponent(schoolName);
      router.push({
        pathname: '/tabs/(tabs)/school/[id]',
        params: { 
          id: encodedName,
          type: 'name'
        }
      });
    }
  };

  const handleClearSearch = () => {
    setSearch('');
    setShowSuggestions(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>{t('app.loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('app.error')}</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={fetchData}>
          <Text style={styles.buttonText}>{t('app.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{t('app.title')}</Text>
            <Text style={styles.subtitle}>{t('app.subtitle')}</Text>
          </View>
          
          
          <View style={styles.headerActions}>
            
            <LanguageSwitcher />
            
            
            <TouchableOpacity 
              style={styles.loginIconContainer}
              onPress={handleLoginPress}
            >
              <Ionicons 
                name={userId ? "person" : "person-outline"} 
                size={24} 
                color={userId ? "#3b82f6" : "#64748b"} 
              />
              <Text style={styles.loginText}>
                {userId ? t('app.user') : t('login.loginButton')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        
        {userId && (
          <View style={styles.userSection}>
            <View style={styles.userInfo}>
              
              <View style={styles.userIdContainer}>
                <Ionicons name="person" size={16} color="#475569" />
                <Text style={styles.userId}>
                  {t('app.user')}: {userId}
                </Text>
              </View>
              
              
              <TouchableOpacity 
                style={[
                  styles.favoritesButton,
                  showOnlyFavorites && styles.favoritesButtonActive
                ]}
                onPress={handleToggleFavoritesFilter}
              >
                <Ionicons name={showOnlyFavorites ? "heart" : "heart-outline"} size={14} color={showOnlyFavorites ? "white" : "#64748b"} />
                <Text style={[
                  styles.favoritesButtonText,
                  showOnlyFavorites && styles.favoritesButtonTextActive
                ]}>
                  {t('app.following')} ({userFavorites.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('app.searchPlaceholder') || t('app.loading')}
            value={search}
            onChangeText={handleSearchChange}
            onFocus={() => search.trim().length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          {search.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={handleClearSearch}
            >
              <Text style={styles.clearButtonText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterButtonText}>
            {showFilters ? t('app.hideFilters') : t('app.showFilters')}
          </Text>
        </TouchableOpacity>
      </View>

      
      {showSuggestions && searchSuggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={searchSuggestions}
            keyExtractor={(item, index) => `suggestion-${index}`}
            renderItem={({ item }) => {
              const properties = item.school.properties;
              const schoolId = properties.SCHOOL_NO || '';
              const displayName = language === 'zh' 
                ? properties.設施名稱 || properties.Facility_Name
                : properties.Facility_Name || properties.設施名稱;
              
              const displayDistrict = language === 'zh'
                ? properties.分區 || properties.District
                : properties.District || properties.分區;
              
              return (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionPress(item)}
                >
                  <Text style={styles.suggestionName}>{displayName}</Text>
                  <Text style={styles.suggestionId}>ID: {schoolId}</Text>
                  <Text style={styles.suggestionDistrict}>{displayDistrict}</Text>
                  <Text style={styles.suggestionMatchType}>
                    {item.matchType === 'id' ? '學校ID' : 
                     item.matchType === 'name' ? '名稱' : 
                     item.matchType === 'address' ? '地址' : '分區'}
                  </Text>
                </TouchableOpacity>
              );
            }}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="always"
          />
        </View>
      )}

      
      {showFilters && (
        <View style={styles.filtersContainer}>
          
          {userId && (
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>{t('app.CollectionFilter')}:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    !showOnlyFavorites && styles.filterChipActive,
                  ]}
                  onPress={async () => {
                    setShowOnlyFavorites(false);
                    const result = await fetchSchoolData({ maxFeatures });
                    setData(result);
                  }}
                >
                  <Text style={[
                    styles.filterChipText,
                    !showOnlyFavorites && styles.filterChipTextActive,
                  ]}>{t('app.all')} {t('app.schools')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    showOnlyFavorites && styles.filterChipActive,
                    styles.favoriteChip,
                  ]}
                  onPress={async () => {
                    await fetchUserFavorites(true);
                    const result = await fetchSchoolData({ maxFeatures: 500 });
                    setData(result);
                    setShowOnlyFavorites(true);
                  }}
                >
                  <Ionicons name="heart" size={12} color={showOnlyFavorites ? "white" : "#dc2626"} />
                  <Text style={[
                    styles.filterChipText,
                    showOnlyFavorites && styles.filterChipTextActive,
                  ]}> {t('app.myfollowing')} ({userFavorites.length})</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>{t('app.districts') || t('app.district')}:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  !selectedDistrict && styles.filterChipActive,
                ]}
                onPress={() => setSelectedDistrict(null)}
              >
                <Text style={[
                  styles.filterChipText,
                  !selectedDistrict && styles.filterChipTextActive,
                ]}>{t('app.all')}</Text>
              </TouchableOpacity>
              {districts.map(district => (
                <TouchableOpacity
                  key={district}
                  style={[
                    styles.filterChip,
                    selectedDistrict === district && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedDistrict(district)}
                >
                  <Text style={[
                    styles.filterChipText,
                    selectedDistrict === district && styles.filterChipTextActive,
                  ]}>{district}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>{t('app.genders')}:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  !selectedGender && styles.filterChipActive,
                ]}
                onPress={() => setSelectedGender(null)}
              >
                <Text style={[
                  styles.filterChipText,
                  !selectedGender && styles.filterChipTextActive,
                ]}>{t('app.all')}</Text>
              </TouchableOpacity>
              {genders.map(gender => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.filterChip,
                    selectedGender === gender && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedGender(gender)}
                >
                  <Text style={[
                    styles.filterChipText,
                    selectedGender === gender && styles.filterChipTextActive,
                  ]}>{gender}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>{t('app.showCount')}:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              {[10, 20, 30, 50, 100, 1000].map(num => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.filterChip,
                    maxFeatures === num && styles.filterChipActive,
                  ]}
                  onPress={() => setMaxFeatures(num)}
                >
                  <Text style={[
                    styles.filterChipText,
                    maxFeatures === num && styles.filterChipTextActive,
                  ]}>{num} {t('app.schools')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={[
            styles.statNumber,
            showOnlyFavorites && { color: '#dc2626' }
          ]}>
            {filteredSchools.length}
          </Text>
          <Text style={styles.statLabel}>
            {showOnlyFavorites ? t('app.myfollowing') : t('app.filterResults')}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#64748b' }]}>
            {districts.length}
          </Text>
          <Text style={styles.statLabel}>{t('app.districtCount')}</Text>
        </View>
        <View style={styles.statBox}>
          <View style={styles.statIconContainer}>
            <Ionicons 
              name={userId ? "checkmark-circle" : "close-circle"} 
              size={18} 
              color={userId ? "#10b981" : "#94a3b8"} 
            />
            <Text style={[
              styles.statNumber, 
              { 
                color: userId ? '#10b981' : '#94a3b8',
                marginLeft: 4 
              }
            ]}>
              {userId ? userFavorites.length : '-'}
            </Text>
          </View>
          <Text style={styles.statLabel}>{t('app.myfollowing')}</Text>
        </View>
      </View>

      
      <FlatList
        data={filteredSchools}
        keyExtractor={(item, index) => {
          const schoolId = item.properties.SCHOOL_NO || item.properties['SCHOOL_NO.'] || '';
          return `${schoolId}-${index}`;
        }}
        renderItem={({ item, index }) => {
          const properties = item.properties;
          const schoolId = properties.SCHOOL_NO || properties['SCHOOL_NO.'] || '';
          const displayName = language === 'zh' 
            ? properties.設施名稱 || properties.Facility_Name
            : properties.Facility_Name || properties.設施名稱;
          
          const displayDistrict = language === 'zh'
            ? properties.分區 || properties.District
            : properties.District || properties.分區;

          const isFavorited = isSchoolFavorited(schoolId);
          const favoriteData = getFavoriteData(schoolId);

          return (
            <View style={[
              styles.schoolItem,
              isFavorited && styles.favoriteSchoolItem,
            ]}>
              <TouchableOpacity
                style={styles.schoolItemContent}
                onPress={() => handleSchoolPress(item)}
                activeOpacity={0.7}
              >
                
                <View style={[
                  styles.schoolNumber,
                  isFavorited && styles.favoriteSchoolNumber
                ]}>
                  <Text style={styles.schoolNumberText}>{index + 1}</Text>
                </View>
                
                
                <View style={styles.schoolInfo}>
                  <Text style={styles.schoolName} numberOfLines={2}>
                    {displayName}
                  </Text>
                  <Text style={styles.schoolId}>
                    ID: {schoolId || ''} • {displayDistrict}
                  </Text>
                </View>
              </TouchableOpacity>
              
              
              <TouchableOpacity
                style={[
                  styles.favoriteButton,
                  isFavorited && styles.favoriteButtonActive
                ]}
                onPress={() => handleToggleFavorite(schoolId, displayName)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={isFavorited ? "heart" : "heart-outline"} 
                  size={22} 
                  color={isFavorited ? "#dc2626" : "#94a3b8"} 
                />
              </TouchableOpacity>
            </View>
          );
        }}
        style={styles.scrollView}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              {showOnlyFavorites ? t('app.noSchoolFound') : 
               search ? t('app.noResults') : t('app.noData')}
            </Text>
            {showOnlyFavorites && userId && (
              <TouchableOpacity 
                style={styles.emptyButton}
                onPress={async () => {
                  setShowOnlyFavorites(false);
                  const result = await fetchSchoolData({ maxFeatures });
                  setData(result);
                }}
              >
                <Text style={styles.emptyButtonText}>{t('app.availableSchools')}</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#7c2d12',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loginIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    gap: 4,
  },
  loginText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  userSection: {
    marginTop: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  userId: {
    fontSize: 14,
    color: '#475569',
  },
  favoritesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  favoritesButtonActive: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  favoritesButtonText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  favoritesButtonTextActive: {
    color: 'white',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    padding: 12,
    paddingRight: 40,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 16,
  },
  clearButton: {
    position: 'absolute',
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    marginLeft: 8,
  },
  filterButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  suggestionsContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    maxHeight: 300,
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  suggestionId: {
    fontSize: 12,
    color: '#3b82f6',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  suggestionDistrict: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  suggestionMatchType: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  filtersContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterSection: {
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
  },
  favoriteChip: {
    backgroundColor: '#fecaca',
    borderColor: '#f87171',
  },
  filterChipText: {
    fontSize: 12,
    color: '#64748b',
  },
  filterChipTextActive: {
    color: 'white',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
  },
  statIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  schoolItem: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  favoriteSchoolItem: {
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    backgroundColor: '#fef2f2',
  },
  schoolItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  favoriteBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#fecaca',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  favoriteBadgeText: {
    fontSize: 10,
    color: '#dc2626',
  },
  schoolNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  favoriteSchoolNumber: {
    backgroundColor: '#f87171',
  },
  schoolNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  schoolInfo: {
    flex: 1,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  favoriteButtonActive: {
  },
  schoolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  favoriteDate: {
    fontSize: 10,
    color: '#dc2626',
    fontStyle: 'italic',
  },
  schoolDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  schoolId: {
    fontSize: 12,
    color: '#3b82f6',
    marginTop: 4,
  },
  schoolDistrict: {
    fontSize: 14,
    color: '#64748b',
  },
  favoriteInfo: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#fecaca',
  },
  favoriteInfoText: {
    fontSize: 12,
    color: '#dc2626',
    fontStyle: 'italic',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  emptyButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});