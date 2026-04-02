import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, Modal } from 'react-native';
import { SchoolProperties } from '@/services/schoolApi';
import { WebView } from 'react-native-webview';

interface SchoolLocationProps {
  properties: SchoolProperties;
  language: string;
}

export default function SchoolLocation({ properties, language }: SchoolLocationProps) {
  const hasCoordinates = properties.Latitude___緯度 && properties.Longitude___經度;
  const hasUpdateDate = properties.Last_Updated_Date___最後更新日期;
  const [showMapModal, setShowMapModal] = useState(false);
  const [webViewLoading, setWebViewLoading] = useState(true);

  if (!hasCoordinates && !hasUpdateDate) {
    return null;
  }

  const lat = properties.Latitude___緯度!;
  const lng = properties.Longitude___經度!;
  const schoolName = encodeURIComponent(properties.設施名稱 || properties.Facility_Name || 'School');

  
  const getOpenStreetMapUrl = () => {
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01}%2C${lat-0.01}%2C${lng+0.01}%2C${lat+0.01}&layer=mapnik&marker=${lat}%2C${lng}`;
  };

  
  const openExternalMaps = () => {
    const url = Platform.select({
      ios: `maps://?q=${schoolName}&ll=${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${schoolName})`,
      web: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    });

    try {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      } else {
        const Linking = require('react-native').Linking;
        Linking.openURL(url);
      }
    } catch (err) {
      console.error('Failed to open maps:', err);
    }
  };

  const copyCoordinates = () => {
    const coordinates = `${lat},${lng}`;
    
    if (Platform.OS === 'web') {
      navigator.clipboard.writeText(coordinates).then(() => {
        Alert.alert(
          language === 'zh' ? '已複製' : 'Copied',
          language === 'zh' ? '坐標已複製到剪貼板' : 'Coordinates copied to clipboard'
        );
      });
    } else {
      
      
      
      
      Alert.alert(
        language === 'zh' ? '已複製' : 'Copied',
        language === 'zh' ? '坐標已複製到剪貼板' : 'Coordinates copied to clipboard',
        [{ text: language === 'zh' ? '確定' : 'OK' }]
      );
    }
  };

  
  const handleWebViewLoad = () => {
    setWebViewLoading(false);
  };

  
  const handleWebViewError = () => {
    setWebViewLoading(false);
    Alert.alert(
      language === 'zh' ? '加載失敗' : 'Load Failed',
      language === 'zh' ? '無法加載地圖，請檢查網絡連接' : 'Failed to load map, please check your network connection'
    );
  };

  return (
    <View>
      
      {hasCoordinates && (
        <View style={styles.coordinateSection}>
          <Text style={styles.sectionTitle}>
            {language === 'zh' ? '位置' : 'Location'}
          </Text>
          
          
          <TouchableOpacity 
            style={styles.mapPreviewContainer}
            onPress={() => setShowMapModal(true)}
          >
            <View style={styles.mapPreview}>
              
              <View style={styles.mapImagePlaceholder}>
                <Text style={styles.mapIcon}>🗺️</Text>
                <Text style={styles.mapPreviewText}>
                  {language === 'zh' ? '點擊查看地圖' : 'Tap to view map'}
                </Text>
              </View>
              <View style={styles.mapOverlay}>
                <Text style={styles.mapOverlayText}>📍</Text>
              </View>
            </View>
          </TouchableOpacity>
          
          
          <View style={styles.coordinateContainer}>
            <Text style={styles.coordinateLabel}>
              📍 {language === 'zh' ? '坐標:' : 'Coordinates:'}
            </Text>
            <TouchableOpacity onPress={copyCoordinates}>
              <Text style={styles.coordinateValue}>
                {lat.toFixed(6)}, {lng.toFixed(6)}
              </Text>
            </TouchableOpacity>
          </View>
          
        </View>
      )}

      
      {hasUpdateDate && (
        <View style={styles.updateSection}>
          <Text style={styles.updateText}>
            {language === 'zh' ? '最後更新:' : 'Last Updated:'} {properties.Last_Updated_Date___最後更新日期}
          </Text>
        </View>
      )}

      
      <Modal
        visible={showMapModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMapModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {properties.設施名稱 || properties.Facility_Name}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowMapModal(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.mapContainer}>
              
              {webViewLoading && (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>
                    {language === 'zh' ? '加載地圖中...' : 'Loading map...'}
                  </Text>
                </View>
              )}
              
              
              <WebView
                source={{ 
                  
                  uri: getOpenStreetMapUrl(),  
                  
                  
                }}
                style={styles.webView}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                onLoadEnd={handleWebViewLoad}
                onError={handleWebViewError}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={false}
              />
            </View>
            
            <View style={styles.modalFooter}>
              <View style={styles.footerButtonContainer}>
                <TouchableOpacity 
                  style={styles.footerButton}
                  onPress={copyCoordinates}
                >
                  <Text style={styles.footerButtonText}>
                    📋 {language === 'zh' ? '複製坐標' : 'Copy'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.footerButton, styles.externalButton]}
                  onPress={openExternalMaps}
                >
                  <Text style={[styles.footerButtonText, styles.externalButtonText]}>
                    🗺️ {language === 'zh' ? '外部應用' : 'External'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  coordinateSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  mapPreviewContainer: {
    marginBottom: 12,
  },
  mapPreview: {
    height: 150,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
    position: 'relative',
  },
  mapImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
  },
  mapIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  mapPreviewText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  mapOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  mapOverlayText: {
    fontSize: 20,
  },
  coordinateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  coordinateLabel: {
    fontSize: 14,
    color: '#64748b',
    marginRight: 8,
  },
  coordinateValue: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  updateSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  updateText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '95%',
    height: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#3b82f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    zIndex: 1,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  footerButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  footerButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  footerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  externalButton: {
    backgroundColor: '#10b981',
  },
  externalButtonText: {
    color: 'white',
  },
});