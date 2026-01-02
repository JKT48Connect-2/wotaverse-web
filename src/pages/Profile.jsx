import React, { useState, useEffect } from 'react';
import { User, Edit, Save, X, MapPin, Phone, Mail, Calendar, Building, Globe, Shield, Activity, Clock, Eye, EyeOff, ChevronDown } from 'lucide-react';
import './ProfilePage.css'; // Import the CSS file
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [editableData, setEditableData] = useState({});
  const [addressData, setAddressData] = useState({
    alamat: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'Indonesia'
  });

  const navigate = useNavigate();

  // Function to search address from HERE Maps API
  const searchAddress = async (query) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setSearchingAddress(true);
    try {
      const apiKey = "ZcgqQFaE9azO73XJTasyhgHSVBST-aHpmj-VF4UM6sY"; // HERE Maps API Key
      const url = `https://autosuggest.search.hereapi.com/v1/autosuggest?at=-6.2,106.8&q=${encodeURIComponent(
        query
      )}&limit=5&apiKey=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      // Filter only addresses/places that have address
      const suggestions = data.items.filter(
        (item) => item.address && item.address.label
      );
      setAddressSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } catch (err) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setSearchingAddress(false);
    }
  };

  // Handle address suggestion selection
  const selectAddressSuggestion = (suggestion) => {
    const address = suggestion.address;
    setAddressData(prev => ({
      ...prev,
      alamat: address.label,
      city: address.city || prev.city,
      province: address.state || prev.province,
      country: address.countryName || prev.country
    }));
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  // Get localStorage data for address
  const getLocalStorageAddress = () => {
    try {
      const stored = localStorage.getItem('userAddress');
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  // Save address data to localStorage
  const saveLocalStorageAddress = (addressData) => {
    try {
      localStorage.setItem('userAddress', JSON.stringify({
        alamat: addressData.alamat,
        postal_code: addressData.postal_code,
        savedAt: new Date().toISOString()
      }));
    } catch (error) {
      return null;
    }
  };

  // Get data from localStorage
  const getStoredData = () => {
    try {
      // Check for successful registration data first
      const successfulReg = localStorage.getItem('successfulRegistration');
      if (successfulReg) {
        const regData = JSON.parse(successfulReg);
        return {
          username: regData.username,
          email: regData.email,
          full_name: regData.full_name
        };
      }

      // Check for current form data
      const formData = localStorage.getItem('registerFormData');
      if (formData) {
        const parsedData = JSON.parse(formData);
        return parsedData;
      }

      // Check session storage for login data
      const loginData = sessionStorage.getItem('userLogin');
      if (loginData) {
        const parsedLogin = JSON.parse(loginData);
        return {
          username: parsedLogin.user?.username,
          email: parsedLogin.user?.email,
          full_name: parsedLogin.user?.full_name
        };
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  // Create mock profile from stored data when API fails
  const createMockProfileFromStoredData = (storedData) => {
    const localAddress = getLocalStorageAddress();
    
    const mockProfile = {
      profile_id: 'local_' + Date.now(),
      username: storedData.username || 'user',
      email: storedData.email || 'user@example.com',
      full_name: storedData.full_name || storedData.username || 'User',
      alamat: localAddress?.alamat || storedData.alamat || '',
      nomor_hp: storedData.nomor_hp || '',
      city: storedData.city || '',
      province: storedData.province || '',
      postal_code: localAddress?.postal_code || storedData.postal_code || '',
      country: storedData.country || 'Indonesia',
      status_member: 'no',
      account_type: 'regular',
      is_active: true,
      is_verified: false,
      bio: '',
      occupation: '',
      company: '',
      website: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setProfile(mockProfile);
    setupEditableData(mockProfile);
    setupAddressData(mockProfile);
    setSuccess('Displaying your profile from local storage data');
    setLoading(false);
  };

  // Fetch only current user's profile
  const fetchProfile = async () => {
    setLoading(true);
    setError('');

    const storedData = getStoredData();
    if (!storedData) {
      setError('No profile data found. Please register or login first.');
      setLoading(false);
      return;
    }

    try {
      let url = '';
      let searchValue = '';
      
      // Try to get profile using stored username first, then email
      if (storedData.username) {
        url = `https://v2.jkt48connect.com/api/dashboard/public/profile/username/${encodeURIComponent(storedData.username)}?username=vzy&password=vzy`;
        searchValue = storedData.username;
      } else if (storedData.email) {
        url = `https://v2.jkt48connect.com/api/dashboard/public/profile/email/${encodeURIComponent(storedData.email)}?username=vzy&password=vzy`;
        searchValue = storedData.email;
      } else {
        throw new Error('No username or email found in stored data');
      }


      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      

      if (response.ok && data.status) {
        // Merge API data with localStorage address data
        const localAddress = getLocalStorageAddress();
        const profileData = {
          ...data.data,
          alamat: localAddress?.alamat || data.data.alamat,
          postal_code: localAddress?.postal_code || data.data.postal_code
        };
        
        setProfile(profileData);
        setupEditableData(profileData);
        setupAddressData(profileData);
        setSuccess('Profile loaded from server');
      } else {
        // API failed, create mock profile from stored data
        createMockProfileFromStoredData(storedData);
      }
    } catch (error) {
      
      // Network error - create mock profile from stored data
      createMockProfileFromStoredData(storedData);
      setError('Could not connect to server. Showing data from local storage.');
    } finally {
      setLoading(false);
    }
  };

  // Setup editable data from profile
  const setupEditableData = (profileData) => {
    setEditableData({
      username: profileData.username || '',
      full_name: profileData.full_name || '',
      bio: profileData.bio || '',
      occupation: profileData.occupation || '',
      company: profileData.company || '',
      website: profileData.website || ''
    });
  };

  // Setup address data from profile
  const setupAddressData = (profileData) => {
    setAddressData({
      alamat: profileData.alamat || '',
      city: profileData.city || '',
      province: profileData.province || '',
      postal_code: profileData.postal_code || '',
      country: profileData.country || 'Indonesia'
    });
  };

  // Auto-load user's own profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle input changes for editing
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle address input changes
  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddressData(prev => ({
      ...prev,
      [name]: value
    }));

    // Trigger address search for alamat field
    if (name === 'alamat') {
      searchAddress(value);
    }
  };

  // Handle password change form
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Update profile (Note: This would require authentication in real implementation)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('Profile update is not available in public mode. Please log in to update your profile.');
  };

  // Update address using the API (only city, province, country) and localStorage (alamat, postal_code)
  const handleUpdateAddress = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      if (!addressData.alamat.trim()) {
        setError('Address (alamat) is required');
        return;
      }

      // Save alamat and postal_code to localStorage
      saveLocalStorageAddress({
        alamat: addressData.alamat,
        postal_code: addressData.postal_code
      });

      // Get authentication token for API update
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      if (token) {
        // Update city, province, country via API
        const storedData = getStoredData();
        let identifier = storedData.username || storedData.email;

        const response = await fetch('https://v2.jkt48connect.com/api/dashboard/update-address/search?username=vzy&password=vzy', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            identifier: identifier,
            address_data: {
              alamat: addressData.alamat, // Don't send alamat to API
              city: addressData.city,
              province: addressData.province,
              country: addressData.country
              // Don't send postal_code to API
            }
          })
        });

        const result = await response.json();

        if (response.ok && result.status) {
          // Update local profile data
          setProfile(prev => ({
            ...prev,
            alamat: addressData.alamat,
            city: addressData.city,
            province: addressData.province,
            postal_code: addressData.postal_code,
            country: addressData.country,
            updated_at: new Date().toISOString()
          }));

          setSuccess('Address updated successfully! Complete address and postal code saved locally.');
        } else {
          // API failed, but still update local data
          setProfile(prev => ({
            ...prev,
            alamat: addressData.alamat,
            postal_code: addressData.postal_code,
            updated_at: new Date().toISOString()
          }));

          setSuccess('Address saved locally. Some fields may not sync to server without authentication.');
        }
      } else {
        // No authentication, just update local data
        setProfile(prev => ({
          ...prev,
          alamat: addressData.alamat,
          postal_code: addressData.postal_code,
          updated_at: new Date().toISOString()
        }));

        setSuccess('Address saved locally. Login to sync all address data to server.');
      }

      setEditingAddress(false);
      
    } catch (error) {
       
      // Even if API fails, save to localStorage
      setProfile(prev => ({
        ...prev,
        alamat: addressData.alamat,
        postal_code: addressData.postal_code,
        updated_at: new Date().toISOString()
      }));

      setSuccess('Address saved locally. Server update failed - please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  // Change password (Note: This would require authentication in real implementation)
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('Password change is not available in public mode. Please log in to change your password.');
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Get member status badge class based on API response
  const getMemberStatusClass = (status) => {
    if (status === 'no') return 'badge badge-basic';
    switch (status) {
      case 'premium': return 'badge badge-premium';
      case 'vip': return 'badge badge-vip';
      case 'gold': return 'badge badge-premium';
      case 'silver': return 'badge badge-basic';
      case 'basic': return 'badge badge-basic';
      case 'yes': return 'badge badge-premium';
      default: return 'badge badge-basic';
    }
  };

  // Get member status display text
  const getMemberStatusText = (status) => {
    if (status === 'no') return 'NO MEMBER';
    if (status === 'yes') return 'MEMBER';
    return status?.toUpperCase() || 'NO MEMBER';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="error-container">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <h2 className="error-title">Profile Not Found</h2>
          <p className="error-message">{error || 'Failed to load your profile data'}</p>
          <button 
            onClick={() => fetchProfile()} 
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-wrapper">
        {/* Header */}
        <div className="profile-header">
          <div className="profile-header-content">
            <div className="profile-header-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div className="profile-avatar">
                  {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="profile-details">
                  <h1>{profile.full_name || profile.username}</h1>
                  <p className="profile-username">@{profile.username}</p>
                  <div className="profile-badges">
                    <span className={getMemberStatusClass(profile.status_member)}>
                      {getMemberStatusText(profile.status_member)}
                    </span>
                    {profile.is_verified && (
                      <span className="badge badge-verified">
                        <Shield style={{ width: '12px', height: '12px' }} />
                        Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="profile-tabs">
            <div className="tabs-list">
              <button
                onClick={() => setActiveTab('profile')}
                className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
              >
                <User style={{ width: '16px', height: '16px' }} />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`tab-button ${activeTab === 'activity' ? 'active' : ''}`}
              >
                <Activity style={{ width: '16px', height: '16px' }} />
                Activity
              </button>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-error">
            <X style={{ width: '20px', height: '20px' }} />
            <div className="alert-content">
              <p className="alert-message">{error}</p>
            </div>
            <button onClick={() => setError('')} className="alert-close">
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <div style={{ width: '20px', height: '20px' }}>✓</div>
            <div className="alert-content">
              <p className="alert-message">{success}</p>
            </div>
            <button onClick={() => setSuccess('')} className="alert-close">
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'profile' && (
          <div className="profile-content two-column">
            {/* Main Profile Info */}
            <div>
              <div className="profile-card">
                <h2>Personal Information</h2>
                
                <div className="profile-info-grid">
                  <div className="profile-info-item">
                    <User className="profile-info-icon" />
                    <div className="profile-info-content">
                      <p>Username</p>
                      <p>{profile.username}</p>
                    </div>
                  </div>

                  <div className="profile-info-item">
                    <User className="profile-info-icon" />
                    <div className="profile-info-content">
                      <p>Full Name</p>
                      <p>{profile.full_name || '-'}</p>
                    </div>
                  </div>

                  <div className="profile-info-item">
                    <Mail className="profile-info-icon" />
                    <div className="profile-info-content">
                      <p>Email</p>
                      <p>{profile.email || '-'}</p>
                    </div>
                  </div>

                  <div className="profile-info-item">
                    <Phone className="profile-info-icon" />
                    <div className="profile-info-content">
                      <p>Phone Number</p>
                      <p>{profile.nomor_hp || '-'}</p>
                    </div>
                  </div>

                  {profile.occupation && (
                    <div className="profile-info-item">
                      <Building className="profile-info-icon" />
                      <div className="profile-info-content">
                        <p>Occupation</p>
                        <p>{profile.occupation}</p>
                        {profile.company && (
                          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>at {profile.company}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {profile.website && (
                    <div className="profile-info-item">
                      <Globe className="profile-info-icon" />
                      <div className="profile-info-content">
                        <p>Website</p>
                        <a 
                          href={profile.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="profile-info-link"
                        >
                          {profile.website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {profile.bio && (
                  <div className="profile-bio">
                    <p>Bio</p>
                    <p>{profile.bio}</p>
                  </div>
                )}
              </div>

              {/* Address Section */}
              <div className="profile-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h2>Address Information</h2>
                  <button
                    onClick={() => setEditingAddress(!editingAddress)}
                    className="btn btn-outline"
                    style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
                  >
                    <Edit style={{ width: '16px', height: '16px' }} />
                    <span>{editingAddress ? 'Cancel' : 'Edit Address'}</span>
                  </button>
                </div>

                {editingAddress ? (
                  <form onSubmit={handleUpdateAddress} className="profile-form">
                    <div className="form-group" style={{ position: 'relative' }}>
                      <label className="form-label">
                        Complete Address * 
                        <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 'normal' }}>
                          (Saved locally)
                        </span>
                      </label>
                      <textarea
                        name="alamat"
                        value={addressData.alamat}
                        onChange={handleAddressChange}
                        placeholder="Type to search addresses..."
                        className="form-input"
                        rows="3"
                        required
                      />
                      
                      {/* Address Suggestions */}
                      {showSuggestions && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          backgroundColor: 'white',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          zIndex: 10,
                          maxHeight: '200px',
                          overflowY: 'auto'
                        }}>
                          {searchingAddress && (
                            <div style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                              Searching addresses...
                            </div>
                          )}
                          {addressSuggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              onClick={() => selectAddressSuggestion(suggestion)}
                              style={{
                                padding: '0.75rem',
                                borderBottom: index < addressSuggestions.length - 1 ? '1px solid #e5e7eb' : 'none',
                                cursor: 'pointer',
                                fontSize: '0.875rem'
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                            >
                              <div style={{ fontWeight: '500' }}>{suggestion.title}</div>
                              {suggestion.address.label && (
                                <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>
                                  {suggestion.address.label}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">City</label>
                        <input
                          type="text"
                          name="city"
                          value={addressData.city}
                          onChange={handleAddressChange}
                          placeholder="Enter city"
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Province</label>
                        <input
                          type="text"
                          name="province"
                          value={addressData.province}
                          onChange={handleAddressChange}
                          placeholder="Enter province"
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">
                          Postal Code 
                          <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 'normal' }}>
                            (Saved locally)
                          </span>
                        </label>
                        <input
                          type="text"
                          name="postal_code"
                          value={addressData.postal_code}
                          onChange={handleAddressChange}
                          placeholder="Enter postal code"
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Country</label>
                        <select
                          name="country"
                          value={addressData.country}
                          onChange={handleAddressChange}
                          className="form-input form-select"
                        >
                          <option value="Indonesia">Indonesia</option>
                          <option value="Malaysia">Malaysia</option>
                          <option value="Singapore">Singapore</option>
                          <option value="Thailand">Thailand</option>
                          <option value="Philippines">Philippines</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fffbeb', border: '1px solid #fbbf24', borderRadius: '8px', fontSize: '0.875rem' }}>
                      <p style={{ margin: 0, color: '#92400e' }}>
                        <strong>Note:</strong> Complete address and postal code will be saved locally on your device. 
                        City, province, and country will be synced to the server if authenticated.
                      </p>
                    </div>

                    <div className="form-actions">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={saving}
                      >
                        <Save style={{ width: '16px', height: '16px' }} />
                        <span>{saving ? 'Updating...' : 'Update Address'}</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="profile-info-grid">
                    <div className="profile-info-item full-width">
                      <MapPin className="profile-info-icon" />
                      <div className="profile-info-content">
                        <p>Complete Address</p>
                        <p>{profile.alamat || 'No address provided'}</p>
                        {profile.alamat && (
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            (Stored locally)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="profile-info-item">
                      <MapPin className="profile-info-icon" />
                      <div className="profile-info-content">
                        <p>City</p>
                        <p>{profile.city || '-'}</p>
                      </div>
                    </div>

                    <div className="profile-info-item">
                      <MapPin className="profile-info-icon" />
                      <div className="profile-info-content">
                        <p>Province</p>
                        <p>{profile.province || '-'}</p>
                      </div>
                    </div>

                    <div className="profile-info-item">
                      <MapPin className="profile-info-icon" />
                      <div className="profile-info-content">
                        <p>Postal Code</p>
                        <p>{profile.postal_code || '-'}</p>
                        {profile.postal_code && (
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            (Stored locally)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="profile-info-item">
                      <Globe className="profile-info-icon" />
                      <div className="profile-info-content">
                        <p>Country</p>
                        <p>{profile.country || 'Indonesia'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Stats */}
            <div className="sidebar-cards">
              <div className="profile-card">
                <h3>Profile Information</h3>
                <div className="status-list">
                  <div className="profile-info-item">
                    <Calendar className="profile-info-icon" />
                    <div className="profile-info-content">
                      <p>Joined</p>
                      <p>{formatDate(profile.created_at)}</p>
                    </div>
                  </div>
                  <div className="profile-info-item">
                    <Activity className="profile-info-icon" />
                    <div className="profile-info-content">
                      <p>Last Updated</p>
                      <p>{formatDate(profile.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="profile-card">
                <div style={{ padding: '1rem', background: '#f9fafb', borderRadius: '8px', fontSize: '0.875rem', color: '#6b7280' }}>
                  <p style={{ marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                    {profile.profile_id?.startsWith('local_') ? 'Local Profile' : 'Your Profile'}
                  </p>
                  <p>
                    {profile.profile_id?.startsWith('local_') 
                      ? 'This profile is created from your local storage data. Register or login to save it permanently.' 
                      : 'This is your personal profile. You can edit your address information.'
                    }
                  </p>
                  <p style={{ marginTop: '0.5rem' }}>Profile ID: {profile.profile_id}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="profile-card">
            <h2>Account Activity</h2>
            
            <div className="activity-stats">
              <div className="activity-stat-card blue">
                <div className="activity-stat-info">
                  <p>Account Status</p>
                  <p>{profile.is_active ? 'Active' : 'Inactive'}</p>
                </div>
                <Activity className="activity-stat-icon" />
              </div>

              <div className="activity-stat-card green">
                <div className="activity-stat-info">
                  <p>Member Since</p>
                  <p style={{ fontSize: '1.125rem' }}>{formatDate(profile.created_at)}</p>
                </div>
                <Calendar className="activity-stat-icon" />
              </div>

              <div className="activity-stat-card purple">
                <div className="activity-stat-info">
                  <p>Last Updated</p>
                  <p style={{ fontSize: '1.125rem' }}>{formatDate(profile.updated_at)}</p>
                </div>
                <Clock className="activity-stat-icon" />
              </div>
            </div>

            <div className="activity-history">
              <h3>Profile Timeline</h3>
              <div className="activity-list">
                <div className="activity-item">
                  <div className="activity-icon-container green">
                    <User className="activity-icon" />
                  </div>
                  <div className="activity-content">
                    <p>Account created</p>
                    <p>{formatDate(profile.created_at)}</p>
                  </div>
                </div>

                {profile.updated_at !== profile.created_at && (
                  <div className="activity-item">
                    <div className="activity-icon-container blue">
                      <Edit className="activity-icon" />
                    </div>
                    <div className="activity-content">
                      <p>Profile updated</p>
                      <p>{formatDate(profile.updated_at)}</p>
                    </div>
                  </div>
                )}

                {profile.is_verified && (
                  <div className="activity-item">
                    <div className="activity-icon-container purple">
                      <Shield className="activity-icon" />
                    </div>
                    <div className="activity-content">
                      <p>Account verified</p>
                      <p>Profile has been verified</p>
                    </div>
                  </div>
                )}

                {profile.alamat && (
                  <div className="activity-item">
                    <div className="activity-icon-container blue">
                      <MapPin className="activity-icon" />
                    </div>
                    <div className="activity-content">
                      <p>Address information added</p>
                      <p>Profile includes address details</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
