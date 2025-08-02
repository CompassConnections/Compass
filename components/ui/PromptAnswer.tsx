'use client';

import {useEffect, useState} from 'react';
import {Textarea} from '@/components/ui/textarea';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select';
import {cons} from "effect/List";

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
  prompts: string[];
  onAnswerChange: (answer: Answer) => void;
  initialAnswer?: string;
  initialValues?;
  initialPromptId?: string;
  className?: string;
}

export function PromptAnswer(
  {
    prompts,
    onAnswerChange,
    initialValues = null,
    initialAnswer = '',
    initialPromptId = '',
    className = '',
  }: PromptAnswerProps
) {
  // const [selectedPromptId, setSelectedPromptId] = useState(initialPromptId);
  const [answer, setAnswer] = useState(initialAnswer);
  const [isCustomPrompt, setIsCustomPrompt] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  const idToPrompt = Object.fromEntries(prompts.map((item, idx) => [idx, item]));
  // console.log('dictPrompts', idToPrompt)
  useEffect(() => {
    if (initialPromptId === 'custom') {
      setIsCustomPrompt(true);
      setSelectedPrompt(initialAnswer);
    }
  }, [initialPromptId, initialAnswer]);

  const handlePromptChange = (prompt: string) => {
    console.log('handlePromptChange', prompt)
    if (prompt === 'custom') {
      setIsCustomPrompt(true);
      setSelectedPrompt('');
      // onAnswerChange({promptId: 'custom', prompt: selectedPrompt, text: selectedPrompt});
    } else {
      setIsCustomPrompt(false);
      setSelectedPrompt(prompt);
      // onAnswerChange({promptId: id, prompt: idToPrompt[id], text: answer});
    }
    setAnswer(initialValues[prompt] || '')
  };

  const handleAnswerChange = (text: string) => {
    setAnswer(text);
    console.log('handleAnswerChange', text)
    onAnswerChange({
      promptId: '...',
      prompt: selectedPrompt,
      text: text,
    });
  };

  const handleCustomPromptChange = (text: string) => {
    setSelectedPrompt(text);
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
        <Select value={isCustomPrompt ? 'custom' : selectedPrompt} onValueChange={handlePromptChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a prompt..."/>
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-auto">
            {prompts.map((prompt, idx) => (
              <SelectItem key={idx} value={prompt}>
                {prompt}
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
            value={selectedPrompt}
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
