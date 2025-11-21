import React, { useState, useCallback } from 'react';
import { PaperCardData } from './types';
import { DraggablePaper } from './components/DraggablePaper';
import { TypewriterConsole } from './components/TypewriterConsole';
import { DEFAULT_CARD_WIDTH } from './constants';

const App: React.FC = () => {
  const [cards, setCards] = useState<PaperCardData[]>([]);
  // Start z-index lower so cards can be behind the machine (which we'll give a high z-index)
  const [topZIndex, setTopZIndex] = useState(10);

  const handlePrint = (text: string) => {
    // Calculate center position relative to the viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Machine is approx 300-350px tall visually at the bottom.
    // The slot is roughly at viewportHeight - 320.
    // We want the card to finish printing with a gap above the machine.
    // Let's position the "resting" (translateY=0) top of the card higher up.
    // If card height is ~200-300px, placing top at -550 puts bottom at -250 to -350, 
    // leaving a nice gap above the machine slot.
    const targetY = viewportHeight - 550; 
    const centerX = viewportWidth / 2 - DEFAULT_CARD_WIDTH / 2;

    const newCard: PaperCardData = {
      id: crypto.randomUUID(),
      text,
      x: centerX,
      y: targetY,
      rotation: (Math.random() * 4) - 2, // Slight variation
      timestamp: Date.now(),
      isTyping: true,
    };

    // Add new card. Note: We don't increment topZIndex immediately for the new card
    // because we want it to potentially appear "behind" the machine initially.
    // However, to make it draggable over others later, we handle z-index on focus.
    setCards(prev => [...prev, newCard]);
  };

  const handleUpdateCard = useCallback((id: string, updates: Partial<PaperCardData>) => {
    setCards(prev => prev.map(card => card.id === id ? { ...card, ...updates } : card));
  }, []);

  const handleDeleteCard = useCallback((id: string) => {
    setCards(prev => prev.filter(card => card.id !== id));
  }, []);

  const handleClearAll = () => {
    if (window.confirm("Clear all messages?")) {
      setCards([]);
    }
  };

  const handleFocus = useCallback((id: string) => {
    setTopZIndex(prev => {
      const newZ = prev + 1;
      setCards(prevCards => 
        prevCards.map(c => c.id === id ? { ...c } : c)
      );
      return newZ;
    });
    
    // Moving to end of array is standard "bring to front" for React lists.
    setCards(prev => {
      const card = prev.find(c => c.id === id);
      if (!card) return prev;
      const others = prev.filter(c => c.id !== id);
      return [...others, card];
    });
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#d4d8e0]">
      {/* Realistic Desk Mat Background */}
      <div className="absolute inset-0 pointer-events-none opacity-60"
           style={{
             background: `
               radial-gradient(circle at 50% 50%, #ffffff 0%, #d4d8e0 60%, #9ca3af 100%)
             `
           }}>
      </div>
      <div className="absolute inset-0 pointer-events-none opacity-10"
           style={{
             backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
             backgroundSize: '50px 50px',
           }}>
      </div>

      {/* App Title */}
      <div className="absolute top-12 left-1/2 transform -translate-x-1/2 opacity-30 pointer-events-none select-none text-center mix-blend-multiply">
         <h1 className="font-['VT323'] text-6xl text-slate-800 tracking-tighter">Gemini</h1>
         <p className="text-lg tracking-[0.8em] text-slate-600 mt-[-5px] font-bold uppercase">Fax Beeper</p>
      </div>

      {/* Author Badge */}
      <a 
        href="https://github.com/OminiQ?tab=repositories"
        target="_blank"
        rel="noreferrer"
        className="absolute top-5 right-5 z-[100] flex items-center gap-2.5 bg-slate-200/30 hover:bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 shadow-sm transition-all group cursor-pointer no-underline"
      >
         <span className="font-['VT323'] text-xl text-slate-700/80 group-hover:text-slate-900 transition-colors mt-0.5">OminiQ</span>
      </a>

      {/* Card Rendering Area */}
      <div className="absolute inset-0 w-full h-full">
        {cards.map((card, index) => (
          <DraggablePaper
            key={card.id}
            data={card}
            // Cards stack starting at 10. 
            // The Machine is at z-index 50.
            // So newly printed cards (if we don't manually set high z) will be behind machine.
            zIndex={index + 10}
            onUpdate={handleUpdateCard}
            onDelete={handleDeleteCard}
            onFocus={() => handleFocus(card.id)}
          />
        ))}
      </div>

      {/* Console UI - Centered at bottom */}
      <div className="absolute bottom-0 left-0 w-full flex justify-center pointer-events-none z-50">
        <TypewriterConsole 
          onPrint={handlePrint}
          onClearAll={handleClearAll}
        />
      </div>
    </div>
  );
};

export default App;