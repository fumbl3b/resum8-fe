import { create } from 'zustand';
import { 
  UserSummaryResponse,
  ResumeDocument,
  ComparisonSession 
} from '@/lib/types';

interface User {
  id: number;
  email: string;
}

interface GlobalState {
  // Auth state
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  
  // User summary from /me/summary
  userSummary: UserSummaryResponse | null;
  
  // Resume management
  resumes: ResumeDocument[];
  resumesLoading: boolean;
  
  // Current comparison session
  currentSession: ComparisonSession | null;
  sessionLoading: boolean;
}

interface GlobalStore extends GlobalState {
  // Auth actions
  setAuth: (user: User, isAuthenticated: boolean) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  
  // User summary actions  
  setUserSummary: (summary: UserSummaryResponse) => void;
  
  // Resume actions
  setResumes: (resumes: ResumeDocument[]) => void;
  addResume: (resume: ResumeDocument) => void;
  updateResume: (id: number, updates: Partial<ResumeDocument>) => void;
  removeResume: (id: number) => void;
  setResumesLoading: (loading: boolean) => void;
  
  // Session actions
  setCurrentSession: (session: ComparisonSession | null) => void;
  setSessionLoading: (loading: boolean) => void;
  updateSession: (updates: Partial<ComparisonSession>) => void;
  
  // Reset all state
  reset: () => void;
}

const initialState: GlobalState = {
  isAuthenticated: false,
  user: null,
  isLoading: true,
  userSummary: null,
  resumes: [],
  resumesLoading: false,
  currentSession: null,
  sessionLoading: false,
};

export const useGlobalStore = create<GlobalStore>((set, get) => ({
  ...initialState,
  
  // Auth actions
  setAuth: (user, isAuthenticated) => set({ user, isAuthenticated, isLoading: false }),
  clearAuth: () => set({ 
    user: null, 
    isAuthenticated: false, 
    isLoading: false,
    userSummary: null,
    resumes: [],
    currentSession: null
  }),
  setLoading: (isLoading) => set({ isLoading }),
  
  // User summary actions
  setUserSummary: (userSummary) => set({ userSummary }),
  
  // Resume actions
  setResumes: (resumes) => set({ resumes }),
  addResume: (resume) => {
    const { resumes } = get();
    set({ resumes: [...resumes, resume] });
  },
  updateResume: (id, updates) => {
    const { resumes } = get();
    set({ 
      resumes: resumes.map(resume => 
        resume.id === id ? { ...resume, ...updates } : resume
      )
    });
  },
  removeResume: (id) => {
    const { resumes } = get();
    set({ resumes: resumes.filter(resume => resume.id !== id) });
  },
  setResumesLoading: (resumesLoading) => set({ resumesLoading }),
  
  // Session actions
  setCurrentSession: (currentSession) => set({ currentSession }),
  setSessionLoading: (sessionLoading) => set({ sessionLoading }),
  updateSession: (updates) => {
    const { currentSession } = get();
    if (currentSession) {
      set({ currentSession: { ...currentSession, ...updates } });
    }
  },
  
  // Reset
  reset: () => set(initialState),
}));