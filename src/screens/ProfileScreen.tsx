import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { CommonActions } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useScreenContext } from '../context/ScreenContext';
import { Card } from '../components/Card';
import { Soprano } from '../components/Soprano';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useApp();
  const { logout } = useAuth();
  const {
    showCaptions,
    setShowCaptions,
    sttProvider,
    setSttProvider,
    llmProvider,
    setLlmProvider,
    ttsProvider,
    setTtsProvider,
    ocrProvider,
    setOcrProvider,
  } = useSettings();
  const { setCurrentScreen } = useScreenContext();
  const account = user.accounts[0];

  useEffect(() => {
    setCurrentScreen('Profile');
  }, []);

  const handleLogout = () => {
    logout();
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'PINLogin' }],
      })
    );
  };

  const profileSections = [
    {
      title: 'Personal Information',
      items: [
        { icon: 'person-outline', label: 'Name', value: user.name },
        { icon: 'call-outline', label: 'Phone', value: user.phone },
        { icon: 'mail-outline', label: 'Email', value: user.email },
        { icon: 'wallet-outline', label: 'UPI ID', value: user.upiId },
      ],
    },
    {
      title: 'Account Details',
      items: [
        { icon: 'business-outline', label: 'Bank Name', value: account.bankName },
        { icon: 'card-outline', label: 'Account Type', value: account.type },
        { icon: 'key-outline', label: 'Account Number', value: account.maskedNumber },
        { icon: 'git-branch-outline', label: 'IFSC Code', value: account.ifsc },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Profile Header */}
        <Card style={styles.headerCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userId}>ID: {user.id}</Text>
        </Card>

        {/* Profile Sections */}
        {profileSections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Card>
              {section.items.map((item, itemIndex) => (
                <View
                  key={itemIndex}
                  style={[
                    styles.infoRow,
                    itemIndex < section.items.length - 1 && styles.infoRowBorder,
                  ]}
                >
                  <View style={styles.infoLeft}>
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.infoLabel}>{item.label}</Text>
                  </View>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              ))}
            </Card>
          </View>
        ))}

        {/* AI Service Providers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Service Providers</Text>
          <Card>
            {/* STT Provider */}
            <View style={[styles.settingRow, styles.infoRowBorder]}>
              <View style={styles.providerSetting}>
                <View style={styles.infoLeft}>
                  <MaterialCommunityIcons
                    name="microphone-outline"
                    size={20}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.infoLabel}>Speech to Text</Text>
                </View>
                <View style={styles.providerOptions}>
                  <TouchableOpacity
                    style={[
                      styles.providerButton,
                      sttProvider === 'openai' && styles.providerButtonActive,
                    ]}
                    onPress={() => setSttProvider('openai')}
                  >
                    <Text
                      style={[
                        styles.providerButtonText,
                        sttProvider === 'openai' && styles.providerButtonTextActive,
                      ]}
                    >
                      OpenAI
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.providerButton,
                      sttProvider === 'expo-speech' && styles.providerButtonActive,
                    ]}
                    onPress={() => setSttProvider('expo-speech')}
                  >
                    <Text
                      style={[
                        styles.providerButtonText,
                        sttProvider === 'expo-speech' && styles.providerButtonTextActive,
                      ]}
                    >
                      Expo (Offline)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* LLM Provider */}
            <View style={[styles.settingRow, styles.infoRowBorder]}>
              <View style={styles.providerSetting}>
                <View style={styles.infoLeft}>
                  <MaterialCommunityIcons
                    name="brain"
                    size={20}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.infoLabel}>Language Model</Text>
                </View>
                <View style={styles.providerOptions}>
                  <TouchableOpacity
                    style={[
                      styles.providerButton,
                      llmProvider === 'claude' && styles.providerButtonActive,
                    ]}
                    onPress={() => setLlmProvider('claude')}
                  >
                    <Text
                      style={[
                        styles.providerButtonText,
                        llmProvider === 'claude' && styles.providerButtonTextActive,
                      ]}
                    >
                      Claude
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.providerButton,
                      llmProvider === 'qwen' && styles.providerButtonActive,
                    ]}
                    onPress={() => setLlmProvider('qwen')}
                  >
                    <Text
                      style={[
                        styles.providerButtonText,
                        llmProvider === 'qwen' && styles.providerButtonTextActive,
                      ]}
                    >
                      Qwen (Offline)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* TTS Provider */}
            <View style={[styles.settingRow, styles.infoRowBorder]}>
              <View style={styles.providerSetting}>
                <View style={styles.infoLeft}>
                  <MaterialCommunityIcons
                    name="volume-high"
                    size={20}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.infoLabel}>Text to Speech</Text>
                </View>
                <View style={styles.providerOptions}>
                  <TouchableOpacity
                    style={[
                      styles.providerButton,
                      ttsProvider === 'elevenlabs' && styles.providerButtonActive,
                    ]}
                    onPress={() => setTtsProvider('elevenlabs')}
                  >
                    <Text
                      style={[
                        styles.providerButtonText,
                        ttsProvider === 'elevenlabs' && styles.providerButtonTextActive,
                      ]}
                    >
                      ElevenLabs
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.providerButton,
                      ttsProvider === 'expo-speech' && styles.providerButtonActive,
                    ]}
                    onPress={() => setTtsProvider('expo-speech')}
                  >
                    <Text
                      style={[
                        styles.providerButtonText,
                        ttsProvider === 'expo-speech' && styles.providerButtonTextActive,
                      ]}
                    >
                      Expo (Offline)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* OCR Provider */}
            <View style={styles.settingRow}>
              <View style={styles.providerSetting}>
                <View style={styles.infoLeft}>
                  <MaterialCommunityIcons
                    name="ocr"
                    size={20}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.infoLabel}>OCR (Text Recognition)</Text>
                </View>
                <View style={styles.providerOptions}>
                  <TouchableOpacity
                    style={[
                      styles.providerButton,
                      ocrProvider === 'claude' && styles.providerButtonActive,
                    ]}
                    onPress={() => setOcrProvider('claude')}
                  >
                    <Text
                      style={[
                        styles.providerButtonText,
                        ocrProvider === 'claude' && styles.providerButtonTextActive,
                      ]}
                    >
                      Claude
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.providerButton,
                      ocrProvider === 'smolvlm' && styles.providerButtonActive,
                    ]}
                    onPress={() => setOcrProvider('smolvlm')}
                  >
                    <Text
                      style={[
                        styles.providerButtonText,
                        ocrProvider === 'smolvlm' && styles.providerButtonTextActive,
                      ]}
                    >
                      SmolVLM (Offline)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Card>
        </View>

        {/* Settings Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <Card>
            <TouchableOpacity style={[styles.settingRow, styles.infoRowBorder]}>
              <View style={styles.infoLeft}>
                <MaterialCommunityIcons
                  name="lock-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <Text style={styles.infoLabel}>Change PIN</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={[styles.settingRow, styles.infoRowBorder]}>
              <View style={styles.infoLeft}>
                <MaterialCommunityIcons
                  name="closed-caption-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <Text style={styles.infoLabel}>Voice Assistant Captions</Text>
              </View>
              <Switch
                value={showCaptions}
                onValueChange={setShowCaptions}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={showCaptions ? colors.primary : colors.textMuted}
              />
            </View>
            <TouchableOpacity style={[styles.settingRow, styles.infoRowBorder]}>
              <View style={styles.infoLeft}>
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <Text style={styles.infoLabel}>Notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.settingRow, styles.infoRowBorder]}>
              <View style={styles.infoLeft}>
                <MaterialCommunityIcons
                  name="help-circle-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <Text style={styles.infoLabel}>Help & Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingRow} onPress={handleLogout}>
              <View style={styles.infoLeft}>
                <MaterialCommunityIcons
                  name="logout"
                  size={20}
                  color={colors.error}
                />
                <Text style={[styles.infoLabel, { color: colors.error }]}>Logout</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.error} />
            </TouchableOpacity>
          </Card>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Soprano />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.md,
  },
  headerCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.h2,
    color: '#fff',
    fontWeight: '600',
  },
  userName: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  userId: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginLeft: spacing.md,
  },
  infoValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  providerSetting: {
    flex: 1,
  },
  providerOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  providerButton: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  providerButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight + '20',
  },
  providerButtonText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  providerButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default ProfileScreen;
