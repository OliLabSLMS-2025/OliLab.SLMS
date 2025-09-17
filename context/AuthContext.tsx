import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, UserStatus } from '../types';
import { useInventory } from './InventoryContext';
import api from '../services/apiService';

export type SecureUser = Omit<User, 'password'>;

interface AuthContextType {
  currentUser: SecureUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'oliLabSessionUser';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<SecureUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { state: inventoryState, isLoading: isInventoryLoading } = useInventory();

  // Effect 1: Runs once on client mount to get user from session storage immediately.
  // This makes the initial auth check independent of the main data loading.
  useEffect(() => {
    try {
        const serializedUser = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (serializedUser) {
            const user = JSON.parse(serializedUser) as SecureUser;
            // A basic check to ensure the user object from session is valid.
            // A more thorough validation against fresh data happens in the second effect.
            if (user && user.status === UserStatus.APPROVED) {
                 setCurrentUser(user);
            } else {
                 // Clear invalid session data
                 sessionStorage.removeItem(SESSION_STORAGE_KEY);
            }
        }
    } catch (error) {
        console.error("Failed to load user from session storage:", error);
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } finally {
        // The initial, synchronous check is done. The UI can now proceed.
        setIsLoading(false);
    }
  }, []); // Empty dependency array ensures this runs only once on the client.

  // Effect 2: Syncs session with fresh user data from the server when it arrives.
  // This handles cases like an admin disabling an account while the user is logged in.
  useEffect(() => {
      // Only run this check if the initial data has loaded and we have a logged-in user.
      if (currentUser && !isInventoryLoading && inventoryState.users.length > 0) {
          const freshUser = inventoryState.users.find(u => u.id === currentUser.id);
          if (!freshUser || freshUser.status !== UserStatus.APPROVED) {
              // The user no longer exists or is not approved, force logout.
              logout();
          } else {
              // User data might have been updated by an admin, so we refresh it in the session.
              const { password, ...secureUser } = freshUser;
              setCurrentUser(secureUser);
              sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(secureUser));
          }
      }
  }, [inventoryState.users, isInventoryLoading, currentUser]);


  const login = async (identifier: string, password: string): Promise<boolean> => {
    try {
        const user = await api.login({ identifier, password });
        setCurrentUser(user);
        // Store the entire secure user object in the session
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
        return true;
    } catch (error) {
        throw error;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  };
  
  const value = {
      currentUser,
      isAuthenticated: !!currentUser,
      isLoading,
      login,
      logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};