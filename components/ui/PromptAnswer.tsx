'use client';

import {useEffect, useState} from 'react';
import {Textarea} from '@/components/ui/textarea';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select';

type Prompt = {
  id: string;
  text: string;
};

type Answer = {
  promptId: string;
  prompt: string;
  text: string;
};

interface PromptAnswerProps {
  prompts: Prompt[];
  onAnswerChange: (answer: Answer) => void;
  initialAnswer?: string;
  initialPromptId?: string;
  className?: string;
}

export function PromptAnswer(
  {
    prompts,
    onAnswerChange,
    initialAnswer = '',
    initialPromptId = '',
    className = '',
  }: PromptAnswerProps
) {
  const [selectedPromptId, setSelectedPromptId] = useState(initialPromptId);
  const [answer, setAnswer] = useState(initialAnswer);
  const [isCustomPrompt, setIsCustomPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const idToPrompt = Object.fromEntries(prompts.map(item => [item.id, item.text]));
  console.log('dictPrompts', idToPrompt)
  useEffect(() => {
    if (initialPromptId === 'custom') {
      setIsCustomPrompt(true);
      setCustomPrompt(initialAnswer);
    }
  }, [initialPromptId, initialAnswer]);

  const handlePromptChange = (id: string) => {
    if (id === 'custom') {
      setIsCustomPrompt(true);
      setSelectedPromptId('');
      // onAnswerChange({promptId: 'custom', prompt: customPrompt, text: customPrompt});
    } else {
      setIsCustomPrompt(false);
      setSelectedPromptId(id);
      // onAnswerChange({promptId: id, prompt: idToPrompt[id], text: answer});
    }
  };

  const handleAnswerChange = (text: string) => {
    setAnswer(text);
    onAnswerChange({
      promptId: isCustomPrompt ? 'custom' : selectedPromptId,
      prompt: isCustomPrompt ? customPrompt : idToPrompt[selectedPromptId],
      text: text,
    });
  };

  const handleCustomPromptChange = (text: string) => {
    setCustomPrompt(text);
    // onAnswerChange({
    //   promptId: 'custom',
    //   prompt: text,
    //   text,
    // });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Select a prompt
        </label>
        <Select value={isCustomPrompt ? 'custom' : selectedPromptId} onValueChange={handlePromptChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a prompt..."/>
          </SelectTrigger>
          <SelectContent>
            {prompts.map((prompt) => (
              <SelectItem key={prompt.id} value={prompt.id}>
                {prompt.text}
              </SelectItem>
            ))}
            <SelectItem value="custom">Write your own prompt</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isCustomPrompt && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Your custom prompt
          </label>
          <Textarea
            value={customPrompt}
            onChange={(e) => handleCustomPromptChange(e.target.value)}
            placeholder="Write your own prompt..."
            className="min-h-[100px]"
          />
        </div>
      )}

      <div className="space-y-2 ">
        <label className="block text-sm font-medium text-gray-700">
          Your answer
        </label>
        <Textarea
          value={answer}
          onChange={(e) => handleAnswerChange(e.target.value)}
          placeholder="Type your answer here..."
          className="min-h-[150px]"
        />
      </div>
    </div>
  );
}

export default PromptAnswer;
