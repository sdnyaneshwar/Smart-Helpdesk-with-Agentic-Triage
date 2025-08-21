// import { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import { toast } from 'react-toastify';
// import api from '../lib/api';
// import { useAuthStore } from '../store/authStore';

// function TicketList() {
//   const [tickets, setTickets] = useState([]);
//   const [total, setTotal] = useState(0);
//   const [page, setPage] = useState(1);
//   const [status, setStatus] = useState('');
//   const [loading, setLoading] = useState(true);
//   const { user, token } = useAuthStore();
//   const limit = 10;

//   useEffect(() => {
//     async function fetchTickets() {
//       try {

//         const params = { page, limit, status };
//         if (user.role === 'user') params.myTickets = true;
//         const { data } = await api.get('/tickets', {
//           params,
//           headers: {
//             Authorization: `Bearer ${token}`, // ✅ Now token is actually sent
//           },
//         });
//         setTickets(data.tickets);        
//         setTotal(data.total);
//       } catch (err) {
//         toast.error(err.response?.data?.error || 'Failed to load tickets');
//       } finally {
//         setLoading(false);
        
//       }
//     }
//     if (user) fetchTickets();
//   }, [user, page, status]);

//   if (!user) {
//     return <div className="text-center">Please log in to view tickets</div>;
//   }

//   if (loading) return <div className="text-center">Loading...</div>;

//   return (
//     <div>
//       <h2 className="text-2xl font-bold mb-4">Tickets</h2>
//       <div className="flex justify-between mb-4">
//         <Link to="/tickets/new" className="bg-blue-600 text-white p-2 rounded">Create Ticket</Link>
//         <select
//           value={status}
//           onChange={(e) => setStatus(e.target.value)}
//           className="p-2 border rounded"
//           aria-label="Filter by status"
//         >
//           <option value="">All Statuses</option>
//           <option value="open">Open</option>
//           <option value="triaged">Triaged</option>
//           <option value="waiting_human">Waiting Human</option>
//           <option value="resolved">Resolved</option>
//           <option value="closed">Closed</option>
//         </select>
//       </div>
//       <div className="space-y-4">
//         {tickets.length === 0 && <p>No tickets found</p>}
//         {tickets.map((ticket) => (
//           <div key={ticket._id} className="border p-4 rounded">
//             <Link to={`/tickets/${ticket._id}`} className="text-blue-600 hover:underline">
//               <h3 className="font-bold">{ticket.title}</h3>
//             </Link>
//             <p>Status: {ticket.status}</p>
//             <p>Category: {ticket.category}</p>
//             <p>Created By: {ticket.createdBy?.name}</p>
//           </div>
//         ))}
//       </div>
//       <div className="flex justify-between mt-4">
//         <button
//           onClick={() => setPage((p) => Math.max(p - 1, 1))}
//           disabled={page === 1}
//           className="p-2 bg-gray-300 rounded disabled:opacity-50"
//         >
//           Previous
//         </button>
//         <span>Page {page} of {Math.ceil(total / limit)}</span>
//         <button
//           onClick={() => setPage((p) => p + 1)}
//           disabled={page * limit >= total}
//           className="p-2 bg-gray-300 rounded disabled:opacity-50"
//         >
//           Next
//         </button>
//       </div>
//     </div>
//   );
// }

// export default TicketList;
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';

function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [tab, setTab] = useState('assigned'); // 'assigned' or 'unassigned'
  const [loading, setLoading] = useState(true);
  const { user,token } = useAuthStore();
  const limit = 10;

  useEffect(() => {
    async function fetchTickets() {
      try {
        const endpoint = tab === 'unassigned' && user.role === 'agent' ? '/tickets/unassigned' : '/tickets';
        const params = { page, limit };
        if (status) params.status = status;  // only add if not empty
        if (user.role === 'user') params.myTickets = true;
        const { data } = await api.get(endpoint, {
          params,
          headers: {
            Authorization: `Bearer ${token}`, 
          },
        });
        console.log(data);
        
        setTickets(data.tickets);
        setTotal(data.total);
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to load tickets');
      } finally {
        setLoading(false);
      }
    }
    if (user) fetchTickets();
  }, [user, page, status, tab]);

  const handleAssign = async (ticketId) => {
    try {
      await api.post(`/tickets/${ticketId}/assign`, {});
      toast.success('Ticket assigned to you');
      setTickets(tickets.filter((t) => t._id !== ticketId)); // Remove from unassigned list
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign ticket');
    }
  };

  if (!user) {
    return <div className="text-center">Please log in to view tickets</div>;
  }

  if (loading) return <div className="text-center">Loading...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Tickets</h2>
      {user.role === 'user' && (
        <Link to="/tickets/new" className="bg-blue-600 text-white p-2 rounded mb-4 inline-block">
          Create Ticket
        </Link>
      )}
      {user.role === 'agent' && (
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setTab('assigned')}
            className={`p-2 rounded ${tab === 'assigned' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}
          >
            My Tickets
          </button>
          <button
            onClick={() => setTab('unassigned')}
            className={`p-2 rounded ${tab === 'unassigned' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}
          >
            Unassigned Tickets
          </button>
        </div>
      )}
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="p-2 border rounded mb-4"
        aria-label="Filter by status"
      >
        <option value="">All Statuses</option>
        <option value="open">Open</option>
        <option value="triaged">Triaged</option>
        <option value="waiting_human">Waiting Human</option>
        <option value="resolved">Resolved</option>
        <option value="closed">Closed</option>
      </select>
      <div className="space-y-4">
        {tickets.length === 0 && <p>No tickets found</p>}
        {tickets.map((ticket) => (
          <div key={ticket._id} className="border p-4 rounded flex justify-between items-center">
            <div>
              <Link to={`/tickets/${ticket._id}`} className="text-blue-600 hover:underline">
                <h3 className="font-bold">{ticket.title}</h3>
              </Link>
              <p>Status: {ticket.status}</p>
              <p>Category: {ticket.category}</p>
              <p>Created By: {ticket.createdBy?.name}</p>
              {ticket.assignee && <p>Assigned To: {ticket.assignee.name}</p>}
            </div>
            {tab === 'unassigned' && user.role === 'agent' && (
              <button
                onClick={() => handleAssign(ticket._id)}
                className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
              >
                Assign to Me
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-4">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1}
          className="p-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span>Page {page} of {Math.ceil(total / limit)}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={page * limit >= total}
          className="p-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default TicketList;