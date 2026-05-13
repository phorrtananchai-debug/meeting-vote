import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { isAdmin } from '../config/admins';

const LoginPage = () => {
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (isAdmin(result.user.email)) {
        navigate('/admin');
      } else {
        setError('You do not have permission to access the admin dashboard.');
        await auth.signOut();
      }
    } catch (err) {
      console.error(err);
      setError('Failed to login with Google.');
    }
  };

  return (
    <div className="container" style={{ paddingTop: '5rem' }}>
      <div className="card" style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
        <h1 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Admin Login</h1>
        <p className="card-sub">Please sign in with your Google account to continue.</p>

        {error && <div className="err-msg" style={{ display: 'block', marginBottom: '1rem' }}>{error}</div>}

        <button className="btn btn-primary" onClick={handleLogin} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '18px', marginRight: '10px' }} />
          Sign in with Google
        </button>

        <button className="btn btn-secondary" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
          Back to Voting Page
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
