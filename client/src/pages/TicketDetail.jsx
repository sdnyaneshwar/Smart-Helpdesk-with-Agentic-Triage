import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';



function TicketDetail() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [reply, setReply] = useState('');
  const { user, token } = useAuthStore();   // ✅ use token here
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        if (!token) {
          toast.error("No token found, please login again");
          return;
        }
        const headers = { Authorization: `Bearer ${token}` };
        console.log("Fetching ticket:", id, "with headers:", headers);

        const [ticketRes, auditRes] = await Promise.all([
          api.get(`/tickets/${id}`, { headers }),
          api.get(`/tickets/${id}/audit`, { headers }),
        ]);
        console.log("Ticket fetched:", ticketRes, "Audit logs fetched:", auditRes);
        

        setTicket(ticketRes.data);
        setAuditLogs(auditRes.data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load ticket");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, token]);  // ✅ watch token from store

const handleReply = async (e) => {
  e.preventDefault();
  try {
    if (!token) {
      toast.error("Not authenticated");
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    await api.post(
      `/tickets/${id}/reply`,
      { reply, status: "resolved" },
      { headers }
    );

    toast.success("Reply sent");
    setTicket({
      ...ticket,
      status: "resolved",
      description: `${ticket.description}\n\nAgent Reply: ${reply}`,
    });
    setReply("");
  } catch (err) {
    console.error(err);
    toast.error("Failed to send reply");
  }
};

  if (loading) return <div className="text-center">Loading...</div>;
  if (!ticket) return <div className="text-center">Ticket not found</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{ticket.title}</h2>
      <p><strong>Status:</strong> {ticket.status}</p>
      <p><strong>Category:</strong> {ticket.category}</p>
      <p><strong>Description:</strong> {ticket.description}</p>
     
      {user.role === 'agent' && ticket.status === 'waiting_human' && (
        <form onSubmit={handleReply} className="mt-4">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter your reply"
            required
            aria-required="true"
          />
          <button type="submit" className="bg-blue-600 text-white p-2 rounded mt-2">
            Send Reply
          </button>
        </form>
      )}
      <h3 className="font-bold mt-4">Audit Log</h3>
      <ul className="space-y-2">
        {auditLogs.map((log) => (
          <li key={log._id} className="border p-2 rounded">
            <p><strong>Action:</strong> {log.action}</p>
            <p><strong>Actor:</strong> {log.actor}</p>
            <p><strong>Timestamp:</strong> {new Date(log.timestamp).toLocaleString()}</p>
            <p><strong>Meta:</strong> {JSON.stringify(log.meta)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TicketDetail;