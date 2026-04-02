import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';

interface LoadingErrorProps {
  loading: boolean;
  error: string | null;
  school: any;
  onRetry?: () => void;
}

export default function LoadingError({ 
  loading, 
  error, 
  school, 
  onRetry 
}: LoadingErrorProps) {
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>loading...</Text>
      </View>
    );
  }

  if (error || !school) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'not found'}</Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← back</Text>
        </TouchableOpacity>
        {onRetry && (
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={onRetry}
          >
            <Text style={styles.retryButtonText}>reset</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#334155',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});