import { useState, useEffect, useCallback } from 'react';

export function useTabNavigation(defaultTab: string) {
  const getHashTab = () => {
    const hash = window.location.hash.replace('#', '');
    return hash || defaultTab;
  };

  const [activeTab, setActiveTabState] = useState(getHashTab);

  useEffect(() => {
    const handleHashChange = () => {
      setActiveTabState(getHashTab());
    };
    
    // Si no hay hash al cargar, ponemos el por defecto silenciosamente
    if (!window.location.hash) {
      window.history.replaceState(null, '', `#${defaultTab}`);
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [defaultTab]);

  const setActiveTab = useCallback((newTab: string) => {
    if (newTab === activeTab) return;
    // Esto disparará el evento hashchange y actualizará el estado
    window.location.hash = newTab;
  }, [activeTab]);

  return [activeTab, setActiveTab] as const;
}
