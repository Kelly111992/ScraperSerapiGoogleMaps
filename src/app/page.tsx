'use client';

import { useState } from 'react';
import axios from 'axios';
import SearchForm from './components/SearchForm';
import ResponseViewer from './components/ResponseViewer';

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (params: any) => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await axios.post('/api/serpapi', params);
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
            SerpApi Tester
          </h1>
          <p className="text-gray-400 text-lg">
            Validate Google Maps endpoints, examine JSON responses, and debug extraction logic.
          </p>
        </header>

        <SearchForm onSearch={handleSearch} isLoading={loading} />

        <ResponseViewer data={data} error={error} />
      </div>
    </main>
  );
}
