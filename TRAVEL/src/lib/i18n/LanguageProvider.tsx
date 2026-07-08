'use client';

import React, { createContext, useContext, ReactNode } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = React.useState('fr');

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

export function useTranslation(namespace?: string) {
  const { language } = useLanguage();
  
  // Simple translation function - placeholder for future i18n implementation
  return {
    t: (key: string, defaultValue?: string) => defaultValue || key,
    language,
    lang: language,
  };
}
