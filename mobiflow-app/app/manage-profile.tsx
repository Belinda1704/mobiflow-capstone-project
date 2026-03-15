// Manage profile: display name, business name, business type.
import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Modal, Pressable, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScreenHeader } from '../components/ScreenHeader';
import { useProfileDisplay } from '../hooks/usePreferences';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useThemeColors } from '../contexts/ThemeContext';
import { useTranslations } from '../hooks/useTranslations';
import { FontFamily } from '../constants/colors';
import { getDisplayLabelFromAuthId } from '../utils/userUtils';
import { showError } from '../services/errorPresenter';
import { getFriendlyAuthErrorMessage } from '../utils/authErrorUtils';
import type { BusinessType } from '../services/preferencesService';

const BUSINESS_TYPES: BusinessType[] = ['retail', 'services', 'agriculture', 'other'];
const COMPACT_DROPDOWN_MAX_HEIGHT = 280;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ManageProfileScreen() {
  const { colors, isDark } = useThemeColors();
  const dropdownSelectedBg = isDark ? 'rgba(255,255,255,0.08)' : colors.surface;
  const { t } = useTranslations();
  const { user } = useCurrentUser();
  const { displayName, businessName, businessType, updateDisplayName, updateBusinessName, updateBusinessType, loading } = useProfileDisplay();

  const [name, setName] = useState('');
  const [business, setBusiness] = useState('My Business');
  const [type, setType] = useState<BusinessType>('other');
  const [showBusinessTypeModal, setShowBusinessTypeModal] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const businessTypeTriggerRef = useRef<View>(null);

  useEffect(() => {
    // Sync form when profile loads
    setName(displayName || '');
    setBusiness(businessName || 'My Business');
    setType(businessType);
  }, [displayName, businessName, businessType]);

  function openBusinessTypeDropdown() {
    businessTypeTriggerRef.current?.measureInWindow((x, y, width, height) => {
      setDropdownLayout({ x, y, width, height });
      setShowBusinessTypeModal(true);
    });
  }

  function getCompactDropdownPosition(layout: { x: number; y: number; width: number; height: number }) {
    const spaceBelow = SCREEN_HEIGHT - layout.y - layout.height - 24;
    const showAbove = spaceBelow < 180;
    const maxH = Math.min(COMPACT_DROPDOWN_MAX_HEIGHT, showAbove ? layout.y - 24 : spaceBelow);
    const top = showAbove ? layout.y - maxH - 4 : layout.y + layout.height + 4;
    return { top, left: layout.x, width: layout.width, maxHeight: maxH };
  }
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await updateDisplayName(name.trim());
      await updateBusinessName(business.trim());
      await updateBusinessType(type);
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (e) {
      showError('Error', getFriendlyAuthErrorMessage(e) || 'Could not save profile.');
      setSaving(false);
    }
  }

  // Data from cache
  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
      <ScreenHeader title={t('manageProfile')} subtitle={t('editYourProfile')} />
      <ScrollView style={styles.content} contentContainerStyle={styles.padding} showsVerticalScrollIndicator={false}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Display name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
          placeholder={t('yourNameOrBusiness')}
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
        />
        <Text style={[styles.label, { marginTop: 20, color: colors.textSecondary }]}>Business name</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
          placeholder={t('myBusiness')}
          placeholderTextColor={colors.textSecondary}
          value={business}
          onChangeText={setBusiness}
        />
        <Text style={[styles.label, { marginTop: 20, color: colors.textSecondary }]}>{t('businessType')}</Text>
        <View ref={businessTypeTriggerRef} collapsable={false}>
          <TouchableOpacity
            style={[styles.dropdownButton, { backgroundColor: colors.background, borderColor: colors.border }]}
            onPress={openBusinessTypeDropdown}>
            <Text style={[styles.dropdownText, { color: colors.textPrimary }]}>
              {t('businessType_' + type)}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.accent }, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}>
          <Text style={[styles.saveBtnText, { color: colors.black }]}>
            {saved ? t('saved') : saving ? t('saving') : t('save')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Business Type Dropdown - compact panel below trigger */}
      <Modal visible={showBusinessTypeModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowBusinessTypeModal(false)}>
          {dropdownLayout && (
            <View
              style={[styles.compactDropdownWrap, getCompactDropdownPosition(dropdownLayout)]}
              onStartShouldSetResponder={() => true}>
              <View style={[styles.compactDropdownPanel, styles.dropdownPanel, styles.dropdownPanelShadow, { backgroundColor: colors.background }]}>
                <Text style={[styles.compactDropdownTitle, { color: colors.textPrimary }]}>{t('selectBusinessType') || 'Select Business Type'}</Text>
                <View style={styles.modalOptions}>
                  {BUSINESS_TYPES.map((bt) => (
                    <TouchableOpacity
                      key={bt}
                      style={[
                        styles.dropdownItem,
                        type === bt && { backgroundColor: dropdownSelectedBg },
                      ]}
                      onPress={() => {
                        setType(bt);
                        setShowBusinessTypeModal(false);
                      }}>
                      <Text style={[
                        styles.dropdownItemText,
                        { color: colors.textPrimary },
                        type === bt && styles.dropdownItemTextSelected,
                      ]}>
                        {t('businessType_' + bt)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  padding: { padding: 24, paddingBottom: 40 },
  label: { fontSize: 14, fontFamily: FontFamily.medium, marginBottom: 8 },
  input: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: FontFamily.medium,
    borderWidth: 1,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: FontFamily.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  compactDropdownWrap: {
    position: 'absolute',
  },
  compactDropdownPanel: {
    borderRadius: 12,
    paddingVertical: 8,
    paddingBottom: 12,
    minWidth: 200,
  },
  compactDropdownTitle: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modalOptions: {
    paddingHorizontal: 16,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    fontFamily: FontFamily.regular,
  },
  dropdownItemTextSelected: {
    fontFamily: FontFamily.semiBold,
  },
  dropdownPanel: { elevation: 8 },
  dropdownPanelShadow: Platform.select({
    web: { boxShadow: '0 -2px 8px rgba(0,0,0,0.08)' },
    default: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  }),
  saveBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: 16, fontFamily: FontFamily.semiBold },
});
