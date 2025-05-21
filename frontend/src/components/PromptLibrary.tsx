import React from 'react';
import { Prompt } from '../types';
import { Command, Database, Server, Box, Cloud } from 'lucide-react';

interface PromptLibraryProps {
  prompts: Prompt[];
  onSelectPrompt: (prompt: Prompt) => void;
}

const categoryIcons = {
  EC2: Server,
  S3: Box,
  RDS: Database,
  Lambda: Command,
  General: Cloud,
};

export function PromptLibrary({ prompts, onSelectPrompt }: PromptLibraryProps) {
  return (
    <div className="w-80 h-full border-l border-[#2d2d2d] bg-[#2d2d2d] p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 text-white">Prompt Library</h2>
      <div className="space-y-2">
        {prompts.map((prompt) => {
          const Icon = categoryIcons[prompt.category];
          return (
            <button
              key={prompt.id}
              onClick={() => onSelectPrompt(prompt)}
              className="w-full text-left p-3 rounded-lg hover:bg-[#3d3d3d] transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1e1e1e] flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                  <Icon className="w-4 h-4 text-gray-400 group-hover:text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-sm text-white">{prompt.title}</h3>
                  <p className="text-xs text-gray-400">{prompt.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}