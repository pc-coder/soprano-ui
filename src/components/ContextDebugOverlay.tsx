import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useScreenContext } from '../context/ScreenContext';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

export const ContextDebugOverlay: React.FC = () => {
  const { currentScreen, screenData, formState } = useScreenContext();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!__DEV__) {
    return null;
  }

  const formatJSON = (obj: any): string => {
    return JSON.stringify(obj, (key, value) => {
      if (value === null) return 'null';
      if (value === undefined) return 'undefined';
      if (value === '') return '(empty)';
      return value;
    }, 2);
  };

  const hasData = Object.keys(screenData).length > 0;
  const hasFormState = Object.keys(formState).length > 0;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isExpanded ? 'eye-off' : 'eye'}
          size={20}
          color="#fff"
        />
        <Text style={styles.toggleText}>
          {isExpanded ? 'Hide' : 'Debug'}
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.overlay} pointerEvents="auto">
          <View style={styles.header}>
            <Text style={styles.title}>Screen Context Debug</Text>
            <Text style={styles.timestamp}>
              {new Date().toLocaleTimeString()}
            </Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Screen</Text>
              <Text style={styles.screenName}>{currentScreen}</Text>
            </View>

            {hasData && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Screen Data</Text>
                <Text style={styles.jsonText}>{formatJSON(screenData)}</Text>
              </View>
            )}

            {hasFormState && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Form State</Text>
                <Text style={styles.jsonText}>{formatJSON(formState)}</Text>
              </View>
            )}

            {!hasData && !hasFormState && (
              <Text style={styles.noData}>No data tracked yet</Text>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 180,
    left: 20,
    zIndex: 9999,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e63946',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  toggleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  overlay: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    width: 320,
    height: 450,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e63946',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: '#e63946',
    fontSize: 14,
    fontWeight: '700',
  },
  timestamp: {
    color: '#999',
    fontSize: 11,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#e63946',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  screenName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  jsonText: {
    color: '#4ecdc4',
    fontSize: 11,
    fontFamily: 'Courier',
    lineHeight: 16,
  },
  noData: {
    color: '#999',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
});
