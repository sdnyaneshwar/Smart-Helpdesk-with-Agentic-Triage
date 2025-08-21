import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../lib/api';

function Settings() {
  const [config, setConfig] = useState({ autoCloseEnabled: true, confidenceThreshold: 0.78, slaHours: 24 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const { data } = await api.get('/config');
        setConfig(data);
      } catch (err) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/config', config);
      toast.success('Settings updated');
    } catch (err) {
      toast.error('Failed to update settings');
    }
  };

  if (loading) return <div className="text-center">Loading...</div>;

  return (
    <div className="max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Settings</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="autoCloseEnabled" className="block">
            <input
              id="autoCloseEnabled"
              type="checkbox"
              checked={config.autoCloseEnabled}
              onChange={(e) => setConfig({ ...config, autoCloseEnabled: e.target.checked })}
              className="mr-2"
            />
            Auto-Close Enabled
          </label>
        </div>
        <div>
          <label htmlFor="confidenceThreshold" className="block">Confidence Threshold</label>
          <input
            id="confidenceThreshold"
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={config.confidenceThreshold}
            onChange={(e) => setConfig({ ...config, confidenceThreshold: parseFloat(e.target.value) })}
            className="w-full p-2 border rounded"
            required
            aria-required="true"
          />
        </div>
        <div>
          <label htmlFor="slaHours" className="block">SLA Hours</label>
          <input
            id="slaHours"
            type="number"
            value={config.slaHours}
            onChange={(e) => setConfig({ ...config, slaHours: parseInt(e.target.value) })}
            className="w-full p-2 border rounded"
            required
            aria-required="true"
          />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
          Save
        </button>
      </form>
    </div>
  );
}

export default Settings;