import { useCallback, useMemo, useState } from 'react'
import { LanguageContext } from './language-context'

const LANGUAGE_KEY = 'dargah_para_language'

const labels = {
  bn: {
    account: 'অ্যাকাউন্ট',
    admin: 'অ্যাডমিন',
    alerts: 'বার্তা',
    blog: 'ব্লগ',
    blogs: 'ব্লগ',
    content: 'কনটেন্ট',
    finance: 'অর্থ',
    gallery: 'গ্যালারি',
    home: 'হোম',
    language: 'বাংলা',
    login: 'লগইন',
    logout: 'লগআউট',
    logs: 'লগ ও বার্তা',
    member: 'সদস্য',
    members: 'সদস্য',
    notice: 'নোটিশ',
    organization: 'সংগঠন ব্যবস্থাপনা',
    overview: 'সারাংশ',
    payment: 'পেমেন্ট',
    payments: 'পেমেন্ট',
    polls: 'ভোট',
    public: 'সবার জন্য',
    register: 'নিবন্ধন',
    updates: 'আপডেট',
  },
  en: {
    account: 'Account',
    admin: 'Admin',
    alerts: 'Alerts',
    blog: 'Blog',
    blogs: 'Blogs',
    content: 'Content',
    finance: 'Finance',
    gallery: 'Gallery',
    home: 'Home',
    language: 'English',
    login: 'Login',
    logout: 'Logout',
    logs: 'Logs & Alerts',
    member: 'Member',
    members: 'Members',
    notice: 'Notice',
    organization: 'Organization management',
    overview: 'Overview',
    payment: 'Payment',
    payments: 'Payments',
    polls: 'Polls',
    public: 'Public',
    register: 'Register',
    updates: 'Updates',
  },
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem(LANGUAGE_KEY)
    return saved === 'en' ? 'en' : 'bn'
  })

  const setLanguage = useCallback((nextLanguage) => {
    const normalizedLanguage = nextLanguage === 'en' ? 'en' : 'bn'
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
