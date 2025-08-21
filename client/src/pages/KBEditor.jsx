import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';


function KBEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', body: '', tags: '', status: 'draft' });
  const [loading, setLoading] = useState(!!id);
  const { token } = useAuthStore();
  useEffect(() => {
    if (id && id !== 'new') {
      async function fetchArticle() {
        try {
          const { data } = await api.get(`/kb/${id}`);
          setForm({ ...data, tags: data.tags.join(', ') });
        } catch (err) {
          toast.error('Failed to load article');
        } finally {
          setLoading(false);
        }
      }
      fetchArticle();
    } else {
      setLoading(false);
    }
  }, [id]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...form,
        tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
      };

      if (id && id !== 'new') {
        // Update
        await api.put(`/kb/${id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Article updated');
      } else {
        // Create
        await api.post('/kb', data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Article created');
      }

      navigate('/kb');
    } catch (err) {
      toast.error('Failed to save article');
    }
  };

  if (loading) return <div className="text-center">Loading...</div>;

  return (
    <div className="max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">{id ? 'Edit Article' : 'New Article'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block">Title</label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full p-2 border rounded"
            required
            aria-required="true"
          />
        </div>
        <div>
          <label htmlFor="body" className="block">Body</label>
          <textarea
            id="body"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            className="w-full p-2 border rounded"
            required
            aria-required="true"
          />
        </div>
        <div>
          <label htmlFor="tags" className="block">Tags (comma-separated)</label>
          <input
            id="tags"
            type="text"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label htmlFor="status" className="block">Status</label>
          <select
            id="status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
          Save
        </button>
      </form>
    </div>
  );
}

export default KBEditor;