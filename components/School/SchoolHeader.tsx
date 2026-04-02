import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SchoolHeaderProps {
  displayName: string;
}

export default function SchoolHeader({ displayName }: SchoolHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title} numberOfLines={2}>
        {displayName}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
  },
});