import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';

export type UserRole = 'user' | 'police' | 'admin';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
}

export interface User {
  id: string; // Keeping id for backward compatibility if needed, but Mongoose uses _id
  _id?: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  emergencyContacts: EmergencyContact[];
  avatar?: string;
}

export interface SOSAlert {
  id: string;
  victimId: string;
  victimName: string;
  victimPhone: string;
  location: {
    latitude: number;
    longitude: number;
  };
  status: 'ACTIVE' | 'RESOLVED';
  createdAt: Date;
  distance?: number;
}

export interface Report {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  category: 'streetlight' | 'harassment' | 'unsafe_area' | 'other';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED';
  createdAt: Date;
  resolvedAt?: Date;
  feedback?: {
    rating: number;
    comment: string;
  };
  policeComment?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (data: SignupData) => Promise<boolean>;
  logout: () => void;
  updateEmergencyContacts: (contacts: EmergencyContact[]) => void;
}

interface SignupData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: UserRole;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demo
const mockUsers: (User & { password: string })[] = [
  {
    id: '1',
    name: 'Shreya Sharma',
    email: 'shreya@example.com',
    phone: '+91 98765 43210',
    password: 'password123',
    role: 'user',
    emergencyContacts: [
      { id: '1', name: 'Mom', phone: '+91 98765 43211' },
      { id: '2', name: 'Dad', phone: '+91 98765 43212' },
    ],
  },
  {
    id: '2',
    name: 'Officer Priya',
    email: 'police@example.com',
    phone: '+91 98765 43220',
    password: 'police123',
    role: 'police',
    emergencyContacts: [],
  },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session in localStorage
    const storedUser = localStorage.getItem('saheli_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });

      const userToStore: User = {
        id: data._id,
        _id: data._id,
        name: data.fullName,
        email: data.email,
        phone: data.phone || '',
        role: data.role,
        emergencyContacts: data.emergencyContacts || [],
      };

      setUser(userToStore);
      localStorage.setItem('saheli_user', JSON.stringify(userToStore));
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
      return false;
    }
  };

  const signup = async (data: SignupData): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data: responseData } = await api.post('/auth/register', {
        fullName: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        role: data.role
      });

      const userToStore: User = {
        id: responseData._id,
        _id: responseData._id,
        name: responseData.fullName,
        email: responseData.email,
        phone: responseData.phone,
        role: responseData.role,
        emergencyContacts: [],
      };

      setUser(userToStore);
      localStorage.setItem('saheli_user', JSON.stringify(userToStore));
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Signup failed:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('saheli_user');
    localStorage.removeItem('saheli_welcome_seen');
    sessionStorage.removeItem('saheli_splash_seen');
  };

  const updateEmergencyContacts = async (contacts: EmergencyContact[]) => {
    if (user) {
      const updatedUser = { ...user, emergencyContacts: contacts };
      setUser(updatedUser);
      localStorage.setItem('saheli_user', JSON.stringify(updatedUser));

      // Save to MongoDB
      try {
        await api.put('/auth/emergency-contacts', {
          userId: user._id || user.id,
          contacts: contacts
        });
        console.log('Emergency contacts saved to database');
      } catch (error) {
        console.error('Failed to save emergency contacts to database:', error);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateEmergencyContacts,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
