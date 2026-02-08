'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface ResponseViewerProps {
    data: any;
    error: string | null;
}

export default function ResponseViewer({ data, error }: ResponseViewerProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (error) {
        return (
            <div className="mt-8 bg-red-900/50 border border-red-700 text-red-100 p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-2">Error</h3>
                <p>{error}</p>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">API Response</h2>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm transition-colors"
                >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? 'Copied!' : 'Copy JSON'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Data Preview - Left Column */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <h3 className="text-lg font-semibold text-blue-400 mb-3">Target Info</h3>
                        <div className="space-y-2 text-sm text-gray-300">
                            <p><span className="text-gray-500">Search Metadata:</span> {data.search_metadata?.id}</p>
                            <p><span className="text-gray-500">Status:</span> {data.search_metadata?.status}</p>
                            <p><span className="text-gray-500">Results:</span> {data.local_results?.length || 0} Found</p>
                        </div>
                    </div>

                    {data.local_results && data.local_results.length > 0 && (
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                            <h3 className="text-lg font-semibold text-green-400 mb-3">Top Result</h3>
                            <div className="text-sm">
                                <p className="font-bold text-white text-lg">{data.local_results[0].title}</p>
                                <p className="text-gray-400">{data.local_results[0].address}</p>
                                <p className="text-yellow-500 mt-1">★ {data.local_results[0].rating} ({data.local_results[0].reviews})</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Raw JSON - Right Column (Span 2) */}
                <div className="lg:col-span-2">
                    <div className="relative bg-gray-900 p-4 rounded-lg border border-gray-700 overflow-auto max-h-[600px]">
                        <pre className="text-xs sm:text-sm text-green-300 font-mono">
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    );
}
