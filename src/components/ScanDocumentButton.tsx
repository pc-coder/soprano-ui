import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { DocumentType, scanAddressDocument, scanPANCard } from '../services/documentScanService';

interface ScanDocumentButtonProps {
  documentType: DocumentType;
  onDataExtracted: (data: any) => void;
  label?: string;
}

export const ScanDocumentButton: React.FC<ScanDocumentButtonProps> = ({
  documentType,
  onDataExtracted,
  label,
}) => {
  const [isScanning, setIsScanning] = useState(false);

  const getButtonLabel = () => {
    if (label) return label;
    return documentType === 'address' ? 'Scan Address Document' : 'Scan PAN Card';
  };

  const handleScan = async () => {
    try {
      setIsScanning(true);

      // Haptic feedback
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Scan document based on type
      let extractedData;
      if (documentType === 'address') {
        extractedData = await scanAddressDocument(true);
      } else {
        extractedData = await scanPANCard(true);
      }

      // Success haptic
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Call callback with extracted data
      onDataExtracted(extractedData);

      // Show success message
      Alert.alert(
        'Success',
        `${documentType === 'address' ? 'Address' : 'PAN'} details extracted successfully!`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('[ScanDocumentButton] Scan error:', error.message);

      // Error haptic
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      // Show error message
      if (error.message.includes('permission')) {
        Alert.alert(
          'Permission Required',
          'Please grant camera permission to scan documents.',
          [{ text: 'OK' }]
        );
      } else if (error.message.includes('No image captured')) {
        // User cancelled, no need to show error
      } else {
        Alert.alert(
          'Scan Failed',
          'Failed to extract document details. Please try again or enter manually.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleScan}
      disabled={isScanning}
      activeOpacity={0.7}
    >
      {isScanning ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <MaterialCommunityIcons name="camera" size={20} color={colors.primary} />
      )}
      <Text style={styles.label}>
        {isScanning ? 'Processing...' : getButtonLabel()}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    marginTop: spacing.sm,
  },
  label: {
    ...typography.body,
    color: colors.primary,
    marginLeft: spacing.sm,
    fontWeight: '600',
  },
});
