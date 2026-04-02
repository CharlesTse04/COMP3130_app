import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';

const LanguageSwitcher = () => {
  const { language, setLanguage, t } = useLanguage();
  const [modalVisible, setModalVisible] = React.useState(false);

  const languages = [
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
  ];

  const currentLang = languages.find(lang => lang.code === language);

  return (
    <>
      <TouchableOpacity
        style={styles.switcherButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.flagText}>{currentLang?.flag}</Text>
        <Text style={styles.languageText}>{currentLang?.name}</Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>選擇語言 / Select Language</Text>
                <ScrollView>
                  {languages.map((lang) => (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.languageOption,
                        language === lang.code && styles.selectedOption,
                      ]}
                      onPress={() => {
                        setLanguage(lang.code as 'zh' | 'en');
                        setModalVisible(false);
                      }}
                    >
                      <Text style={styles.optionFlag}>{lang.flag}</Text>
                      <Text style={[
                        styles.optionText,
                        language === lang.code && styles.selectedOptionText,
                      ]}>
                        {lang.name}
                      </Text>
                      {language === lang.code && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  switcherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginLeft: 8,
  },
  flagText: {
    fontSize: 16,
    marginRight: 6,
  },
  languageText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
    marginRight: 4,
  },
  arrow: {
    fontSize: 10,
    color: '#64748b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 300,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
  },
  selectedOption: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  optionFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#475569',
  },
  selectedOptionText: {
    color: '#1e40af',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
});

export default LanguageSwitcher;