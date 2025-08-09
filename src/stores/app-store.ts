import { create } from 'zustand';
import { 
  AppState, 
  JobAnalysisResponse, 
  ResumeOptimizationResponse,
  LaTeXGenerationResponse 
} from '@/lib/types';

interface AppStore extends AppState {
  setCurrentStep: (step: AppState['currentStep']) => void;
  setJobDescription: (description: string) => void;
  setResumeFile: (file: File | undefined) => void;
  setResumeText: (text: string) => void;
  setResumeId: (id: number | null) => void;
  setJobAnalysis: (analysis: JobAnalysisResponse) => void;
  setOptimizationResults: (results: ResumeOptimizationResponse) => void;
  toggleSuggestion: (suggestionId: string) => void;
  setSelectedSuggestions: (suggestionIds: string[]) => void;
  setLatexResult: (result: LaTeXGenerationResponse) => void;
  reset: () => void;
}

const initialState: AppState = {
  currentStep: 'upload',
  jobDescription: '',
  resumeText: '',
  resumeId: null,
  selectedSuggestions: [],
};

export const useAppStore = create<AppStore>((set, get) => ({
  ...initialState,
  
  setCurrentStep: (step) => set({ currentStep: step }),
  
  setJobDescription: (jobDescription) => set({ jobDescription }),
  
  setResumeFile: (resumeFile) => set({ resumeFile }),
  
  setResumeText: (resumeText) => set({ resumeText }),
  
  setResumeId: (resumeId) => set({ resumeId }),
  
  setJobAnalysis: (jobAnalysis) => set({ jobAnalysis }),
  
  setOptimizationResults: (optimizationResults) => set({ optimizationResults }),
  
  toggleSuggestion: (suggestionId) => {
    const { selectedSuggestions } = get();
    const isSelected = selectedSuggestions.includes(suggestionId);
    
    set({
      selectedSuggestions: isSelected
        ? selectedSuggestions.filter(id => id !== suggestionId)
        : [...selectedSuggestions, suggestionId]
    });
  },
  
  setSelectedSuggestions: (selectedSuggestions) => set({ selectedSuggestions }),
  
  setLatexResult: (latexResult) => set({ latexResult }),
  
  reset: () => set(initialState),
}));