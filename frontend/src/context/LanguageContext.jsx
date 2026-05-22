import { createContext, useContext, useState, useCallback } from 'react'
import translations from '../i18n/translations'

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(localStorage.getItem('akshop_language') || 'en')

  const setLanguage = useCallback((code) => {
    setLangState(code)
    localStorage.setItem('akshop_language', code)
  }, [])

  const t = useCallback((key) => {
    return translations[lang]?.[key] ?? translations['en']?.[key] ?? key
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
