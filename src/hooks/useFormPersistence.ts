import { useState, useEffect, useCallback } from "react";
import { ContactFormData } from "@/types/contact";

interface FormDraft {
  data: Partial<ContactFormData>;
  timestamp: number;
  sessionId: string;
}

const DRAFT_KEY = "admin_contact_form_draft";
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

/**
 * Custom hook for form persistence with auto-save functionality
 * @param initialData - Initial form data
 * @returns Object with draft management functions
 */
export function useFormPersistence(initialData: ContactFormData) {
  const [sessionId] = useState(
    () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  );
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const saveDraft = useCallback(
    (formData: Partial<ContactFormData>) => {
      if (typeof window === "undefined") return;

      try {
        const draft: FormDraft = {
          data: formData,
          timestamp: Date.now(),
          sessionId,
        };

        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        setLastSaved(new Date());
        setIsDirty(false);
      } catch (error) {
        console.error("Error saving form draft:", error);
      }
    },
    [sessionId],
  );

  const loadDraft = useCallback((): Partial<ContactFormData> | null => {
    if (typeof window === "undefined") return null;

    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!saved) return null;

      const draft: FormDraft = JSON.parse(saved);

      // Check if draft is from the last 24 hours
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      if (draft.timestamp < dayAgo) {
        localStorage.removeItem(DRAFT_KEY);
        return null;
      }

      return draft.data;
    } catch (error) {
      console.error("Error loading form draft:", error);
      localStorage.removeItem(DRAFT_KEY);
      return null;
    }
  }, []);

  const clearDraft = useCallback(() => {
    if (typeof window === "undefined") return;

    localStorage.removeItem(DRAFT_KEY);
    setLastSaved(null);
    setIsDirty(false);
  }, []);

  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

  // Check for existing draft on mount
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    const draft = loadDraft();
    setHasDraft(!!draft);
  }, [loadDraft]);

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    markDirty,
    lastSaved,
    isDirty,
    hasDraft,
    sessionId,
  };
}
