import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

function NavBar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <nav className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">Smart Helpdesk</Link>
        <div className="space-x-4">
          {user ? (
            <>
              <Link to="/" className="hover:underline">Tickets</Link>
              {user.role === 'admin' && (
                <>
                  <Link to="/kb" className="hover:underline">KB</Link>
                  <Link to="/settings" className="hover:underline">Settings</Link>
                </>
              )}
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="hover:underline"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:underline">Login</Link>
              <Link to="/register" className="hover:underline">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;