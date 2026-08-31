import React from 'react';

interface SplitScreenProps {
  left: React.ReactNode;
  right: React.ReactNode;
}

export function SplitScreen({ left, right }: SplitScreenProps) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen w-full">
      {/* Left Panel */}
      <div className="w-full md:w-1/2 flex flex-col">
        {left}
      </div>
      {/* Right Panel */}
      <div className="w-full md:w-1/2 flex flex-col">
        {right}
      </div>
    </div>
  );
}
