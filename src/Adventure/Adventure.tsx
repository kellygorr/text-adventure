import axios from 'axios';
import { useState } from 'react';
import { Map } from './Map';
import { ApiResponse } from '../Intro/Intro';
import './Adventure.scss';

export const Adventure: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [response, setResponse] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newMessages = [...messages, { role: 'user', content: prompt }];
    try {
      const result = await axios.post<ApiResponse>(
        'http://localhost:5001/api/openai',
        { messages: newMessages },
      );
      setMessages(newMessages);
      setResponse(result.data.response);
    } catch (error) {
      console.error('Error fetching response:', error);
    }
  };

  return (
    <div className="Adventure-root">
      <h1 className="Adventure-title">Text adventure</h1>
      <div className="Adventure-content">
        <Map />

        <div className="Adventure-formWrapper">
          <h2>What do you do?</h2>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt"
            />
            <button type="submit">Send</button>
          </form>
        </div>
      </div>
      <p>Response: {response}</p>
    </div>
  );
};
