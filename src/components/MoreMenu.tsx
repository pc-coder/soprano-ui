import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface MoreMenuProps {
  visible: boolean;
  onClose: () => void;
  onProfile: () => void;
  onHelp: () => void;
  anchorPosition?: { x: number; y: number };
}

export const MoreMenu: React.FC<MoreMenuProps> = ({
  visible,
  onClose,
  onProfile,
  onHelp,
  anchorPosition,
}) => {
  const menuItems = [
    {
      icon: 'account-outline',
      label: 'Profile',
      onPress: () => {
        onClose();
        onProfile();
      },
    },
    {
      icon: 'help-circle-outline',
      label: 'Help',
      onPress: () => {
        onClose();
        onHelp();
      },
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.menu,
                anchorPosition && {
                  position: 'absolute',
                  top: anchorPosition.y + 10,
                  right: 20,
                },
              ]}
            >
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.menuItem,
                    index < menuItems.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={20}
                    color={colors.textPrimary}
                  />
                  <Text style={styles.menuText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  menu: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: spacing.xs,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.md,
  },
});
