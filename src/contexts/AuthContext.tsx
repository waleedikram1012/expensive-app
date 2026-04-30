import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: { uid: string } | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ uid: string } | null>(null);

  useEffect(() => {
    let localUid = localStorage.getItem('expense_tracker_uid');
    if (!localUid) {
      localUid = 'guest_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('expense_tracker_uid', localUid);
    }
    setUser({ uid: localUid });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

