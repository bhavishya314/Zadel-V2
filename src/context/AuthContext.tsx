import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, checkAdminExists, verifyAdminUser } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  adminExists: boolean;
  refreshAdminStatus: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [adminExists, setAdminExists] = useState<boolean>(false);

  const refreshAdminStatus = async (): Promise<boolean> => {
    const exists = await checkAdminExists();
    setAdminExists(exists);
    return exists;
  };

  useEffect(() => {
    refreshAdminStatus();

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Verify user exists in admins collection
        const isAuthorizedAdmin = await verifyAdminUser(currentUser.uid);
        if (isAuthorizedAdmin) {
          setUser(currentUser);
        } else {
          // Deny access and sign out
          console.warn('Unauthorized login attempt: user not found in admins collection');
          await firebaseSignOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        adminExists,
        refreshAdminStatus,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
