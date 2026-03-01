// preferences state - theme, language, profile display
import { useEffect, useState, useCallback } from 'react';
import {
  getTheme,
  setTheme as saveTheme,
  getLanguage,
  setLanguage as saveLanguage,
  getDisplayName,
  setDisplayName as saveDisplayName,
  getBusinessName,
  setBusinessName as saveBusinessName,
  getBusinessType,
  setBusinessType as saveBusinessType,
} from '../services/preferencesService';
import type { BusinessType } from '../services/preferencesService';
import type { ThemeOption, LanguageOption } from '../services/preferencesService';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeOption>('system');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTheme().then((t) => {
      setThemeState(t);
      setLoading(false);
    });
  }, []);

  const setTheme = useCallback(async (t: ThemeOption) => {
    await saveTheme(t);
    setThemeState(t);
  }, []);

  return { theme, setTheme, loading };
}

export function useLanguage() {
  const [language, setLanguageState] = useState<LanguageOption>('en');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLanguage().then((l) => {
      setLanguageState(l);
      setLoading(false);
    });
  }, []);

  const setLanguage = useCallback(async (l: LanguageOption) => {
    await saveLanguage(l);
    setLanguageState(l);
  }, []);

  return { language, setLanguage, loading };
}

export function useProfileDisplay() {
  const [displayName, setDisplayNameState] = useState('');
  const [businessName, setBusinessNameState] = useState('My Business');
  const [businessType, setBusinessTypeState] = useState<BusinessType>('other');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [dn, bn, bt] = await Promise.all([getDisplayName(), getBusinessName(), getBusinessType()]);
    setDisplayNameState(dn);
    setBusinessNameState(bn);
    setBusinessTypeState(bt);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateDisplayName = useCallback(async (name: string) => {
    await saveDisplayName(name);
    setDisplayNameState(name.trim());
  }, []);

  const updateBusinessName = useCallback(async (name: string) => {
    const val = name.trim() || 'My Business';
    await saveBusinessName(val);
    setBusinessNameState(val);
  }, []);

  const updateBusinessType = useCallback(async (type: BusinessType) => {
    await saveBusinessType(type);
    setBusinessTypeState(type);
  }, []);

  return {
    displayName,
    businessName,
    businessType,
    updateDisplayName,
    updateBusinessName,
    updateBusinessType,
    loading,
    refresh: load,
  };
}
