// Wrapper around react-i18next useTranslation - maintains same API as before for minimal migration
import { useTranslation } from 'react-i18next';

export function useTranslations() {
  const { t } = useTranslation();
  return { t };
}
