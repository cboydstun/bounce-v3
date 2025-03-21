declare module 'react-to-print' {
    import { ReactInstance } from 'react';

    interface UseReactToPrintOptions {
        content: () => ReactInstance | null;
        documentTitle?: string;
        onBeforeGetContent?: () => Promise<void> | void;
        onBeforePrint?: () => Promise<void> | void;
        onAfterPrint?: () => void;
        removeAfterPrint?: boolean;
        pageStyle?: string;
        copyStyles?: boolean;
        suppressErrors?: boolean;
    }

    export function useReactToPrint(options: UseReactToPrintOptions): () => void;

    export default useReactToPrint;
}
