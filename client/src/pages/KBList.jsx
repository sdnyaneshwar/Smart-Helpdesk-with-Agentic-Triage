import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../lib/api';

function KBList() {
  const [articles, setArticles] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticles() {
      try {
        const { data } = await api.get('/kb', { params: { query } });
        setArticles(data);
      } catch (err) {
        toast.error('Failed to load articles');
      } finally {
        setLoading(false);
      }
    }
    fetchArticles();
  }, [query]);

  if (loading) return <div className="text-center">Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Knowledge Base</h2>
      <Link to="/kb/new" className="bg-blue-600 text-white p-2 rounded mb-4 inline-block">Add Article</Link>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search articles..."
        className="w-full p-2 border rounded mb-4"
        aria-label="Search knowledge base"
      />
      <div className="space-y-4">
        {articles.map((article) => (
          <div key={article._id} className="border p-4 rounded">
            <Link to={`/kb/${article._id}`} className="text-blue-600 hover:underline">
              <h3 className="font-bold">{article.title}</h3>
            </Link>
            <p>{article.body.slice(0, 100)}...</p>
            <p>Tags: {article.tags.join(', ')}</p>
            <p>Status: {article.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default KBList;