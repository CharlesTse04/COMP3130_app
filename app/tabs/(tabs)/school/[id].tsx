import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchSchoolByNo, fetchSchoolData, SchoolFeature } from '@/services/schoolApi';
import { styles } from './styles';
import SchoolHeader from '../../../../components/School/SchoolHeader';
import SchoolInfo from '../../../../components/School/SchoolInfo';
import SchoolContact from '../../../../components/School/SchoolContact';
import SchoolLocation from '../../../../components/School/SchoolLocation';
import LoadingError from '../../../../components/School/LoadingError';

export default function SchoolDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, language } = useLanguage();
  const [school, setSchool] = useState<SchoolFeature | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Searching for schools,ID:', id);
        
        if (!id) {
          setError('No school ID provided');
          return;
        }

        if (id === 'test') {
          console.log('test mode');
          const testData = await fetchSchoolData({ maxFeatures: 1 });
          if (testData.features.length > 0) {
            setSchool(testData.features[0]);
            setLoading(false);
            return;
          }
        }
        
        const foundSchool = await fetchSchoolByNo(id);
        
        if (foundSchool) {
          console.log('find school:', foundSchool.properties.設施名稱);
          setSchool(foundSchool);
        } else {
          setError(t('app.noSchoolFound') || 'Can\'t find school');
        }
      } catch (err: any) {
        console.error('ERROR:', err);
        setError(err.message || 'School information failed to be retrieved');
      } finally {
        setLoading(false);
      }
    };

    fetchSchool();
  }, [id]);

  
  const getGenderValue = (gender: string) => {
    if (language === 'zh') return gender;
    switch (gender) {
      case 'CO-ED':
      case '男女': return 'Co-ed';
      case 'BOYS':
      case '男校': return 'Boys';
      case 'GIRLS':
      case '女校': return 'Girls';
      default: return gender;
    }
  };

  
  if (loading || error || !school) {
    return (
      <LoadingError 
        loading={loading}
        error={error}
        school={school}
        onRetry={() => {
          setLoading(true);
          setError(null);
          fetchSchoolByNo(id as string).then(setSchool).catch(setError);
        }}
      />
    );
  }

  const properties = school.properties;
  
  
  const displayName = language === 'zh' 
    ? properties.設施名稱 || properties.Facility_Name || ''
    : properties.Facility_Name || properties.設施名稱 || '';
  
  const displayDistrict = language === 'zh'
    ? properties.分區 || properties.District || ''
    : properties.District || properties.分區 || '';
  
  const displayGender = getGenderValue(properties.就讀學生性別 || properties.Students_Gender || '');
  
  const displaySession = language === 'zh'
    ? properties.學校授課時間 || properties.Session || ''
    : properties.Session || properties.學校授課時間 || '';
  
  const displayReligion = language === 'zh'
    ? properties.宗教 || properties.Religion || ''
    : properties.Religion || properties.宗教 || '';
  
  const displayFinanceType = language === 'zh'
    ? properties.資助種類 || properties.Finance_Type || ''
    : properties.Finance_Type || properties.資助種類 || '';

  return (
    <View style={styles.container}>
      
      <SchoolHeader displayName={displayName} />

      <ScrollView style={styles.scrollView}>
        
        <SchoolInfo
          properties={properties}
          language={language}
          displayDistrict={displayDistrict}
          displayGender={displayGender}
          displaySession={displaySession}
          displayReligion={displayReligion}
          displayFinanceType={displayFinanceType}
          getGenderValue={getGenderValue}
          id={id || ''}
        />

        
        <SchoolContact properties={properties} language={language} id={id} />

        
        <SchoolLocation properties={properties} language={language} />

        
        <View style={styles.bottomSpacer} />
      </ScrollView>

      
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>← {t('app.back') || 'Return to list'}</Text>
      </TouchableOpacity>
    </View>
  );
}