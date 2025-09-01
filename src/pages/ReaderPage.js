import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
const ePub = require('epubjs');

const API_URL = process.env.NODE_ENV === 'production' ? '' : 'http://127.0.0.1:5000';

const ReaderPage = () => {
    const [searchParams] = useSearchParams();
    const url = searchParams.get('url');
    const format = searchParams.get('format')?.toLowerCase();
    const title = searchParams.get('title');

    const epubRef = useRef(null);
    const [rendition, setRendition] = useState(null);

    // This effect handles the rendering of EPUB files.
    useEffect(() => {
        if (format === 'epub' && url && epubRef.current) {
            // Clear any previous book render
            epubRef.current.innerHTML = '';
            
            const book = ePub(`${API_URL}/api/stream?url=${encodeURIComponent(url)}`);
            const renditionInstance = book.renderTo(epubRef.current, {
                width: '100%',
                height: '100%',
                spread: 'auto'
            });
            
            renditionInstance.display();
            setRendition(renditionInstance);

            // Clean up when the component unmounts.
            return () => {
                book.destroy();
            };
        }
    }, [url, format]);

    const nextPage = () => rendition?.next();
    const prevPage = () => rendition?.prev();

    const renderContent = () => {
        if (!url || !format) {
            return <div className="text-center text-red-400">Invalid book link. Please go back and try again.</div>;
        }

        switch (format) {
            case 'pdf':
                // For PDFs, we simply use an iframe to let the browser handle rendering.
                return <iframe
                    src={`${API_URL}/api/stream?url=${encodeURIComponent(url)}`}
                    title={title}
                    className="w-full h-full border-0"
                />;

            case 'epub':
                 // For EPUBs, we use the div that our useEffect hook populates with Epub.js.
                return <div ref={epubRef} className="w-full h-full" />;

            default:
                // Fallback for unsupported formats.
                return (
                    <div className="text-center p-8">
                        <h2 className="text-2xl font-bold mb-4">Unsupported Format</h2>
                        <p className="mb-4">Reading ".{format}" files directly in the browser is not supported.</p>
                        <a 
                            href={`${API_URL}/api/stream?url=${encodeURIComponent(url)}`} 
                            download 
                            className="px-5 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-opacity-90"
                        >
                            Download Book
                        </a>
                    </div>
                );
        }
    };
    
    return (
        <div className="flex flex-col h-screen bg-background">
            {/* Header section with book title and back button */}
            <header className="bg-surface p-3 flex justify-between items-center shadow-md z-10 w-full flex-shrink-0">
                <Link to="/" className="px-4 py-2 bg-gray-600 text-on-surface font-semibold rounded-lg hover:bg-gray-500 transition-colors">
                    &larr; Back to Search
                </Link>
                <h1 className="text-lg font-bold text-on-surface mx-4 text-center truncate">{title || 'Reading...'}</h1>
                {/* Navigation controls for EPUBs */}
                {format === 'epub' && rendition && (
                    <div className="flex gap-2">
                        <button onClick={prevPage} className="px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-opacity-90">&lt; Prev</button>
                        <button onClick={nextPage} className="px-4 py-2 bg-primary text-black font-semibold rounded-lg hover:bg-opacity-90">Next &gt;</button>
                    </div>
                )}
                 {/* A placeholder to balance the flex layout when EPUB controls aren't visible */}
                {format !== 'epub' && <div className="w-24"></div>}
            </header>
            
            {/* Main content area for the book viewer */}
            <main className="flex-grow w-full overflow-hidden">
                {renderContent()}
            </main>
        </div>
    );
};

export default ReaderPage;