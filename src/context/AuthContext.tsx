import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, UserRole } from '../types';
import { INITIAL_STAFF_MEMBERS } from '../data/seedData';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  currentUser: UserProfile;
  activeRole: UserRole;
  allStaff: UserProfile[];
  switchPersona: (uid: string) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isManagingPartner: () => boolean;
  isPartner: () => boolean;
  isManager: () => boolean;
  isSenior: () => boolean;
  isTrainee: () => boolean;
  isHr: () => boolean;
  canApproveLeave: () => boolean;
  canClearReviewPoints: () => boolean;
  canSignoffAssignment: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Default to Managing Partner (CA. Ramesh Acharya)
  const defaultUser = INITIAL_STAFF_MEMBERS[0];
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('ara_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultUser;
      }
    }
    return defaultUser;
  });

  const [allStaff, setAllStaff] = useState<UserProfile[]>(INITIAL_STAFF_MEMBERS);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('ara_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          // Check if user has an existing Firestore profile
          const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            setCurrentUser(data);
          } else {
            // Check if matches Ramesh Acharya's email
            const isOwner = fbUser.email === 'acharyaramesh69@gmail.com';
            const newProfile: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || 'acharyaramesh69@gmail.com',
              displayName: fbUser.displayName || (isOwner ? 'CA. Ramesh Acharya, FCA' : 'Firm Associate'),
              role: isOwner ? 'managing_partner' : 'audit_manager',
              employeeCode: isOwner ? 'ARA-001' : 'ARA-NEW',
              designation: isOwner ? 'Managing Partner' : 'Audit Professional',
              department: 'Assurance & Practice',
              status: 'active'
            };
            await setDoc(doc(db, 'users', fbUser.uid), newProfile);
            setCurrentUser(newProfile);
          }
        } catch (err) {
          console.warn('Could not read user profile from Firestore, using current persona:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const switchPersona = (uid: string) => {
    const found = allStaff.find(s => s.uid === uid);
    if (found) {
      setCurrentUser(found);
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Google Sign-In Error:', err);
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
      // Fallback to default persona
      setCurrentUser(defaultUser);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const role = currentUser.role;

  const isManagingPartner = () => role === 'managing_partner';
  const isPartner = () => role === 'managing_partner' || role === 'engagement_partner';
  const isManager = () => isPartner() || role === 'audit_manager';
  const isSenior = () => isManager() || role === 'audit_senior';
  const isTrainee = () => role === 'article_trainee';
  const isHr = () => role === 'hr_admin' || role === 'managing_partner';

  // Permission helpers
  const canApproveLeave = () => isManager() || role === 'hr_admin';
  const canClearReviewPoints = () => isSenior();
  const canSignoffAssignment = () => isPartner();

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        activeRole: currentUser.role,
        allStaff,
        switchPersona,
        signInWithGoogle,
        signOut,
        isManagingPartner,
        isPartner,
        isManager,
        isSenior,
        isTrainee,
        isHr,
        canApproveLeave,
        canClearReviewPoints,
        canSignoffAssignment,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
