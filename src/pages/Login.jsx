import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '', // This will be either username or email
    password: ''
  });
  const [loginMethod, setLoginMethod] = useState('username'); // 'username' or 'email'
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const navigate = useNavigate();

  // Check if user is already logged in or registered
  useEffect(() => {
    const checkLoginAndRegistration = () => {
      try {
        // Check if user is already logged in
        const loginData = JSON.parse(sessionStorage.getItem('userLogin') || 'null');
        if (loginData && loginData.isLoggedIn && loginData.token) {
          // User already logged in, redirect to home
          navigate('/');
          return;
        }

        // Check if user just registered (auto redirect after registration)
        const registrationData = JSON.parse(sessionStorage.getItem('userRegistration') || 'null');
        if (registrationData && registrationData.isRegistered) {
          // Clear registration data after redirect
          sessionStorage.removeItem('userRegistration');
          navigate('/');
          return;
        }
      } catch (error) {
        console.error('Error checking login/registration status:', error);
      }
    };

    checkLoginAndRegistration();
  }, [navigate]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMethodChange = (method) => {
    setLoginMethod(method);
    setFormData(prev => ({
      ...prev,
      identifier: '' // Clear identifier when switching method
    }));
  };

  const validateForm = () => {
    if (!formData.identifier.trim()) {
      const fieldName = loginMethod === 'email' ? 'Email' : 'Username';
      showToast(`${fieldName} harus diisi`, 'error');
      return false;
    }

    if (loginMethod === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.identifier)) {
        showToast('Format email tidak valid', 'error');
        return false;
      }
    } else {
      if (formData.identifier.length < 3) {
        showToast('Username minimal 3 karakter', 'error');
        return false;
      }
    }

    if (!formData.password) {
      showToast('Password harus diisi', 'error');
      return false;
    }

    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare request body based on login method
      const requestBody = {
        password: formData.password
      };

      if (loginMethod === 'email') {
        requestBody.email = formData.identifier.trim();
      } else {
        requestBody.username = formData.identifier.trim();
      }

      const response = await fetch('https://v2.jkt48connect.com/api/dashboard/login?username=vzy&password=vzy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server response is not JSON');
      }

      const data = await response.json();

      if (response.ok && data.status === true) {
        // Login successful
        const loginData = {
          isLoggedIn: true,
          token: data.data.token,
          sessionId: data.data.session_id,
          expiresAt: data.data.expires_at,
          user: data.data.user,
          loginAt: new Date().toISOString()
        };

        // Store login data in sessionStorage
        sessionStorage.setItem('userLogin', JSON.stringify(loginData));
        
        // Also store token separately for easy access
        sessionStorage.setItem('authToken', data.data.token);
        
        showToast('Login berhasil! Mengalihkan ke halaman utama...', 'success');
        
        // Redirect to home page after 1.5 seconds
        setTimeout(() => {
          navigate('/');
        }, 1500);

      } else {
        // Login failed
        const errorMessage = data.message || 'Login gagal. Silakan coba lagi.';
        showToast(errorMessage, 'error');
      }

    } catch (error) {
      console.error('Login error details:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        showToast('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.', 'error');
      } else if (error.message.includes('JSON')) {
        showToast('Server memberikan respons yang tidak valid.', 'error');
      } else {
        showToast('Terjadi kesalahan: ' + error.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      identifier: '',
      password: ''
    });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="login-loading">
          <div className="loading-spinner"></div>
          <p>Memproses login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          <div className="toast-content">
            <div className="toast-icon">
              {toast.type === 'success' ? '✅' : '❌'}
            </div>
            <span className="toast-message">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="login-container">
        <div className="login-header">
          <h1>Masuk Akun</h1>
          <p>Silakan masuk untuk melanjutkan</p>
        </div>

        <div className="login-form-container">
          <form onSubmit={handleLogin} className="login-form" noValidate>
            
            {/* Login Method Selector */}
            <div className="login-method-selector">
              <button
                type="button"
                className={`method-btn ${loginMethod === 'username' ? 'active' : ''}`}
                onClick={() => handleMethodChange('username')}
                disabled={loading}
              >
                Username
              </button>
              <button
                type="button"
                className={`method-btn ${loginMethod === 'email' ? 'active' : ''}`}
                onClick={() => handleMethodChange('email')}
                disabled={loading}
              >
                Email
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="identifier">
                {loginMethod === 'email' ? 'Email' : 'Username'}
              </label>
              <input
                type={loginMethod === 'email' ? 'email' : 'text'}
                id="identifier"
                name="identifier"
                value={formData.identifier}
                onChange={handleInputChange}
                placeholder={loginMethod === 'email' ? 'Masukkan email' : 'Masukkan username'}
                className="form-input"
                disabled={loading}
                autoComplete={loginMethod === 'email' ? 'email' : 'username'}
              />
              <small className="form-hint">
                {loginMethod === 'email' ? 'Email yang terdaftar' : 'Username yang terdaftar'}
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Masukkan password"
                className="form-input"
                disabled={loading}
                autoComplete="current-password"
              />
              <small className="form-hint">Password akun Anda</small>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary btn-full"
                disabled={loading}
              >
                {loading ? 'Memproses...' : 'Masuk Sekarang'}
              </button>
              
              <button 
                type="button" 
                className="btn btn-outline btn-full"
                onClick={handleReset}
                disabled={loading}
              >
                Reset Form
              </button>
            </div>

            <div className="form-links">
              <Link to="/register" className="link">
                Belum punya akun? Daftar sekarang
              </Link>
            </div>

            {/* Debug info - remove in production */}
            <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '4px', fontSize: '12px' }}>
              <strong>Debug Info:</strong>
              <div>Login Method: {loginMethod}</div>
              <div>{loginMethod === 'email' ? 'Email' : 'Username'}: "{formData.identifier}" (length: {formData.identifier.length})</div>
              <div>Password: {"*".repeat(formData.password.length)} (length: {formData.password.length})</div>
              <div>Loading: {loading ? 'Yes' : 'No'}</div>
            </div>
          </form>

          <div className="login-info">
            <div className="info-card">
              <h3>Informasi Login</h3>
              <ul className="info-list">
                <li>Anda bisa login dengan username atau email</li>
                <li>Pastikan akun sudah terdaftar</li>
                <li>Session akan berlaku selama 24 jam</li>
                <li>Jaga kerahasiaan password Anda</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .login-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 300px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #7b1c1c;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .login-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .login-header {
          background: linear-gradient(135deg, #7b1c1c, #6a1818);
          color: white;
          text-align: center;
          padding: 40px 20px;
        }

        .login-header h1 {
          margin-bottom: 10px;
          font-size: 2rem;
          font-weight: bold;
        }

        .login-header p {
          font-size: 1.1rem;
          opacity: 0.9;
        }

        .login-form-container {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 30px;
          padding: 30px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .login-method-selector {
          display: flex;
          gap: 2px;
          background: #f1f1f1;
          border-radius: 8px;
          padding: 4px;
          margin-bottom: 10px;
        }

        .method-btn {
          flex: 1;
          padding: 10px 16px;
          border: none;
          background: transparent;
          cursor: pointer;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s;
          color: #666;
        }

        .method-btn:hover:not(:disabled) {
          background: #e0e0e0;
        }

        .method-btn.active {
          background: #7b1c1c;
          color: white;
          box-shadow: 0 2px 4px rgba(123, 28, 28, 0.3);
        }

        .method-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-weight: 600;
          color: #333;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-input {
          padding: 12px 16px;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 16px;
          transition: all 0.3s;
          background: #f8f9fa;
        }

        .form-input:focus {
          outline: none;
          border-color: #7b1c1c;
          background: white;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(123, 28, 28, 0.2);
        }

        .form-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-hint {
          color: #666;
          font-size: 12px;
          font-style: italic;
        }

        .form-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 20px;
        }

        .form-links {
          text-align: center;
          margin-top: 15px;
        }

        .link {
          color: #7b1c1c;
          text-decoration: none;
          font-size: 14px;
          transition: color 0.3s;
        }

        .link:hover {
          color: #6a1818;
          text-decoration: underline;
        }

        .btn {
          padding: 14px 20px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transition: all 0.3s;
          text-align: center;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: linear-gradient(135deg, #7b1c1c, #6a1818);
          color: white;
          border: 2px solid transparent;
        }

        .btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #6a1818, #5a1515);
        }

        .btn-outline {
          background: transparent;
          border: 2px solid #7b1c1c;
          color: #7b1c1c;
        }

        .btn-outline:hover:not(:disabled) {
          background: #7b1c1c;
          color: white;
        }

        .btn-full {
          width: 100%;
        }

        .login-info {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
        }

        .info-card {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          border: 1px solid #e1e5e9;
        }

        .info-card h3 {
          margin-bottom: 15px;
          color: #333;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .info-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .info-list li {
          padding: 8px 0;
          color: #666;
          font-size: 14px;
          border-bottom: 1px solid #eee;
          position: relative;
          padding-left: 20px;
        }

        .info-list li:before {
          content: "•";
          color: #7b1c1c;
          font-weight: bold;
          position: absolute;
          left: 0;
        }

        .info-list li:last-child {
          border-bottom: none;
        }

        .toast {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          max-width: 400px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          animation: slideIn 0.3s ease-out;
        }

        .toast-success {
          background: linear-gradient(135deg, #d4edda, #c3e6cb);
          border: 1px solid #c3e6cb;
          color: #155724;
        }

        .toast-error {
          background: linear-gradient(135deg, #f8d7da, #f5c6cb);
          border: 1px solid #f5c6cb;
          color: #721c24;
        }

        .toast-content {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          gap: 10px;
        }

        .toast-icon {
          font-size: 18px;
        }

        .toast-message {
          font-weight: 500;
          font-size: 14px;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .container {
            padding: 15px;
          }

          .login-header h1 {
            font-size: 1.8rem;
          }

          .login-form-container {
            grid-template-columns: 1fr;
            gap: 20px;
            padding: 20px;
          }

          .login-info {
            order: -1;
          }
        }

        @media (max-width: 480px) {
          .login-header {
            padding: 30px 15px;
          }

          .login-form-container {
            padding: 15px;
          }

          .form-input {
            font-size: 16px;
          }

          .btn {
            padding: 16px 20px;
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
}

export default Login;
