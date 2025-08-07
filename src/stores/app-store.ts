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
  setResumeFile: (file: File) => void;
  setResumeText: (text: string) => void;
  setJobAnalysis: (analysis: JobAnalysisResponse) => void;
  setOptimizationResults: (results: ResumeOptimizationResponse) => void;
  setLatexResult: (result: LaTeXGenerationResponse) => void;
  reset: () => void;
}

const initialState: AppState = {
  currentStep: 'upload',
  jobDescription: '',
  resumeText: '',
};

export const useAppStore = create<AppStore>((set, get) => ({
  ...initialState,
  
  setCurrentStep: (step) => set({ currentStep: step }),
  
  setJobDescription: (jobDescription) => set({ jobDescription }),
  
  setResumeFile: (resumeFile) => set({ resumeFile }),
  
  setResumeText: (resumeText) => set({ resumeText }),
  
  setJobAnalysis: (jobAnalysis) => set({ jobAnalysis }),
  
  setOptimizationResults: (optimizationResults) => set({ optimizationResults }),
  
  setLatexResult: (latexResult) => set({ latexResult }),
  
  reset: () => set(initialState),
}));