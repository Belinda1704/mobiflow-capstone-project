// Account: show phone, change phone or password.
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { ScreenHeader } from '../components/ScreenHeader';
import { SettingsRow } from '../components/SettingsRow';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { FontFamily } from '../constants/colors';
import { SUPPORT_EMAIL } from '../constants/support';
import { getDisplayLabelFromAuthId } from '../utils/userUtils';
import { showError } from '../services/errorPresenter';
import { updatePassword as doUpdatePassword, updatePhoneNumber as doUpdatePhoneNumber, isEmailPasswordUser } from '../services/authService';
import { normalizeRwandaPhone } from '../utils/phoneUtils';

export default function AccountScreen() {
  const { colors } = useThemeColors();
  const { t } = useTranslations();
  const { user } = useCurrentUser();
  const authId = user?.email ?? '';
  const displayPhone = getDisplayLabelFromAuthId(authId);
  const canChangeCredentials = isEmailPasswordUser();

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [phoneModalVisible, setPhoneModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChangePhone() {
    if (!canChangeCredentials) {
      showError(t('comingSoon'), t('comingSoonChangePhone', { email: SUPPORT_EMAIL }));
      return;
    }
    setCurrentPassword('');
    setNewPhone('');
    setPhoneModalVisible(true);
  }

  function handleChangePassword() {
    if (!canChangeCredentials) {
      showError(t('comingSoon'), t('comingSoonChangePassword', { email: SUPPORT_EMAIL }));
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordModalVisible(true);
  }

  async function submitPasswordChange() {
    if (newPassword !== confirmPassword) {
      showError(t('error'), t('passwordsDoNotMatch'));
      return;
    }
    if (newPassword.length < 6) {
      showError(t('error'), t('weakPassword') || 'Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await doUpdatePassword(currentPassword, newPassword);
      setPasswordModalVisible(false);
      Alert.alert(t('passwordUpdated'), '', [{ text: t('ok') }]);
    } catch (e: any) {
      const msg = e?.message || t('couldNotDeleteTransaction');
      showError(t('error'), msg);
    } finally {
      setLoading(false);
    }
  }

  async function submitPhoneChange() {
    const normalized = normalizeRwandaPhone(newPhone);
    if (!normalized || normalized.length < 9) {
      showError(t('error'), t('invalidPhone') || 'Please enter a valid Rwandan phone number.');
      return;
    }
    setLoading(true);
    try {
      await doUpdatePhoneNumber(currentPassword, newPhone.trim());
      setPhoneModalVisible(false);
      Alert.alert(t('phoneNumberUpdated'), '', [{ text: t('ok') }]);
    } catch (e: any) {
      const msg = e?.message || t('couldNotDeleteTransaction');
      showError(t('error'), msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title={t('account')} subtitle={t('changePhonePassword')} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('currentPhone')}</Text>
          <Text style={[styles.value, { color: colors.textPrimary }]}>{displayPhone || t('notSet')}</Text>
        </View>
        <SettingsRow
          icon="call-outline"
          label={t('changePhoneNumber')}
          subtitle={t('updateLoginPhone')}
          onPress={handleChangePhone}
          colors={colors}
        />
        <SettingsRow
          icon="lock-closed-outline"
          label={t('changePassword')}
          subtitle={t('updatePassword')}
          onPress={handleChangePassword}
          colors={colors}
        />
      </ScrollView>

      {/* Change password modal */}
      <Modal visible={passwordModalVisible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('changePassword')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder={t('currentPassword')}
              placeholderTextColor={colors.textSecondary}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder={t('newPassword')}
              placeholderTextColor={colors.textSecondary}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder={t('confirmNewPassword')}
              placeholderTextColor={colors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={() => setPasswordModalVisible(false)}
                disabled={loading}>
                <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.accent, borderColor: 'transparent' }]}
                onPress={submitPasswordChange}
                disabled={loading}>
                <Text style={[styles.modalBtnText, { color: colors.onAccent }]}>{t('update')}</Text>
              </TouchableOpacity>
            </View>
            {loading && <ActivityIndicator size="small" color={colors.listIcon ?? colors.primary} style={styles.loader} />}
          </View>
        </View>
      </Modal>

      {/* Change phone modal */}
      <Modal visible={phoneModalVisible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('changePhoneNumber')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder={t('currentPassword')}
              placeholderTextColor={colors.textSecondary}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder={t('newPhoneNumber')}
              placeholderTextColor={colors.textSecondary}
              value={newPhone}
              onChangeText={setNewPhone}
              keyboardType="phone-pad"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={() => setPhoneModalVisible(false)}
                disabled={loading}>
                <Text style={[styles.modalBtnText, { color: colors.textSecondary }]}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.accent, borderColor: 'transparent' }]}
                onPress={submitPhoneChange}
                disabled={loading}>
                <Text style={[styles.modalBtnText, { color: colors.onAccent }]}>{t('update')}</Text>
              </TouchableOpacity>
            </View>
            {loading && <ActivityIndicator size="small" color={colors.listIcon ?? colors.primary} style={styles.loader} />}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  card: {
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  label: { fontSize: 12, fontFamily: FontFamily.regular, marginBottom: 4 },
  value: { fontSize: 16, fontFamily: FontFamily.semiBold },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FontFamily.semiBold,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalBtnText: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
  },
  loader: { marginTop: 12 },
});
