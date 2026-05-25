import { useCallback, useMemo, useState } from 'react'
import { LanguageContext } from './language-context'

const LANGUAGE_KEY = 'dargah_para_language'

const labels = {
  bn: {
    account: 'অ্যাকাউন্ট',
    admin: 'অ্যাডমিন',
    alerts: 'বার্তা',
    language: 'বাংলা',
    login: 'লগইন',
    logout: 'লগআউট',
    member: 'সদস্য',
    organization: 'সংগঠন ব্যবস্থাপনা',
    public: 'সবার জন্য',
    register: 'নিবন্ধন',
  },
  en: {
    account: 'Account',
    admin: 'Admin',
    alerts: 'Alerts',
    language: 'English',
    login: 'Login',
    logout: 'Logout',
    member: 'Member',
    organization: 'Organization management',
    public: 'Public',
    register: 'Register',
  },
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem(LANGUAGE_KEY)
    return saved === 'bn' ? 'bn' : 'en'
  })

  const setLanguage = useCallback((nextLanguage) => {
    const normalizedLanguage = nextLanguage === 'bn' ? 'bn' : 'en'
    localStorage.setItem(LANGUAGE_KEY, normalizedLanguage)
    setLanguageState(normalizedLanguage)
  }, [])

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'bn' : 'en')
  }, [language, setLanguage])

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: labels[language],
      toggleLanguage,
    }),
    [language, setLanguage, toggleLanguage],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
