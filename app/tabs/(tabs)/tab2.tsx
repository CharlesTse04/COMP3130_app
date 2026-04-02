import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchSchoolData, SchoolFeature } from '@/services/schoolApi';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Tab1() {
  const { t, language } = useLanguage();
  const [allSchools, setAllSchools] = useState<SchoolFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  
  
  const [selectedSchools, setSelectedSchools] = useState<SchoolFeature[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [maxSchoolsToLoad, setMaxSchoolsToLoad] = useState(50);

    const handleLoginPress = () => {
      router.push('/tabs/(tabs)/login');
    };

  const fetchSchools = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchSchoolData({ maxFeatures: maxSchoolsToLoad });
      setAllSchools(result.features || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, [maxSchoolsToLoad]);

  
  const addToComparison = useCallback((school: SchoolFeature) => {
    const maxComparison = 5;
    const schoolId = school.properties.學校編號 || String(school.properties.OBJECTID);
    
    
    const alreadySelected = selectedSchools.some(
      s => s.properties.學校編號 === schoolId || 
           s.properties.OBJECTID === school.properties.OBJECTID
    );
    
    if (alreadySelected) {
      Alert.alert(
        t('app.alreadySelected'),
        t('app.alreadyInComparison')
      );
      return;
    }
    
    if (selectedSchools.length >= maxComparison) {
      Alert.alert(
        t('app.maxReachedTitle'),
        t('app.maxReached', { count: maxComparison })
      );
      return;
    }
    
    setSelectedSchools([...selectedSchools, school]);
    
    const schoolName = language === 'zh' 
      ? school.properties.設施名稱 || school.properties.Facility_Name
      : school.properties.Facility_Name || school.properties.設施名稱;
    
    Alert.alert(
      t('app.added'),
      `${schoolName} ${t('app.addedToComparison')}`,
      [{ text: t('app.ok') }]
    );
  }, [selectedSchools, language, t]);

  
  const removeFromComparison = useCallback((schoolId: string) => {
    setSelectedSchools(selectedSchools.filter(
      school => school.properties.學校編號 !== schoolId && 
                String(school.properties.OBJECTID) !== schoolId
    ));
  }, [selectedSchools]);

  
  const clearComparison = useCallback(() => {
    Alert.alert(
      t('app.confirmClear'),
      t('app.confirmClearMessage'),
      [
        { text: t('app.cancel'), style: 'cancel' },
        { 
          text: t('app.ok'), 
          onPress: () => setSelectedSchools([]) 
        },
      ]
    );
  }, [t]);

  
  const filteredSchools = useMemo(() => allSchools.filter(school => {
    if (!search.trim()) return true;
    
    const query = search.toLowerCase();
    const chineseName = (school.properties.設施名稱 || '').toLowerCase();
    const englishName = (school.properties.Facility_Name || '').toLowerCase();
    const district = (school.properties.分區 || school.properties.District || '').toLowerCase();
    
    return chineseName.includes(query) || 
           englishName.includes(query) || 
           district.includes(query);
  }), [allSchools, search]);

  
  const getGenderDisplay = useCallback((gender: string) => {
    if (language === 'zh') return gender;
    switch (gender) {
      case 'CO-ED':
      case '男女': return t('filters.coed');
      case 'BOYS':
      case '男校': return t('filters.boys');
      case 'GIRLS':
      case '女校': return t('filters.girls');
      default: return gender;
    }
  }, [language, t]);

  
  const comparisonFields = useMemo(() => [
    { key: '設施名稱', label: t('comparison.schoolName') },
    { key: '分區', label: t('comparison.district') },
    { key: '就讀學生性別', label: t('comparison.gender') },
    { key: '學校授課時間', label: t('comparison.session') },
    { key: '宗教', label: t('comparison.religion') },
    { key: '資助種類', label: t('comparison.financeType') },
    { key: '聯絡電話', label: t('comparison.phone') },
    { key: '地址', label: t('comparison.address') },
  ], [t]);

  const checkFieldDifference = useCallback((fieldKey: string) => {
    if (selectedSchools.length < 2) return false;
    
    const values = selectedSchools.map(school => {
      let value = school.properties[fieldKey as keyof typeof school.properties] || '-';
      if (fieldKey === '就讀學生性別' && value !== '-') {
        value = getGenderDisplay(value as string);
      }
      return String(value).trim();
    });
    
    const firstValue = values[0];
    return values.some(v => v !== firstValue);
  }, [selectedSchools, getGenderDisplay]);

  const comparisonStats = useMemo(() => {
    let sameCount = 0;
    let diffCount = 0;
    
    comparisonFields.forEach(field => {
      if (checkFieldDifference(field.key)) {
        diffCount++;
      } else {
        sameCount++;
      }
    });
    
    return { sameCount, diffCount };
  }, [comparisonFields, checkFieldDifference]);

  
  const handleLoadCountSelect = useCallback(() => {
    Alert.alert(
      t('app.selectLoadCount'),
      '',
      [
        { text: '50', onPress: () => setMaxSchoolsToLoad(50) },
        { text: '100', onPress: () => setMaxSchoolsToLoad(100) },
        { text: '200', onPress: () => setMaxSchoolsToLoad(200) },
        { text: t('app.cancel'), style: 'cancel' },
      ]
    );
  }, [t]);

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
        <TouchableOpacity style={styles.button} onPress={fetchSchools}>
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
            <Text style={styles.title}>
              {t('app.compareSchools')}
            </Text>
            <Text style={styles.subtitle}>
              {t('app.selectUpToFive')}
            </Text>
          </View>
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

      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('app.searchPlaceholder')}
          value={search}
          onChangeText={setSearch}
        />
  
      </View>

      
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{filteredSchools.length}</Text>
          <Text style={styles.statLabel}>
            {t('app.availableSchools')}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>
            {selectedSchools.length}
          </Text>
          <Text style={styles.statLabel}>
            {t('app.selectedSchools')}
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statNumber, { color: '#8b5cf6' }]}>
            {maxSchoolsToLoad}
          </Text>
          <TouchableOpacity onPress={handleLoadCountSelect}>
            <Text style={[styles.statLabel, { color: '#8b5cf6' }]}>
              {t('app.loadCount')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      
      {selectedSchools.length > 0 && (
        <View style={styles.comparisonPanel}>
          <View style={styles.comparisonHeader}>
            <Text style={styles.comparisonTitle}>
              {t('app.selectedSchools')} ({selectedSchools.length}/5)
            </Text>
            <View style={styles.comparisonButtons}>
              <TouchableOpacity 
                style={styles.compareButton}
                onPress={() => setShowComparison(true)}
              >
                <Text style={styles.compareButtonText}>
                  {t('app.startComparison')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.selectedSchoolsContainer}>
              {selectedSchools.map((school, index) => {
                const properties = school.properties;
                const displayName = language === 'zh'
                  ? properties.設施名稱 || properties.Facility_Name
                  : properties.Facility_Name || properties.設施名稱;

                return (
                  <View key={`selected-${index}`} style={styles.selectedSchoolCard}>
                    <View style={styles.selectedSchoolHeader}>
                      <View style={styles.schoolIndex}>
                        <Text style={styles.schoolIndexText}>{index + 1}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeSelectedButton}
                        onPress={() => removeFromComparison(properties.學校編號 || String(properties.OBJECTID))}
                      >
                        <Text style={styles.removeSelectedButtonText}>×</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.selectedSchoolName} numberOfLines={2}>
                      {displayName}
                    </Text>
                    <Text style={styles.selectedSchoolDistrict}>
                      {properties.分區 || properties.District}
                    </Text>
                    <Text style={styles.selectedSchoolGender}>
                      {getGenderDisplay(properties.就讀學生性別 || properties.Students_Gender || '')}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      
      <FlatList
        data={filteredSchools}
        keyExtractor={(item, index) => `school-${item.properties.OBJECTID}-${index}`}
        renderItem={({ item, index }) => {
          const properties = item.properties;
          const displayName = language === 'zh'
            ? properties.設施名稱 || properties.Facility_Name
            : properties.Facility_Name || properties.設施名稱;
          
          const isSelected = selectedSchools.some(
            s => s.properties.OBJECTID === properties.OBJECTID
          );

          return (
            <TouchableOpacity
              style={[styles.schoolCard, isSelected && styles.schoolCardSelected]}
              onPress={() => addToComparison(item)}
            >
              <View style={styles.schoolCardHeader}>
                <View style={styles.schoolCardNumber}>
                  <Text style={styles.schoolCardNumberText}>{index + 1}</Text>
                </View>
                <View style={[
                  styles.selectionIndicator,
                  isSelected && styles.selectionIndicatorSelected
                ]}>
                  <Text style={[
                    styles.selectionIndicatorText,
                    isSelected && styles.selectionIndicatorTextSelected
                  ]}>
                    {isSelected ? '✓' : '+'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.schoolCardName} numberOfLines={2}>
                {displayName}
              </Text>
              
              <View style={styles.schoolCardDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {t('school.district')}:
                  </Text>
                  <Text style={styles.detailValue}>
                    {properties.分區 || properties.District}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {t('school.gender')}:
                  </Text>
                  <Text style={styles.detailValue}>
                    {getGenderDisplay(properties.就讀學生性別 || properties.Students_Gender || '')}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>
                    {t('school.session')}:
                  </Text>
                  <Text style={styles.detailValue}>
                    {language === 'zh' 
                      ? properties.學校授課時間 || properties.Session
                      : properties.Session || properties.學校授課時間}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.selectHint}>
                {t('app.tapToAdd')}
              </Text>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              {t('app.noResults')}
            </Text>
            <Text style={styles.emptyText}>
              {t('app.noResultsHint')}
            </Text>
          </View>
        }
      />

      
      {showComparison && selectedSchools.length > 0 && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t('app.comparisonResult')}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowComparison(false)}
              >
                <Text style={styles.modalCloseButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.comparisonStatsBar}>
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                <Text style={styles.statItemText}>
                  {t('comparison.same')}: {comparisonStats.sameCount}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="alert-circle" size={18} color="#f59e0b" />
                <Text style={styles.statItemText}>
                  {t('comparison.different')}: {comparisonStats.diffCount}
                </Text>
              </View>
            </View>

            <ScrollView style={styles.comparisonTableContainer} horizontal>
              <View style={styles.comparisonTable}>
                
                <View style={styles.tableHeader}>
                  <View style={[styles.tableCell, styles.statusColumn]}>
                    <Text style={styles.tableHeaderText}>
                      {t('comparison.status')}
                    </Text>
                  </View>
                  <View style={[styles.tableCell, styles.firstColumn]}>
                    <Text style={styles.tableHeaderText}>
                      {t('app.comparisonItems')}
                    </Text>
                  </View>
                  {selectedSchools.map((_, index) => (
                    <View key={`header-${index}`} style={styles.tableCell}>
                      <Text style={styles.schoolHeaderText}>
                        {t('comparison.school')} {index + 1}
                      </Text>
                    </View>
                  ))}
                </View>

                
                {comparisonFields.map((field, rowIndex) => {
                  const hasDifference = checkFieldDifference(field.key);
                  
                  return (
                    <View 
                      key={field.key} 
                      style={[
                        styles.tableRow,
                        hasDifference ? styles.diffRow : styles.sameRow
                      ]}
                    >
                      <View style={[styles.tableCell, styles.statusColumn]}>
                        {hasDifference ? (
                          <View style={styles.diffBadge}>
                            <Ionicons name="alert-circle" size={16} color="#f59e0b" />
                            <Text style={styles.diffBadgeText}>{t('comparison.diff')}</Text>
                          </View>
                        ) : (
                          <View style={styles.sameBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                            <Text style={styles.sameBadgeText}>{t('comparison.same')}</Text>
                          </View>
                        )}
                      </View>
                      <View style={[styles.tableCell, styles.firstColumn]}>
                        <Text style={[styles.fieldLabel, hasDifference && styles.fieldLabelDiff]}>
                          {field.label}
                        </Text>
                      </View>
                      {selectedSchools.map((school, colIndex) => {
                        const properties = school.properties;
                        let value = properties[field.key as keyof typeof properties] || '-';
                        
                        if (field.key === '就讀學生性別' && value !== '-') {
                          value = getGenderDisplay(value as string);
                        }
                        
                        return (
                          <View 
                            key={`cell-${rowIndex}-${colIndex}`} 
                            style={[
                              styles.tableCell,
                              hasDifference && styles.diffCell
                            ]}
                          >
                            <Text style={[
                              styles.fieldValue,
                              hasDifference && styles.fieldValueDiff
                            ]}>
                              {value}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setShowComparison(false)}
              >
                <Text style={styles.closeModalButtonText}>
                  {t('app.closeComparison')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
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
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 16,
    marginRight: 8,
  },
  refreshButton: {
    backgroundColor: '#3b82f6',
    width: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 20,
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
    padding: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  comparisonPanel: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  comparisonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  comparisonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  comparisonButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  clearButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  compareButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  compareButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  selectedSchoolsContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  selectedSchoolCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    width: 140,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  selectedSchoolHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  schoolIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  schoolIndexText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  removeSelectedButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeSelectedButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedSchoolName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  selectedSchoolDistrict: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  selectedSchoolGender: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  schoolCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  schoolCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#f0f9ff',
  },
  schoolCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  schoolCardNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  schoolCardNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectionIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },
  selectionIndicatorSelected: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  selectionIndicatorText: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: 'bold',
  },
  selectionIndicatorTextSelected: {
    color: 'white',
  },
  schoolCardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  schoolCardDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailLabel: {
    width: 60,
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
  },
  selectHint: {
    fontSize: 12,
    color: '#8b5cf6',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '95%',
    maxHeight: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#3b82f6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  comparisonTableContainer: {
    maxHeight: 500,
  },
  comparisonTable: {
    minWidth: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 2,
    borderBottomColor: '#cbd5e1',
  },
  tableRow: {
    flexDirection: 'row',
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sameRow: {
    backgroundColor: '#f0fdf4',
  },
  diffRow: {
    backgroundColor: '#fffbeb',
  },
  tableCell: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    minWidth: 120,
    borderRightWidth: 1,
    borderRightColor: '#e2e8f0',
  },
  diffCell: {
    backgroundColor: '#fef3c7',
  },
  statusColumn: {
    flex: 0,
    minWidth: 70,
    maxWidth: 70,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  firstColumn: {
    flex: 0.6,
    backgroundColor: '#f1f5f9',
    minWidth: 100,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
    textAlign: 'center',
  },
  schoolHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b82f6',
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'right',
    paddingRight: 8,
  },
  fieldLabelDiff: {
    color: '#b45309',
    fontWeight: '700',
  },
  fieldValue: {
    fontSize: 13,
    color: '#334155',
    textAlign: 'center',
  },
  fieldValueDiff: {
    color: '#92400e',
    fontWeight: '600',
  },
  comparisonStatsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 2,
  },
  diffBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#b45309',
  },
  sameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 2,
  },
  sameBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#166534',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  closeModalButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});