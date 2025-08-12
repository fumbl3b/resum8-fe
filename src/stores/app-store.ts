import { create } from 'zustand';
import { 
  AppState, 
  JobAnalysisResponse, 
  AnalysisResult,
  ResumeOptimizationResponse,
  LaTeXGenerationResponse 
} from '@/lib/types';

interface AppStore extends AppState {
  setCurrentStep: (step: AppState['currentStep']) => void;
  setJobDescription: (description: string) => void;
  setResumeFile: (file: File | undefined) => void;
  setResumeText: (text: string) => void;
  setOptimizedResumeText: (text: string) => void;
  setResumeId: (id: number | null) => void;
  setComparisonSessionId: (id: number | null) => void;
  setJobAnalysis: (analysis: JobAnalysisResponse) => void;
  setAnalysisResults: (results: AnalysisResult) => void;
  setOptimizationResults: (results: ResumeOptimizationResponse) => void;
  toggleSuggestion: (suggestionId: string) => void;
  setSelectedSuggestions: (suggestionIds: string[]) => void;
  setLatexResult: (result: LaTeXGenerationResponse) => void;
  validateFlowState: () => { valid: boolean; missingSteps: string[]; message: string };
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
  
  setOptimizedResumeText: (optimizedResumeText) => set({ optimizedResumeText }),
  
  setResumeId: (resumeId) => set({ resumeId }),
  
  setComparisonSessionId: (comparisonSessionId) => set({ comparisonSessionId }),
  
  setJobAnalysis: (jobAnalysis) => set({ jobAnalysis }),
  
  setAnalysisResults: (analysisResults) => set({ analysisResults }),
  
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
  
  validateFlowState: () => {
    const state = get();
    const missingSteps: string[] = [];
    let message = '';
    
    // Check required steps in order
    if (!state.resumeId) {
      missingSteps.push('resume-selection');
    }
    
    if (!state.jobDescription) {
      missingSteps.push('job-description');
    }
    
    if (!state.comparisonSessionId) {
      missingSteps.push('job-analysis');
    }
    
    if (!state.analysisResults && !state.jobAnalysis) {
      missingSteps.push('analysis-results');
    }
    
    // For diff page - need either optimized text OR session ID
    const hasOptimizedData = state.optimizedResumeText || (state.comparisonSessionId && state.resumeText);
    if (!hasOptimizedData) {
      missingSteps.push('optimization');
    }
    
    if (missingSteps.length === 0) {
      return {
        valid: true,
        missingSteps: [],
        message: 'All required steps completed'
      };
    }
    
    if (missingSteps.includes('resume-selection')) {
      message = 'Please select a resume first';
    } else if (missingSteps.includes('job-description')) {
      message = 'Please provide a job description';
    } else if (missingSteps.includes('job-analysis')) {
      message = 'Please complete the job analysis step';
    } else if (missingSteps.includes('optimization')) {
      message = 'Please apply improvements first';
    } else {
      message = `Missing steps: ${missingSteps.join(', ')}`;
    }
    
    return {
      valid: false,
      missingSteps,
      message
    };
  },
  
  reset: () => set(initialState),
}));