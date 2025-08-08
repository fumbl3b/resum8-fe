'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import { Loader, Download, RefreshCw } from 'lucide-react';

interface ExportModalProps {
  sessionId: number;
  isOpen: boolean;
  onClose: () => void;
  initialPdfUrl?: string | null;
}

export function ExportModal({ sessionId, isOpen, onClose, initialPdfUrl }: ExportModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(initialPdfUrl);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      await apiClient.exportComparison(sessionId);
      // After starting the export, we need to poll for the result
      pollForPdf();
    } catch (err) {
      setError('Failed to start PDF generation.');
      setIsGenerating(false);
    }
  };

  const pollForPdf = () => {
    const interval = setInterval(async () => {
      try {
        const session = await apiClient.getComparison(sessionId);
        if (session.pdf_url) {
          setPdfUrl(session.pdf_url);
          setIsGenerating(false);
          clearInterval(interval);
        }
        if (session.status === 'ERROR') {
            setError('PDF generation failed.');
            setIsGenerating(false);
            clearInterval(interval);
        }
      } catch (err) {
        setError('Failed to check PDF status.');
        setIsGenerating(false);
        clearInterval(interval);
      }
    }, 2000);
  };

  const handleDownload = () => {
    if (pdfUrl) {
      apiClient.downloadComparison(sessionId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Your Improved Resume</DialogTitle>
          <DialogDescription>
            Generate a professional PDF of your optimized resume. You can regenerate it if you've made changes.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-center">
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {isGenerating ? (
            <div className="flex items-center justify-center">
              <Loader className="mr-2 h-5 w-5 animate-spin" />
              <span>Generating PDF... This may take a moment.</span>
            </div>
          ) : pdfUrl ? (
            <Button onClick={handleDownload} size="lg">
              <Download className="mr-2 h-5 w-5" />
              Download PDF
            </Button>
          ) : (
            <Button onClick={handleGenerate} size="lg">
              Generate PDF
            </Button>
          )}
        </div>
        <DialogFooter>
            <Button onClick={handleGenerate} variant="outline" disabled={isGenerating}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate
            </Button>
          <Button onClick={onClose} variant="ghost">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
