import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    alamat: '',
    nomor_hp: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const navigate = useNavigate();

  // Load saved form data from localStorage on component mount
  useEffect(() => {
    const loadSavedFormData = () => {
      try {
        const savedFormData = localStorage.getItem('registerFormData');
        if (savedFormData) {
          const parsedData = JSON.parse(savedFormData);
          setFormData(prev => ({
            ...prev,
            ...parsedData,
            // Don't load passwords for security reasons
            password: '',
            confirmPassword: ''
          }));
        }
      } catch (error) {
        // Clear corrupted data
        localStorage.removeItem('registerFormData');
      }
    };

    loadSavedFormData();
  }, []);

  // Check if user is already registered or logged in
  useEffect(() => {
    const checkRegistrationAndLogin = () => {
      try {
        // Check if user is already logged in
        const loginData = JSON.parse(sessionStorage.getItem('userLogin') || 'null');
        if (loginData && loginData.isLoggedIn && loginData.token) {
          // User already logged in, redirect to home
          navigate('/');
          return;
        }

        // Check if user is already registered
        const registrationData = JSON.parse(sessionStorage.getItem('userRegistration') || 'null');
        if (registrationData && registrationData.isRegistered) {
          // User already registered, redirect to home
          navigate('/');
        }
      } catch (error) {
        // Handle silently, just don't redirect
      }
    };

    checkRegistrationAndLogin();
  }, [navigate]);

  // Save form data to localStorage whenever formData changes
  useEffect(() => {
    const saveFormDataToLocalStorage = () => {
      try {
        // Create a copy without passwords for security
        const dataToSave = {
          username: formData.username,
          email: formData.email,
          full_name: formData.full_name,
          alamat: formData.alamat,
          nomor_hp: formData.nomor_hp
          // Don't save passwords to localStorage for security reasons
        };

        // Only save if there's meaningful data
        const hasData = Object.values(dataToSave).some(value => value.trim() !== '');
        
        if (hasData) {
          localStorage.setItem('registerFormData', JSON.stringify(dataToSave));
        }
      } catch (error) {
        // Handle silently, form auto-save is not critical
      }
    };

    // Debounce the save operation to avoid too frequent saves
    const timeoutId = setTimeout(saveFormDataToLocalStorage, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.username, formData.email, formData.full_name, formData.alamat, formData.nomor_hp]);

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
    
    // Clear field-specific error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const clearAllFieldErrors = () => {
    setFieldErrors({});
  };

  const setFieldError = (fieldName, errorMessage) => {
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: errorMessage
    }));
  };

  const validateForm = () => {
    clearAllFieldErrors();
    let isValid = true;

    if (!formData.username.trim()) {
      setFieldError('username', 'Username harus diisi');
      isValid = false;
    } else if (formData.username.length < 3) {
      setFieldError('username', 'Username minimal 3 karakter');
      isValid = false;
    }

    if (!formData.email.trim()) {
      setFieldError('email', 'Email harus diisi');
      isValid = false;
    } else {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setFieldError('email', 'Format email tidak valid');
        isValid = false;
      }
    }

    if (!formData.full_name.trim()) {
      setFieldError('full_name', 'Nama lengkap harus diisi');
      isValid = false;
    }

    if (!formData.alamat.trim()) {
      setFieldError('alamat', 'Alamat harus diisi');
      isValid = false;
    }

    if (!formData.nomor_hp.trim()) {
      setFieldError('nomor_hp', 'Nomor HP harus diisi');
      isValid = false;
    } else {
      // Basic phone number validation (Indonesian format)
      const phoneRegex = /^(\+62|62|0)[0-9]{9,13}$/;
      if (!phoneRegex.test(formData.nomor_hp.replace(/\s|-/g, ''))) {
        setFieldError('nomor_hp', 'Format nomor HP tidak valid');
        isValid = false;
      }
    }

    if (!formData.password) {
      setFieldError('password', 'Password harus diisi');
      isValid = false;
    } else if (formData.password.length < 6) {
      setFieldError('password', 'Password minimal 6 karakter');
      isValid = false;
    }

    if (!formData.confirmPassword) {
      setFieldError('confirmPassword', 'Konfirmasi password harus diisi');
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      setFieldError('confirmPassword', 'Konfirmasi password tidak cocok');
      isValid = false;
    }

    if (!isValid) {
      showToast('Periksa kembali form yang telah diisi', 'error');
    }

    return isValid;
  };

  const parseServerError = (data, response) => {
    const errorMessage = data.message || data.error || '';
    
    // Handle specific field errors based on server response
    if (errorMessage.toLowerCase().includes('phone number already exists') || 
        errorMessage.toLowerCase().includes('nomor hp sudah digunakan') ||
        errorMessage.toLowerCase().includes('nomor sudah ada')) {
      setFieldError('nomor_hp', 'Nomor HP sudah ada yang menggunakan');
      return true;
    }
    
    if (errorMessage.toLowerCase().includes('username already exists') ||
        errorMessage.toLowerCase().includes('username sudah digunakan') ||
        errorMessage.toLowerCase().includes('username sudah ada')) {
      setFieldError('username', 'Username sudah ada yang menggunakan');
      return true;
    }
    
    if (errorMessage.toLowerCase().includes('email already exists') ||
        errorMessage.toLowerCase().includes('email sudah digunakan') ||
        errorMessage.toLowerCase().includes('email sudah ada')) {
      setFieldError('email', 'Email sudah ada yang menggunakan');
      return true;
    }
    
    if (errorMessage.toLowerCase().includes('invalid email') ||
        errorMessage.toLowerCase().includes('email tidak valid')) {
      setFieldError('email', 'Format email tidak valid');
      return true;
    }
    
    if (errorMessage.toLowerCase().includes('invalid phone') ||
        errorMessage.toLowerCase().includes('nomor hp tidak valid')) {
      setFieldError('nomor_hp', 'Format nomor HP tidak valid');
      return true;
    }
    
    if (errorMessage.toLowerCase().includes('username too short') ||
        errorMessage.toLowerCase().includes('username terlalu pendek')) {
      setFieldError('username', 'Username terlalu pendek');
      return true;
    }
    
    if (errorMessage.toLowerCase().includes('password too short') ||
        errorMessage.toLowerCase().includes('password terlalu pendek')) {
      setFieldError('password', 'Password terlalu pendek');
      return true;
    }
    
    // If no specific field error was found, show general error
    return false;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    clearAllFieldErrors();

    try {
      const requestBody = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        full_name: formData.full_name.trim(),
        alamat: formData.alamat.trim(),
        nomor_hp: formData.nomor_hp.trim().replace(/\s|-/g, '') // Remove spaces and dashes
      };

      const response = await fetch('https://v2.jkt48connect.com/api/dashboard/register?username=vzy&password=vzy', {
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
        showToast('Server memberikan respons yang tidak valid', 'error');
        return;
      }

      const data = await response.json();

      if (response.ok) {
        // Check for different success indicators
        if (data.status === true || data.success === true || response.status === 200 || response.status === 201) {
          // Registration successful
          const registrationData = {
            isRegistered: true,
            username: formData.username.trim(),
            registeredAt: new Date().toISOString(),
            userData: data.data || data.user || {}
          };

          // Store registration data in sessionStorage
          sessionStorage.setItem('userRegistration', JSON.stringify(registrationData));
          
          // Store successful registration data in localStorage for future reference
          const successfulRegistrationData = {
            username: formData.username.trim(),
            email: formData.email.trim(),
            full_name: formData.full_name.trim(),
            registeredAt: new Date().toISOString(),
            isSuccessfullyRegistered: true
          };
          localStorage.setItem('successfulRegistration', JSON.stringify(successfulRegistrationData));
          
          // Clear the form data from localStorage since registration is complete
          localStorage.removeItem('registerFormData');
          
          showToast('Registrasi berhasil! Mengalihkan ke halaman utama...', 'success');
          
          // Redirect to home page immediately (no delay needed as login page will handle it)
          navigate('/');

        } else {
          // Registration failed - try to parse specific field errors
          const hasSpecificError = parseServerError(data, response);
          
          if (!hasSpecificError) {
            // Show general error message if no specific field error was handled
            const errorMessage = data.message || data.error || 'Registrasi gagal. Silakan coba lagi.';
            showToast(errorMessage, 'error');
          }
        }
      } else {
        // HTTP error status - try to parse specific field errors first
        const hasSpecificError = parseServerError(data, response);
        
        if (!hasSpecificError) {
          // Show general error message if no specific field error was handled
          if (response.status === 400) {
            showToast('Data yang dikirim tidak valid. Periksa kembali form.', 'error');
          } else if (response.status === 409) {
            showToast('Data sudah ada yang menggunakan. Coba dengan data yang lain.', 'error');
          } else if (response.status >= 500) {
            showToast('Terjadi kesalahan pada server. Coba lagi nanti.', 'error');
          } else {
            const errorMessage = data.message || data.error || 'Registrasi gagal. Silakan coba lagi.';
            showToast(errorMessage, 'error');
          }
        }
      }

    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        showToast('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.', 'error');
      } else if (error.message.includes('JSON')) {
        showToast('Server memberikan respons yang tidak valid.', 'error');
      } else {
        showToast('Terjadi kesalahan yang tidak terduga. Silakan coba lagi.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      full_name: '',
      alamat: '',
      nomor_hp: ''
    });
    
    clearAllFieldErrors();
    
    // Clear saved form data from localStorage
    localStorage.removeItem('registerFormData');
    
    showToast('Form telah direset', 'success');
  };

  const handleClearSavedData = () => {
    // Clear all registration-related data from localStorage
    localStorage.removeItem('registerFormData');
    localStorage.removeItem('successfulRegistration');
    showToast('Data tersimpan telah dihapus', 'success');
  };

  // Check if there's saved data
  const hasSavedData = () => {
    try {
      const savedData = localStorage.getItem('registerFormData');
      return savedData && JSON.parse(savedData);
    } catch {
      return false;
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="register-loading">
          <div className="loading-spinner"></div>
          <p>Memproses registrasi...</p>
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

      <div className="register-container">
        <div className="register-header">
          <h1>Registrasi Akun</h1>
          <p>Buat akun baru untuk melanjutkan</p>
        </div>

        <div className="register-form-container">
          <form onSubmit={handleRegister} className="register-form" noValidate>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Masukkan username"
                className={`form-input ${fieldErrors.username ? 'form-input-error' : ''}`}
                disabled={loading}
                autoComplete="username"
              />
              {fieldErrors.username ? (
                <small className="form-error">{fieldErrors.username}</small>
              ) : (
                <small className="form-hint">Minimal 3 karakter</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Masukkan email"
                className={`form-input ${fieldErrors.email ? 'form-input-error' : ''}`}
                disabled={loading}
                autoComplete="email"
              />
              {fieldErrors.email ? (
                <small className="form-error">{fieldErrors.email}</small>
              ) : (
                <small className="form-hint">Format: nama@domain.com</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="full_name">Nama Lengkap</label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Masukkan nama lengkap"
                className={`form-input ${fieldErrors.full_name ? 'form-input-error' : ''}`}
                disabled={loading}
                autoComplete="name"
              />
              {fieldErrors.full_name ? (
                <small className="form-error">{fieldErrors.full_name}</small>
              ) : (
                <small className="form-hint">Nama lengkap sesuai identitas</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="alamat">Alamat</label>
              <textarea
                id="alamat"
                name="alamat"
                value={formData.alamat}
                onChange={handleInputChange}
                placeholder="Masukkan alamat lengkap"
                className={`form-input form-textarea ${fieldErrors.alamat ? 'form-input-error' : ''}`}
                disabled={loading}
                rows={3}
              />
              {fieldErrors.alamat ? (
                <small className="form-error">{fieldErrors.alamat}</small>
              ) : (
                <small className="form-hint">Alamat lengkap tempat tinggal</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="nomor_hp">Nomor HP</label>
              <input
                type="tel"
                id="nomor_hp"
                name="nomor_hp"
                value={formData.nomor_hp}
                onChange={handleInputChange}
                placeholder="08xxxxxxxxxx"
                className={`form-input ${fieldErrors.nomor_hp ? 'form-input-error' : ''}`}
                disabled={loading}
                autoComplete="tel"
              />
              {fieldErrors.nomor_hp ? (
                <small className="form-error">{fieldErrors.nomor_hp}</small>
              ) : (
                <small className="form-hint">Format: 08xxxxxxxxxx atau +62xxxxxxxxxx</small>
              )}
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
                className={`form-input ${fieldErrors.password ? 'form-input-error' : ''}`}
                disabled={loading}
                autoComplete="new-password"
              />
              {fieldErrors.password ? (
                <small className="form-error">{fieldErrors.password}</small>
              ) : (
                <small className="form-hint">Minimal 6 karakter (tidak tersimpan untuk keamanan)</small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Konfirmasi Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Ulangi password"
                className={`form-input ${fieldErrors.confirmPassword ? 'form-input-error' : ''}`}
                disabled={loading}
                autoComplete="new-password"
              />
              {fieldErrors.confirmPassword ? (
                <small className="form-error">{fieldErrors.confirmPassword}</small>
              ) : (
                <small className="form-hint">Harus sama dengan password di atas</small>
              )}
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary btn-full"
                disabled={loading}
              >
                {loading ? 'Memproses...' : 'Daftar Sekarang'}
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
          </form>

          <div className="register-info">
            <div className="info-card">
              <h3>Informasi Registrasi</h3>
              <ul className="info-list">
                <li>Username harus unik dan minimal 3 karakter</li>
                <li>Email harus valid dan dapat diakses</li>
                <li>Nama lengkap sesuai identitas resmi</li>
                <li>Alamat harus lengkap dan jelas</li>
                <li>Nomor HP aktif untuk verifikasi</li>
                <li>Password minimal 6 karakter</li>
                <li>Pastikan konfirmasi password sesuai</li>
                <li>Data akan disimpan dengan aman</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .register-loading {
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

        .register-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .register-header {
          background: linear-gradient(135deg, #7b1c1c, #6a1818);
          color: white;
          text-align: center;
          padding: 40px 20px;
        }

        .register-header h1 {
          margin-bottom: 10px;
          font-size: 2rem;
          font-weight: bold;
        }

        .register-header p {
          font-size: 1.1rem;
          opacity: 0.9;
          margin-bottom: 0;
        }

        .saved-data-notice {
          margin-top: 15px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 0.9rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .register-form-container {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 30px;
          padding: 30px;
        }

        .register-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
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

        .form-input-error {
          border-color: #dc3545 !important;
          background: #fff5f5 !important;
          box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1) !important;
        }

        .form-input-error:focus {
          border-color: #dc3545 !important;
          box-shadow: 0 4px 8px rgba(220, 53, 69, 0.2) !important;
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
          font-family: inherit;
        }

        .form-hint {
          color: #666;
          font-size: 12px;
          font-style: italic;
        }

        .form-error {
          color: #dc3545;
          font-size: 12px;
          font-weight: 500;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .form-error:before {
          content: "⚠";
          font-size: 14px;
        }

        .form-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 20px;
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

        .btn-warning {
          background: linear-gradient(135deg, #ff6b35, #f7931e);
          color: white;
          border: 2px solid transparent;
        }

        .btn-warning:hover:not(:disabled) {
          background: linear-gradient(135deg, #e55a2e, #e8841a);
        }

        .btn-full {
          width: 100%;
        }

        .register-info {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          gap: 20px;
        }

        .info-card {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          border: 1px solid #e1e5e9;
        }

        .storage-info {
          background: linear-gradient(135deg, #e8f5e8, #f0f8f0);
          border-color: #c3e6cb;
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

          .register-header h1 {
            font-size: 1.8rem;
          }

          .register-form-container {
            grid-template-columns: 1fr;
            gap: 20px;
            padding: 20px;
          }

          .register-info {
            order: -1;
          }
        }

        @media (max-width: 480px) {
          .register-header {
            padding: 30px 15px;
          }

          .register-form-container {
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

export default Register;
