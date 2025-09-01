import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';

// The base URL for our backend API.
// It checks for a Vercel environment variable, otherwise defaults to local development.
const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

const SearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const performSearch = useCallback(async (searchQuery) => {
        if (searchQuery.length < 3) {
            setResults([]);
            setError('');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const response = await axios.get(`${API_URL}/api/search`, { params: { q: searchQuery } });
            setResults(response.data);
            if (response.data.length === 0) {
                setError('No books found for your query.');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred while searching.');
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const initialQuery = searchParams.get('q');
        if (initialQuery) {
            performSearch(initialQuery);
        }
    }, [performSearch, searchParams]);

    const handleSearch = (e) => {
        e.preventDefault();
        setSearchParams({ q: query });
        performSearch(query);
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <header className="text-center mb-12">
                <h1 className="text-5xl font-bold text-on-surface mb-2">Private Library</h1>
                <p className="text-lg text-on-background">Discover and read from a universe of books.</p>
            </header>
            
            <form onSubmit={handleSearch} className="flex gap-2 mb-8">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by title (e.g., Dune, The Hobbit)"
                    className="w-full px-4 py-3 bg-surface border border-gray-700 rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button type="submit" className="px-6 py-3 bg-primary text-black font-semibold rounded-lg hover:bg-opacity-80 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary">
                    Search
                </button>
            </form>

            {isLoading && <div className="text-center text-on-background">Loading...</div>}
            {error && <div className="text-center text-red-400">{error}</div>}

            <div className="space-y-4">
                {results.map((book) => (
                    <div key={book.ID} className="bg-surface p-5 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-gray-800 transition-colors">
                        <div className="flex-grow">
                            <h2 className="text-xl font-bold text-on-surface">{book.Title}</h2>
                            <p className="text-on-background">{book.Author}</p>
                            <div className="text-sm text-gray-400 mt-2">
                                <span>{book.Year || 'N/A'}</span> &middot; 
                                <span> {book.Extension.toUpperCase()}</span> &middot; 
                                <span> {book.Size}</span>
                            </div>
                        </div>
                        <Link 
                            to={`/read?url=${encodeURIComponent(book.Mirror_1)}&format=${book.Extension}&title=${encodeURIComponent(book.Title)}`}
                            className="w-full sm:w-auto text-center px-5 py-2 bg-secondary text-black font-semibold rounded-lg hover:bg-opacity-90 transition-colors whitespace-nowrap"
                        >
                            Read Now
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SearchPage;
