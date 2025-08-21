import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../lib/api';

function TicketNew() {
  const [form, setForm] = useState({ title: '', description: '', category: 'other' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tickets', form);
      toast.success('Ticket created successfully');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create ticket');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Create New Ticket</h2>
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
          <label htmlFor="description" className="block">Description</label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full p-2 border rounded"
            required
            aria-required="true"
          />
        </div>
        <div>
          <label htmlFor="category" className="block">Category</label>
          <select
            id="category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="billing">Billing</option>
            <option value="tech">Tech</option>
            <option value="shipping">Shipping</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
          Create Ticket
        </button>
      </form>
    </div>
  );
}

export default TicketNew;