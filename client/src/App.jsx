import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NavBar from './components/NavBar';
import Login from './pages/Login';
import Register from './pages/Register';
import TicketList from './pages/TicketList';
import TicketDetail from './pages/TicketDetail';
import TicketNew from './pages/TicketNew';
import KBList from './pages/KBList';
import KBEditor from './pages/KBEditor';
import Settings from './pages/Settings';
import { useAuthStore } from './store/authStore';

function App() {
  const { user } = useAuthStore();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <NavBar />
        <div className="container mx-auto p-4">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<TicketList />} />
            <Route path="/tickets/new" element={<TicketNew />} /> {/* Add this */}
            <Route path="/tickets/:id" element={<TicketDetail />} />
            {user?.role === 'admin' && (
              <>
                <Route path="/kb" element={<KBList />} />
                <Route path="/kb/:id?" element={<KBEditor />} />
                <Route path="/settings" element={<Settings />} />
              </>
            )}
          </Routes>
        </div>
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </BrowserRouter>
  );
}

export default App;