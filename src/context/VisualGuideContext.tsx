import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { View } from 'react-native';

export interface RegisteredElement {
  id: string;
  label: string;
  description: string;
  ref: React.RefObject<View>;
  keywords: string[];
  screenName: string;
}

interface ElementPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface VisualGuideContextType {
  activeElementId: string | null;
  isGuiding: boolean;
  instruction: string;
  elementPosition: ElementPosition | null;
  elementRegistry: RegisteredElement[];
  showGuide: (elementId: string, instruction: string) => Promise<void>;
  hideGuide: () => void;
  registerElement: (element: RegisteredElement) => void;
  unregisterElement: (elementId: string) => void;
  clearRegistry: () => void;
  findElementByKeywords: (query: string, currentScreen: string) => RegisteredElement | null;
}

const VisualGuideContext = createContext<VisualGuideContextType | undefined>(undefined);

export const useVisualGuide = () => {
  const context = useContext(VisualGuideContext);
  if (!context) {
    throw new Error('useVisualGuide must be used within VisualGuideProvider');
  }
  return context;
};

interface VisualGuideProviderProps {
  children: ReactNode;
}

export const VisualGuideProvider: React.FC<VisualGuideProviderProps> = ({ children }) => {
  const [activeElementId, setActiveElementId] = useState<string | null>(null);
  const [isGuiding, setIsGuiding] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [elementPosition, setElementPosition] = useState<ElementPosition | null>(null);
  const elementRegistryRef = useRef<RegisteredElement[]>([]);

  const showGuide = async (elementId: string, instructionText: string): Promise<void> => {
    console.log('[VisualGuide] Showing guide for element:', elementId);

    // Find the element in registry
    const element = elementRegistryRef.current.find(e => e.id === elementId);

    if (!element) {
      console.warn('[VisualGuide] Element not found in registry:', elementId);
      return;
    }

    if (!element.ref.current) {
      console.warn('[VisualGuide] Element ref is null:', elementId);
      return;
    }

    // Measure element position
    return new Promise((resolve) => {
      element.ref.current?.measureInWindow((x, y, width, height) => {
        console.log('[VisualGuide] Element position:', { x, y, width, height });
        setElementPosition({ x, y, width, height });
        setActiveElementId(elementId);
        setInstruction(instructionText);
        setIsGuiding(true);
        resolve();
      });
    });
  };

  const hideGuide = () => {
    console.log('[VisualGuide] Hiding guide');
    setIsGuiding(false);
    setActiveElementId(null);
    setInstruction('');
    setElementPosition(null);
  };

  const registerElement = (element: RegisteredElement) => {
    console.log('[VisualGuide] Registering element:', element.id, 'for screen:', element.screenName);

    // Remove existing element with same ID
    elementRegistryRef.current = elementRegistryRef.current.filter(e => e.id !== element.id);

    // Add new element
    elementRegistryRef.current.push(element);
  };

  const unregisterElement = (elementId: string) => {
    console.log('[VisualGuide] Unregistering element:', elementId);
    elementRegistryRef.current = elementRegistryRef.current.filter(e => e.id !== elementId);
  };

  const clearRegistry = () => {
    console.log('[VisualGuide] Clearing element registry');
    elementRegistryRef.current = [];
  };

  const findElementByKeywords = (query: string, currentScreen: string): RegisteredElement | null => {
    const lowerQuery = query.toLowerCase();

    // Filter elements for current screen
    const screenElements = elementRegistryRef.current.filter(e => e.screenName === currentScreen);

    console.log('[VisualGuide] Searching for keywords in query:', lowerQuery);
    console.log('[VisualGuide] Available elements on', currentScreen, ':', screenElements.length);

    // Find element where any keyword matches
    const matchedElement = screenElements.find(element => {
      return element.keywords.some(keyword => lowerQuery.includes(keyword.toLowerCase()));
    });

    if (matchedElement) {
      console.log('[VisualGuide] Found matching element:', matchedElement.id);
    } else {
      console.log('[VisualGuide] No matching element found');
    }

    return matchedElement || null;
  };

  const value: VisualGuideContextType = {
    activeElementId,
    isGuiding,
    instruction,
    elementPosition,
    elementRegistry: elementRegistryRef.current,
    showGuide,
    hideGuide,
    registerElement,
    unregisterElement,
    clearRegistry,
    findElementByKeywords,
  };

  return (
    <VisualGuideContext.Provider value={value}>
      {children}
    </VisualGuideContext.Provider>
  );
};
