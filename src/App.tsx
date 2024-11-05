import React, { useState } from 'react';
import axios from 'axios';
import './App.scss';
import { AdventureScreen } from './screens-adventure/AdventureScreen';

interface ApiResponse {
  response: string;
}

const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [response, setResponse] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await axios.post<ApiResponse>(
        'http://localhost:5001/api/openai',
        { prompt },
      );
      setResponse(result.data.response);
    } catch (error) {
      console.error('Error fetching response:', error);
    }
  };

  return (
    <div className="root">
      <h1 className="title">Text adventure</h1>
      <div className="content">
        <AdventureScreen />

        <div className="formWrapper">
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

export default App;
