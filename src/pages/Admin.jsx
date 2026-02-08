import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function AdminCodeManagement() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("create"); // create, list, detail
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [statistics, setStatistics] = useState(null);
  const [codesList, setCodesList] = useState([]);
  const [selectedCode, setSelectedCode] = useState(null);
  const [codeHistory, setCodeHistory] = useState([]);
  
  // Filter states
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form states untuk create/update
  const [formData, setFormData] = useState({
    email: "",
    codeType: "custom",
    purpose: "",
    codeLength: 8,
    codeFormat: "alphanumeric",
    usageLimit: 1,
    expiresInHours: 168,
    isActive: true,
    metadata: {
      created_by: "admin",
      notes: ""
    }
  });

  // Detail form states
  const [detailForm, setDetailForm] = useState({
    code: "",
    email: ""
  });

  // Update form states
  const [updateForm, setUpdateForm] = useState({
    code: "",
    email: "",
    isActive: true
  });

  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAuth();
    if (activeTab === "list") {
      fetchAllCodes();
    }
  }, [activeTab, filterType]);

  const checkAdminAuth = () => {
    const loginData = JSON.parse(sessionStorage.getItem("userLogin") || "null");
    if (!loginData || !loginData.isLoggedIn) {
      navigate("/login");
      return;
    }
    // Add additional admin check here if needed
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 3000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleMetadataChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [name]: value
      }
    }));
  };

  // ==================== CREATE CODE ====================
  const handleCreateCode = async (e) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      showToast("Email harus diisi", "error");
      return;
    }

    if (!formData.purpose.trim()) {
      showToast("Purpose harus diisi", "error");
      return;
    }

    setLoading(true);

    try {
      const metadata = {
        ...formData.metadata,
        created_at: new Date().toISOString()
      };

      const response = await axios.post(
        "https://v2.jkt48connect.com/api/wotatokens/create",
        {
          email: formData.email.trim(),
          code_type: formData.codeType,
          purpose: formData.purpose.trim(),
          code_length: parseInt(formData.codeLength),
          code_format: formData.codeFormat,
          usage_limit: parseInt(formData.usageLimit),
          expires_in_hours: parseInt(formData.expiresInHours),
          metadata: metadata
        },
        {
          params: { apikey: "JKTCONNECT" }
        }
      );

      if (response.data.status) {
        const newCode = response.data.data;

        // Jika isActive false, update code
        if (!formData.isActive) {
          await axios.put(
            `https://v2.jkt48connect.com/api/wotatokens/update/${newCode.code}`,
            {
              email: formData.email.trim(),
              is_active: false,
              metadata: metadata
            },
            {
              params: { apikey: "JKTCONNECT" }
            }
          );
        }

        showToast(
          `Code berhasil dibuat: ${newCode.code}`,
          "success"
        );

        // Reset form
        setFormData({
          email: "",
          codeType: "custom",
          purpose: "",
          codeLength: 8,
          codeFormat: "alphanumeric",
          usageLimit: 1,
          expiresInHours: 168,
          isActive: true,
          metadata: {
            created_by: "admin",
            notes: ""
          }
        });
      } else {
        showToast(response.data.message || "Gagal membuat code", "error");
      }
    } catch (error) {
      console.error("Create code error:", error);
      showToast("Terjadi kesalahan saat membuat code", "error");
    } finally {
      setLoading(false);
    }
  };

  // ==================== FETCH ALL CODES ====================
  const fetchAllCodes = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "https://v2.jkt48connect.com/api/wotatokens/all",
        {
          params: { apikey: "JKTCONNECT" }
        }
      );

      if (response.data.status) {
        setStatistics(response.data.data.statistics);
        let codes = response.data.data.codes;

        // Apply filter
        if (filterType === "active") {
          codes = codes.filter((c) => c.is_active === true);
        } else if (filterType === "inactive") {
          codes = codes.filter((c) => c.is_active === false);
        } else if (filterType === "used") {
          codes = codes.filter((c) => c.is_used === true);
        } else if (filterType === "unused") {
          codes = codes.filter((c) => c.is_used === false);
        }

        // Apply search
        if (searchQuery.trim()) {
          codes = codes.filter(
            (c) =>
              c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
              c.purpose.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        setCodesList(codes);
      } else {
        showToast("Gagal mengambil data codes", "error");
      }
    } catch (error) {
      console.error("Fetch codes error:", error);
      showToast("Terjadi kesalahan saat mengambil data", "error");
    } finally {
      setLoading(false);
    }
  };

  // ==================== FETCH CODE DETAIL ====================
  const handleFetchDetail = async (e) => {
    e.preventDefault();

    if (!detailForm.code.trim() || !detailForm.email.trim()) {
      showToast("Code dan Email harus diisi", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(
        `https://v2.jkt48connect.com/api/wotatokens/detail/${detailForm.code}`,
        {
          params: {
            email: detailForm.email.trim(),
            apikey: "JKTCONNECT"
          }
        }
      );

      if (response.data.status) {
        setSelectedCode(response.data.data.code);
        setCodeHistory(response.data.data.usage_history || []);
        showToast("Detail code berhasil dimuat", "success");
      } else {
        showToast("Code tidak ditemukan atau email tidak cocok", "error");
        setSelectedCode(null);
        setCodeHistory([]);
      }
    } catch (error) {
      console.error("Fetch detail error:", error);
      showToast("Terjadi kesalahan saat mengambil detail", "error");
      setSelectedCode(null);
      setCodeHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // ==================== UPDATE CODE STATUS ====================
  const handleUpdateCode = async (e) => {
    e.preventDefault();

    if (!updateForm.code.trim() || !updateForm.email.trim()) {
      showToast("Code dan Email harus diisi", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(
        `https://v2.jkt48connect.com/api/wotatokens/update/${updateForm.code}`,
        {
          email: updateForm.email.trim(),
          is_active: updateForm.isActive
        },
        {
          params: { apikey: "JKTCONNECT" }
        }
      );

      if (response.data.status) {
        showToast(
          `Code berhasil di${updateForm.isActive ? "aktifkan" : "nonaktifkan"}`,
          "success"
        );
        setUpdateForm({
          code: "",
          email: "",
          isActive: true
        });
        if (activeTab === "list") {
          fetchAllCodes();
        }
      } else {
        showToast("Gagal mengupdate code", "error");
      }
    } catch (error) {
      console.error("Update code error:", error);
      showToast("Terjadi kesalahan saat mengupdate code", "error");
    } finally {
      setLoading(false);
    }
  };

  // ==================== DELETE CODE ====================
  const handleDeleteCode = async (code, email) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus code: ${code}?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.delete(
        `https://v2.jkt48connect.com/api/wotatokens/delete/${code}`,
        {
          data: { email: email },
          params: { apikey: "JKTCONNECT" }
        }
      );

      if (response.data.status) {
        showToast("Code berhasil dihapus", "success");
        fetchAllCodes();
      } else {
        showToast("Gagal menghapus code", "error");
      }
    } catch (error) {
      console.error("Delete code error:", error);
      showToast("Terjadi kesalahan saat menghapus code", "error");
    } finally {
      setLoading(false);
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCodes = codesList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(codesList.length / itemsPerPage);

  return (
    <div className="admin-container">
      {toast.show && (
        <div className={`toast toast-${toast.type}`}>
          <div className="toast-content">
            <div className="toast-icon">
              {toast.type === "success" ? "✅" : "❌"}
            </div>
            <span className="toast-message">{toast.message}</span>
          </div>
        </div>
      )}

      <div className="admin-panel">
        {/* Header */}
        <div className="panel-header">
          <div className="header-content">
            <div className="header-icon">
              <svg
                width="50"
                height="50"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <div>
              <h1>Admin Code Management</h1>
              <p>Kelola dan monitor semua code akses</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <button
            className={`tab-btn ${activeTab === "create" ? "active" : ""}`}
            onClick={() => setActiveTab("create")}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Create Code
          </button>
          <button
            className={`tab-btn ${activeTab === "list" ? "active" : ""}`}
            onClick={() => setActiveTab("list")}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
            List Codes
          </button>
          <button
            className={`tab-btn ${activeTab === "detail" ? "active" : ""}`}
            onClick={() => setActiveTab("detail")}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            Detail Code
          </button>
          <button
            className={`tab-btn ${activeTab === "update" ? "active" : ""}`}
            onClick={() => setActiveTab("update")}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Update Status
          </button>
        </div>

        {/* Content */}
        <div className="panel-content">
          {/* CREATE TAB */}
          {activeTab === "create" && (
            <div className="create-section">
              <div className="section-header">
                <h2>Create New Code</h2>
                <p>Buat code baru dengan konfigurasi custom</p>
              </div>

              <form onSubmit={handleCreateCode} className="admin-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="user@example.com"
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Purpose</label>
                    <input
                      type="text"
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleInputChange}
                      placeholder="Contoh: Membership Premium"
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Code Type</label>
                    <select
                      name="codeType"
                      value={formData.codeType}
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      <option value="custom">Custom</option>
                      <option value="show">Show</option>
                      <option value="membership">Membership</option>
                      <option value="special">Special</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Code Format</label>
                    <select
                      name="codeFormat"
                      value={formData.codeFormat}
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      <option value="alphanumeric">Alphanumeric</option>
                      <option value="numeric">Numeric Only</option>
                      <option value="alpha">Alpha Only</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Code Length</label>
                    <input
                      type="number"
                      name="codeLength"
                      value={formData.codeLength}
                      onChange={handleInputChange}
                      min="6"
                      max="20"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Usage Limit</label>
                    <input
                      type="number"
                      name="usageLimit"
                      value={formData.usageLimit}
                      onChange={handleInputChange}
                      min="1"
                      max="9999"
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Expires In (Hours)</label>
                    <input
                      type="number"
                      name="expiresInHours"
                      value={formData.expiresInHours}
                      onChange={handleInputChange}
                      min="1"
                      max="8760"
                      className="form-input"
                    />
                    <small className="form-hint">
                      168 hours = 7 days, 720 hours = 30 days
                    </small>
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <div className="checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleInputChange}
                        />
                        <span>Active (Code langsung dapat digunakan)</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Notes (Optional)</label>
                  <textarea
                    name="notes"
                    value={formData.metadata.notes}
                    onChange={handleMetadataChange}
                    placeholder="Catatan tambahan tentang code ini..."
                    className="form-input"
                    rows="3"
                    style={{ color: '#333' }}
                  ></textarea>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Create Code"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() =>
                      setFormData({
                        email: "",
                        codeType: "custom",
                        purpose: "",
                        codeLength: 8,
                        codeFormat: "alphanumeric",
                        usageLimit: 1,
                        expiresInHours: 168,
                        isActive: true,
                        metadata: {
                          created_by: "admin",
                          notes: ""
                        }
                      })
                    }
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* LIST TAB */}
          {activeTab === "list" && (
            <div className="list-section">
              <div className="section-header">
                <h2>All Codes</h2>
                <p>Daftar semua code yang telah dibuat</p>
              </div>

              {/* Statistics */}
              {statistics && (
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon blue">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{statistics.total_codes}</div>
                      <div className="stat-label">Total Codes</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon green">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{statistics.active_codes}</div>
                      <div className="stat-label">Active</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon purple">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                      </svg>
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{statistics.used_codes}</div>
                      <div className="stat-label">Used</div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon red">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                    </div>
                    <div className="stat-content">
                      <div className="stat-value">{statistics.expired_codes}</div>
                      <div className="stat-label">Expired</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Filters */}
              <div className="filters-bar">
                <div className="search-box">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by code, email, or purpose..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>

                <div className="filter-buttons">
                  <button
                    className={`filter-btn ${filterType === "all" ? "active" : ""}`}
                    onClick={() => {
                      setFilterType("all");
                      setCurrentPage(1);
                    }}
                  >
                    All
                  </button>
                  <button
                    className={`filter-btn ${filterType === "active" ? "active" : ""}`}
                    onClick={() => {
                      setFilterType("active");
                      setCurrentPage(1);
                    }}
                  >
                    Active
                  </button>
                  <button
                    className={`filter-btn ${filterType === "inactive" ? "active" : ""}`}
                    onClick={() => {
                      setFilterType("inactive");
                      setCurrentPage(1);
                    }}
                  >
                    Inactive
                  </button>
                  <button
                    className={`filter-btn ${filterType === "used" ? "active" : ""}`}
                    onClick={() => {
                      setFilterType("used");
                      setCurrentPage(1);
                    }}
                  >
                    Used
                  </button>
                  <button
                    className={`filter-btn ${filterType === "unused" ? "active" : ""}`}
                    onClick={() => {
                      setFilterType("unused");
                      setCurrentPage(1);
                    }}
                  >
                    Unused
                  </button>
                </div>

                <button className="btn btn-primary" onClick={fetchAllCodes}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                  </svg>
                  Refresh
                </button>
              </div>

              {/* Table */}
              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading codes...</p>
                </div>
              ) : currentCodes.length === 0 ? (
                <div className="empty-state">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                  <h3>No Codes Found</h3>
                  <p>Tidak ada code yang sesuai dengan filter</p>
                </div>
              ) : (
                <>
                  <div className="table-container">
                    <table className="codes-table">
                      <thead>
                        <tr>
                          <th>Code</th>
                          <th>Email</th>
                          <th>Type</th>
                          <th>Purpose</th>
                          <th>Usage</th>
                          <th>Status</th>
                          <th>Expires</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentCodes.map((code) => (
                          <tr key={code.id}>
                            <td>
                              <code className="code-value">{code.code}</code>
                            </td>
                            <td>{code.email}</td>
                            <td>
                              <span className="badge badge-info">{code.code_type}</span>
                            </td>
                            <td>{code.purpose}</td>
                            <td>
                              {code.usage_count}/{code.usage_limit}
                            </td>
                            <td>
                              <div className="status-badges">
                                {code.is_active ? (
                                  <span className="badge badge-success">Active</span>
                                ) : (
                                  <span className="badge badge-danger">Inactive</span>
                                )}
                                {code.is_used && (
                                  <span className="badge badge-warning">Used</span>
                                )}
                              </div>
                            </td>
                            <td>
                              {new Date(code.expires_at).toLocaleDateString("id-ID")}
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="action-btn delete"
                                  onClick={() => handleDeleteCode(code.code, code.email)}
                                  title="Delete"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="pagination">
                      <button
                        className="page-btn"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                      <span className="page-info">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        className="page-btn"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* DETAIL TAB */}
          {activeTab === "detail" && (
            <div className="detail-section">
              <div className="section-header">
                <h2>Code Detail</h2>
                <p>Lihat detail lengkap dari code tertentu</p>
              </div>

              <form onSubmit={handleFetchDetail} className="detail-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Code</label>
                    <input
                      type="text"
                      value={detailForm.code}
                      onChange={(e) =>
                        setDetailForm({ ...detailForm, code: e.target.value })
                      }
                      placeholder="ABC123XY"
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={detailForm.email}
                      onChange={(e) =>
                        setDetailForm({ ...detailForm, email: e.target.value })
                      }
                      placeholder="user@example.com"
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Loading..." : "Fetch Detail"}
                </button>
              </form>

              {selectedCode && (
                <div className="code-detail-card">
                  <div className="detail-header">
                    <h3>Code Information</h3>
                    <code className="code-value large">{selectedCode.code}</code>
                  </div>

                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Email</label>
                      <div className="detail-value">{selectedCode.email}</div>
                    </div>
                    <div className="detail-item">
                      <label>Type</label>
                      <div className="detail-value">
                        <span className="badge badge-info">{selectedCode.code_type}</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <label>Purpose</label>
                      <div className="detail-value">{selectedCode.purpose}</div>
                    </div>
                    <div className="detail-item">
                      <label>Usage</label>
                      <div className="detail-value">
                        {selectedCode.usage_count}/{selectedCode.usage_limit}
                      </div>
                    </div>
                    <div className="detail-item">
                      <label>Status</label>
                      <div className="detail-value">
                        {selectedCode.is_active ? (
                          <span className="badge badge-success">Active</span>
                        ) : (
                          <span className="badge badge-danger">Inactive</span>
                        )}
                      </div>
                    </div>
                    <div className="detail-item">
                      <label>Used</label>
                      <div className="detail-value">
                        {selectedCode.is_used ? (
                          <span className="badge badge-warning">Yes</span>
                        ) : (
                          <span className="badge badge-secondary">No</span>
                        )}
                      </div>
                    </div>
                    <div className="detail-item">
                      <label>Created At</label>
                      <div className="detail-value">{new Date(selectedCode.created_at).toLocaleString("id-ID")}</div>
                    </div>
                    <div className="detail-item">
                      <label>Updated At</label>
                      <div className="detail-value">{new Date(selectedCode.updated_at).toLocaleString("id-ID")}</div>
                    </div>
                    <div className="detail-item">
                      <label>Expires At</label>
                      <div className="detail-value">{new Date(selectedCode.expires_at).toLocaleString("id-ID")}</div>
                    </div>
                    {selectedCode.last_used_at && (
                      <div className="detail-item">
                        <label>Last Used</label>
                        <div className="detail-value">
                          {new Date(selectedCode.last_used_at).toLocaleString("id-ID")}
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedCode.metadata && (
                    <div className="metadata-section">
                      <h4>Metadata</h4>
                      <pre className="metadata-content">
                        {JSON.stringify(
                          typeof selectedCode.metadata === "string"
                            ? JSON.parse(selectedCode.metadata)
                            : selectedCode.metadata,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}

                  {codeHistory.length > 0 && (
                    <div className="history-section">
                      <h4>Usage History</h4>
                      <div className="history-list">
                        {codeHistory.map((history, idx) => (
                          <div key={idx} className="history-item">
                            <div className="history-header">
                              <span className="history-action">{history.action.toUpperCase()}</span>
                              <span className={`history-status ${history.status}`}>
                                {history.status}
                              </span>
                            </div>
                            <div className="history-details">
                              <div>
                                <strong>Time:</strong> {new Date(history.created_at).toLocaleString("id-ID")}
                              </div>
                              <div>
                                <strong>IP:</strong> {history.ip_address || "N/A"}
                              </div>
                              {history.error_message && (
                                <div>
                                  <strong>Error:</strong> {history.error_message}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* UPDATE TAB */}
          {activeTab === "update" && (
            <div className="update-section">
              <div className="section-header">
                <h2>Update Code Status</h2>
                <p>Aktifkan atau nonaktifkan code</p>
              </div>

              <form onSubmit={handleUpdateCode} className="update-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Code</label>
                    <input
                      type="text"
                      value={updateForm.code}
                      onChange={(e) =>
                        setUpdateForm({ ...updateForm, code: e.target.value })
                      }
                      placeholder="ABC123XY"
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={updateForm.email}
                      onChange={(e) =>
                        setUpdateForm({ ...updateForm, email: e.target.value })
                      }
                      placeholder="user@example.com"
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        checked={updateForm.isActive === true}
                        onChange={() =>
                          setUpdateForm({ ...updateForm, isActive: true })
                        }
                      />
                      <span>Activate Code</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        checked={updateForm.isActive === false}
                        onChange={() =>
                          setUpdateForm({ ...updateForm, isActive: false })
                        }
                      />
                      <span>Deactivate Code</span>
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Updating..." : "Update Status"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() =>
                      setUpdateForm({ code: "", email: "", isActive: true })
                    }
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .admin-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #e8eef3 100%);
          padding: 20px;
        }

        .admin-panel {
          max-width: 1400px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }

        .panel-header {
          background: linear-gradient(135deg, #4a6fa5 0%, #3d5a8c 100%);
          color: white;
          padding: 40px;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .header-icon {
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .panel-header h1 {
          margin: 0 0 8px 0;
          font-size: 2rem;
          font-weight: 700;
        }

        .panel-header p {
          margin: 0;
          opacity: 0.9;
          font-size: 1.05rem;
        }

        .tabs-container {
          display: flex;
          background: #f8f9fa;
          border-bottom: 2px solid #e1e5e9;
          padding: 0 20px;
          overflow-x: auto;
        }

        .tab-btn {
          padding: 18px 24px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          color: #666;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .tab-btn:hover {
          color: #4a6fa5;
          background: rgba(74, 111, 165, 0.05);
        }

        .tab-btn.active {
          color: #4a6fa5;
          border-bottom-color: #4a6fa5;
          background: white;
        }

        .panel-content {
          padding: 40px;
        }

        .section-header {
          margin-bottom: 30px;
        }

        .section-header h2 {
          margin: 0 0 8px 0;
          font-size: 1.5rem;
          color: #333;
        }

        .section-header p {
          margin: 0;
          color: #666;
          font-size: 0.95rem;
        }

        .admin-form,
        .detail-form,
        .update-form {
          background: #f8f9fa;
          padding: 30px;
          border-radius: 16px;
          border: 2px solid #e1e5e9;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
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
        }

        .form-input {
          padding: 12px 16px;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 15px;
          transition: all 0.3s ease;
          background: white;
          color: #333;
        }

        select.form-input,
        textarea.form-input {
          color: #333;
        }

        .form-input::placeholder {
          color: #999;
          opacity: 1;
        }

        .form-input:focus {
          outline: none;
          border-color: #4a6fa5;
          box-shadow: 0 0 0 3px rgba(74, 111, 165, 0.1);
        }

        .form-hint {
          color: #666;
          font-size: 13px;
          font-style: italic;
        }

        .checkbox-group,
        .radio-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .checkbox-label,
        .radio-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-size: 15px;
          color: #333;
        }

        .checkbox-label input,
        .radio-label input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: linear-gradient(135deg, #4a6fa5 0%, #3d5a8c 100%);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(74, 111, 165, 0.4);
        }

        .btn-outline {
          background: white;
          border: 2px solid #4a6fa5;
          color: #4a6fa5;
        }

        .btn-outline:hover:not(:disabled) {
          background: #4a6fa5;
          color: white;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          border: 2px solid #e1e5e9;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
        }

        .stat-icon {
          width: 50px;
          height: 50px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .stat-icon.blue { background: linear-gradient(135deg, #4a6fa5, #5581c1); }
        .stat-icon.green { background: linear-gradient(135deg, #28a745, #34ce57); }
        .stat-icon.purple { background: linear-gradient(135deg, #6f42c1, #8e5dd9); }
        .stat-icon.red { background: linear-gradient(135deg, #dc3545, #f04757); }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #333;
          line-height: 1;
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 0.9rem;
          color: #666;
        }

        .filters-bar {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .search-box {
          flex: 1;
          min-width: 250px;
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-box svg {
          position: absolute;
          left: 14px;
          color: #666;
        }

        .search-box input {
          width: 100%;
          padding: 12px 16px 12px 44px;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 15px;
          color: #333;
        }

        .search-box input:focus {
          outline: none;
          border-color: #4a6fa5;
        }

        .filter-buttons {
          display: flex;
          gap: 8px;
        }

        .filter-btn {
          padding: 10px 18px;
          background: white;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #666;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .filter-btn:hover {
          border-color: #4a6fa5;
          color: #4a6fa5;
        }

        .filter-btn.active {
          background: #4a6fa5;
          border-color: #4a6fa5;
          color: white;
        }

        .table-container {
          overflow-x: auto;
          border-radius: 12px;
          border: 2px solid #e1e5e9;
        }

        .codes-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
        }

        .codes-table th {
          background: #f8f9fa;
          padding: 16px;
          text-align: left;
          font-weight: 600;
          color: #333;
          font-size: 14px;
          border-bottom: 2px solid #e1e5e9;
        }

        .codes-table td {
          padding: 16px;
          border-bottom: 1px solid #f0f0f0;
          font-size: 14px;
        }

        .codes-table tr:hover {
          background: #f8f9fa;
        }

        .code-value {
          background: #f0f4f8;
          padding: 6px 12px;
          border-radius: 6px;
          font-family: 'Courier New', monospace;
          font-weight: 600;
          color: #4a6fa5;
          font-size: 13px;
        }

        .code-value.large {
          font-size: 16px;
          padding: 8px 16px;
        }

        .badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          line-height: 1;
        }

        .badge-info { background: #e3f2fd; color: #1976d2; }
        .badge-success { background: #e8f5e9; color: #2e7d32; }
        .badge-danger { background: #ffebee; color: #c62828; }
        .badge-warning { background: #fff3e0; color: #ef6c00; }
        .badge-secondary { background: #f5f5f5; color: #616161; }

        .status-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .action-btn.delete {
          background: #ffebee;
          color: #c62828;
        }

        .action-btn.delete:hover {
          background: #c62828;
          color: white;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-top: 24px;
        }

        .page-btn {
          padding: 10px 20px;
          background: white;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #333;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .page-btn:hover:not(:disabled) {
          border-color: #4a6fa5;
          color: #4a6fa5;
        }

        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-info {
          font-size: 14px;
          font-weight: 600;
          color: #666;
        }

        .loading-state,
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f0f0f0;
          border-top: 4px solid #4a6fa5;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .empty-state svg {
          color: #ccc;
          margin-bottom: 20px;
        }

        .empty-state h3 {
          margin: 0 0 8px 0;
          font-size: 1.3rem;
          color: #333;
        }

        .empty-state p {
          margin: 0;
          color: #666;
        }

        .code-detail-card {
          background: white;
          border: 2px solid #e1e5e9;
          border-radius: 16px;
          padding: 30px;
          margin-top: 24px;
        }

        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e1e5e9;
        }

        .detail-header h3 {
          margin: 0;
          font-size: 1.3rem;
          color: #333;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .detail-item label {
          font-size: 13px;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-value {
          font-size: 15px;
          color: #333;
          font-weight: 500;
        }

        .metadata-section,
        .history-section {
          margin-top: 30px;
          padding-top: 30px;
          border-top: 2px solid #e1e5e9;
        }

        .metadata-section h4,
        .history-section h4 {
          margin: 0 0 16px 0;
          font-size: 1.1rem;
          color: #333;
        }

        .metadata-content {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          overflow-x: auto;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.6;
          color: #333;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .history-item {
          background: #f8f9fa;
          border: 1px solid #e1e5e9;
          border-radius: 8px;
          padding: 16px;
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .history-action {
          font-weight: 700;
          color: #4a6fa5;
          font-size: 14px;
        }

        .history-status {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }

        .history-status.success {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .history-status.failed {
          background: #ffebee;
          color: #c62828;
        }

        .history-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
          color: #666;
        }

        .toast {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 1000;
          max-width: 420px;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          animation: slideInRight 0.4s ease;
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .toast-success {
          background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
          border: 2px solid #b1dfbb;
          color: #155724;
        }

        .toast-error {
          background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
          border: 2px solid #f1b0b7;
          color: #721c24;
        }

        .toast-content {
          display: flex;
          align-items: center;
          padding: 16px 20px;
          gap: 14px;
        }

        .toast-icon {
          font-size: 24px;
        }

        .toast-message {
          font-weight: 600;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .admin-container {
            padding: 10px;
          }

          .panel-header {
            padding: 30px 20px;
          }

          .header-content {
            flex-direction: column;
            text-align: center;
          }

          .panel-header h1 {
            font-size: 1.5rem;
          }

          .panel-content {
            padding: 20px;
          }

          .tabs-container {
            padding: 0 10px;
          }

          .tab-btn {
            padding: 14px 16px;
            font-size: 14px;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .filters-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .search-box {
            width: 100%;
          }

          .filter-buttons {
            flex-wrap: wrap;
          }

          .table-container {
            font-size: 12px;
          }

          .codes-table th,
          .codes-table td {
            padding: 12px 8px;
          }

          .toast {
            left: 10px;
            right: 10px;
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
}

export default AdminCodeManagement;