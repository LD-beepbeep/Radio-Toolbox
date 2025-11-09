import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Lightbulb } from '../Icons';

const AIBrainstorm: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [ideas, setIdeas] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsLoading(true);
        setError(null);
        setIdeas([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const fullPrompt = `You are a creative producer for a radio show or podcast. Brainstorm 5 unique and engaging segment ideas based on this topic: "${prompt}". For each idea, provide a catchy title and a one-sentence description. Format the response as a numbered list. Example: 1. Title: Description`;
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: fullPrompt,
            });
            
            const text = response.text;
            const generatedIdeas = text.split('\n')
                .map(line => line.trim())
                .filter(line => /^\d+\.\s*/.test(line))
                .map(line => line.replace(/^\d+\.\s*/, ''));
            
            setIdeas(generatedIdeas);
        } catch (err) {
            setError('Failed to generate ideas. Please check your API key setup and try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handlePromptKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleGenerate();
        }
    }

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">AI Brainstorm</h2>
            <div className="bg-light-surface dark:bg-dark-surface rounded-5xl p-6 space-y-6 shadow-soft dark:shadow-none dark:border dark:border-dark-divider">
                <div className="flex items-center space-x-4">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handlePromptKeyDown}
                        placeholder="Enter a topic, e.g., '80s rock bands' or 'future technology'"
                        className="w-full bg-light-bg-primary dark:bg-dark-bg-secondary rounded-full p-4 text-base focus:outline-none focus:ring-2 focus:ring-light-accent"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !prompt}
                        className="px-6 py-4 text-base font-semibold rounded-full bg-light-accent dark:bg-dark-accent text-white disabled:opacity-50 transition-opacity whitespace-nowrap"
                    >
                        {isLoading ? 'Generating...' : 'Generate Ideas'}
                    </button>
                </div>

                <div className="border-t border-light-divider dark:border-dark-divider my-4"></div>

                <div>
                    {isLoading && (
                        <div className="text-center text-light-text-secondary dark:text-dark-text-secondary">
                            <Lightbulb className="w-8 h-8 mx-auto animate-pulse" />
                            <p className="mt-2">The AI is thinking...</p>
                        </div>
                    )}
                    {error && (
                        <div className="text-center text-destructive bg-destructive/10 p-4 rounded-2xl">
                            <p className="font-semibold">An Error Occurred</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                    {ideas.length > 0 && (
                        <div className="space-y-4">
                            {ideas.map((idea, index) => {
                                const [title, ...descriptionParts] = idea.split(':');
                                const description = descriptionParts.join(':');
                                return (
                                <div key={index} className="bg-light-bg-primary dark:bg-dark-bg-secondary p-4 rounded-3xl">
                                    <h3 className="font-bold text-light-accent dark:text-dark-accent">{title.trim()}</h3>
                                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">{description.trim()}</p>
                                </div>
                                );
                            })}
                        </div>
                    )}
                     {!isLoading && ideas.length === 0 && !error && (
                        <div className="text-center text-light-text-secondary dark:text-dark-text-secondary py-8">
                            <p>Your generated ideas will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIBrainstorm;
