from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import requests
from libgen_api import LibgenSearch
import urllib.parse

# Vercel deploys this as a serverless function, and 'app' is the entry point.
app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for the frontend to communicate with this API.

# A custom user-agent to mimic a real browser, which can help avoid being blocked.
REQUEST_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

# Caching search results in memory to speed up repeated searches and reduce external API calls.
search_cache = {}

@app.route('/')
def home():
    # A simple welcome message for the API root.
    return "Private Library API is running."

@app.route('/api/search', methods=['GET'])
def search_books():
    """
    Searches for books based on a query parameter.
    Example: /api/search?q=The+Lord+of+the+Rings
    """
    query = request.args.get('q', '')
    if not query or len(query) < 3:
        return jsonify({"error": "A search query of at least 3 characters is required."}), 400

    # Return cached results if the same query was made recently.
    if query in search_cache:
        return jsonify(search_cache[query])

    try:
        s = LibgenSearch()
        
        #
        # --- FIX: Override the default mirrors with a more reliable list ---
        #
        s.search_mirrors = [
            "http://libgen.rs",
            "http://libgen.is",
            "http://libgen.st",
        ]
        
        # Search by title, limiting to the top 50 results for performance.
        results = s.search_title(query)
        
        # We only need a few key details for the frontend.
        # This keeps the response payload small and fast.
        filtered_results = []
        for item in results[:50]: # Limit results
            filtered_results.append({
                'ID': item.get('ID'),
                'Title': item.get('Title'),
                'Author': item.get('Author'),
                'Year': item.get('Year'),
                'Extension': item.get('Extension'),
                'Size': item.get('Size'),
                'Mirror_1': item.get('Mirror_1') # This is the crucial link we need
            })
        
        search_cache[query] = filtered_results # Cache the successful result.
        return jsonify(filtered_results)
    except requests.exceptions.ConnectionError as e:
        return jsonify({"error": f"Could not connect to Library Genesis. The mirror may be down. Details: {str(e)}"}), 503
    except Exception as e:
        # If the search fails, return a server error.
        return jsonify({"error": f"An error occurred while searching: {str(e)}"}), 500

@app.route('/api/stream', methods=['GET'])
def stream_book():
    """
    Resolves the direct download link for a book and streams it to the client.
    Example: /api/stream?url=http://library.lol/main/....
    """
    book_url = request.args.get('url', '')
    if not book_url:
        return jsonify({"error": "Book URL is required."}), 400

    try:
        s = LibgenSearch()
        # The LibgenSearch object can resolve the mirror link to a direct download URL.
        download_links = s.resolve_download_links({"Mirror_1": book_url})
        
        # We need to find the 'GET' link, which is typically the most reliable direct link.
        direct_link = download_links.get('GET')
        if not direct_link:
            return jsonify({"error": "Could not resolve a direct download link for this book."}), 404

        # Fetch the book content from the direct link as a stream.
        req = requests.get(direct_link, stream=True, headers=REQUEST_HEADERS)
        req.raise_for_status() # Will raise an exception for bad status codes (4xx or 5xx).

        # Stream the content back to the user chunk by chunk.
        # This is memory-efficient as the server doesn't hold the whole file at once.
        return Response(req.iter_content(chunk_size=8192),
                        content_type=req.headers['Content-Type'],
                        status=req.status_code)

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to fetch book content: {str(e)}"}), 502 # Bad Gateway
    except Exception as e:
        return jsonify({"error": f"An unexpected error occurred: {str(e)}"}), 500