import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MuxPlayer from "@mux/mux-player-react";
import "../styles/live-stream.css";

function LiveStream() {
  const { playbackId } = useParams();
  const navigate = useNavigate();

  // State untuk verifikasi
  const [isVerified, setIsVerified] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationData, setVerificationData] = useState({
    email: "",
    code: "",
  });
  const [verificationError, setVerificationError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [clientIP, setClientIP] = useState("");

  // State untuk stream
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [streamData, setStreamData] = useState(null);
  const [showInfo, setShowInfo] = useState(null);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Fungsi untuk mendapatkan IP address client
  const fetchClientIP = async () => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      setClientIP(data.ip);
      return data.ip;
    } catch (error) {
      console.error("Error fetching IP:", error);
      return "unknown";
    }
  };

  // FIXED: Fungsi untuk verifikasi code dengan API
  const verifyAccess = async () => {
    if (!verificationData.email || !verificationData.code) {
      setVerificationError("Email dan code wajib diisi");
      return;
    }

    setVerifying(true);
    setVerificationError("");

    try {
      // Dapatkan IP client
      const ip = clientIP || (await fetchClientIP());

      console.log("Starting verification with:", {
        email: verificationData.email,
        code: verificationData.code,
        ip: ip,
      });

      // Step 1: Verifikasi code menggunakan API verify
      const verifyResponse = await fetch(
        "https://v2.jkt48connect.com/api/wotatokens/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: verificationData.email,
            code: verificationData.code,
            apikey: "JKTCONNECT",
          }),
        },
      );

      const verifyData = await verifyResponse.json();
      console.log("Verify response:", verifyData);

      if (!verifyData.status || !verifyData.data.is_valid) {
        setVerificationError(
          verifyData.message || "Code tidak valid atau sudah kedaluwarsa",
        );
        setVerifying(false);
        return;
      }

      // Step 2: Cek apakah code sudah digunakan dari verify response
      if (verifyData.data.is_used) {
        // Jika sudah digunakan, cek apakah IP sama
        const listResponse = await fetch(
          `https://v2.jkt48connect.com/api/wotatokens/list?email=${verificationData.email}&apikey=JKTCONNECT`,
        );
        const listData = await listResponse.json();

        if (listData.status && listData.data.wotatokens) {
          const userCode = listData.data.wotatokens.find(
            (c) => c.code === verificationData.code,
          );

          if (userCode) {
            // Cek IP address
            if (
              userCode.ip_address &&
              userCode.ip_address !== "" &&
              userCode.ip_address !== ip
            ) {
              setVerificationError(
                "Code ini sudah digunakan dari IP address yang berbeda",
              );
              setVerifying(false);
              return;
            }

            // Jika IP sama, izinkan akses (re-entry dari IP yang sama)
            localStorage.setItem(
              "stream_verification",
              JSON.stringify({
                email: verificationData.email,
                code: verificationData.code,
                ip: ip,
                timestamp: Date.now(),
              }),
            );

            setIsVerified(true);
            setShowVerification(false);
            setVerifying(false);
            return;
          }
        }

        setVerificationError("Code sudah digunakan");
        setVerifying(false);
        return;
      }

      // Step 3: Code belum digunakan, gunakan code
      console.log("Code is valid and not used, attempting to use...");

      const useResponse = await fetch(
        "https://v2.jkt48connect.com/api/wotatokens/use",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: verificationData.email,
            code: verificationData.code,
            apikey: "JKTCONNECT",
          }),
        },
      );

      const useData = await useResponse.json();
      console.log("Use response:", useData);

      if (useData.status) {
        // Berhasil menggunakan code
        localStorage.setItem(
          "stream_verification",
          JSON.stringify({
            email: verificationData.email,
            code: verificationData.code,
            ip: ip,
            timestamp: Date.now(),
          }),
        );

        setIsVerified(true);
        setShowVerification(false);
        setVerifying(false);
      } else {
        setVerificationError(useData.message || "Gagal menggunakan code");
        setVerifying(false);
      }
    } catch (error) {
      console.error("Error verifying access:", error);
      setVerificationError(
        "Terjadi kesalahan saat verifikasi. Silakan coba lagi.",
      );
      setVerifying(false);
    }
  };

  // Fungsi untuk cek verifikasi yang sudah ada
  const checkExistingVerification = async () => {
    const stored = localStorage.getItem("stream_verification");
    if (stored) {
      try {
        const verificationInfo = JSON.parse(stored);
        const ip = await fetchClientIP();

        // Cek apakah verifikasi masih valid (dalam 6 jam)
        const hoursDiff =
          (Date.now() - verificationInfo.timestamp) / (1000 * 60 * 60);
        if (hoursDiff > 6) {
          console.log("Verification expired (>6 hours)");
          localStorage.removeItem("stream_verification");
          setShowVerification(true);
          return false;
        }

        // Verifikasi ulang dengan API
        const verifyResponse = await fetch(
          "https://v2.jkt48connect.com/api/wotatokens/verify",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: verificationInfo.email,
              code: verificationInfo.code,
              apikey: "JKTCONNECT",
            }),
          },
        );

        const verifyData = await verifyResponse.json();

        // Cek apakah code masih valid dan IP masih sama
        if (
          verifyData.status &&
          verifyData.data.is_valid &&
          verificationInfo.ip === ip
        ) {
          setIsVerified(true);
          setShowVerification(false);
          setVerificationData({
            email: verificationInfo.email,
            code: verificationInfo.code,
          });
          return true;
        } else {
          console.log("Stored verification is no longer valid or IP changed");
          localStorage.removeItem("stream_verification");
          setShowVerification(true);
          return false;
        }
      } catch (error) {
        console.error("Error checking verification:", error);
        localStorage.removeItem("stream_verification");
        setShowVerification(true);
        return false;
      }
    }
    setShowVerification(true);
    return false;
  };

  // Fungsi untuk mendapatkan show terdekat dari API
  const fetchNearestShow = async () => {
    try {
      const response = await fetch(
        "https://v2.jkt48connect.com/api/jkt48/theater?apikey=JKTCONNECT",
      );
      const data = await response.json();

      if (data.theater && data.theater.length > 0) {
        const now = new Date();
        let nearestShow = null;
        let smallestDiff = Infinity;

        data.theater.forEach((show) => {
          const showDate = new Date(show.date);
          const diff = Math.abs(showDate - now);
          if (diff < smallestDiff) {
            smallestDiff = diff;
            nearestShow = show;
          }
        });

        return nearestShow;
      }
      return null;
    } catch (error) {
      console.error("Error fetching show data:", error);
      return null;
    }
  };

  // Fungsi untuk mendapatkan lineup member dari API
  const fetchShowMembers = async (showId) => {
    try {
      setLoadingMembers(true);
      const response = await fetch(
        `https://v2.jkt48connect.com/api/jkt48/theater/${showId}?apikey=JKTCONNECT`,
      );
      const data = await response.json();

      if (data.shows && data.shows.length > 0 && data.shows[0].members) {
        setMembers(data.shows[0].members);
      }
      setLoadingMembers(false);
    } catch (error) {
      console.error("Error fetching members:", error);
      setLoadingMembers(false);
    }
  };

  // Effect untuk inisialisasi
  useEffect(() => {
    const init = async () => {
      await fetchClientIP();
      const verified = await checkExistingVerification();

      if (verified) {
        loadStreamData();
      } else {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Effect untuk load stream data setelah verifikasi
  useEffect(() => {
    if (isVerified) {
      loadStreamData();
    }
  }, [isVerified]);

  const loadStreamData = async () => {
    try {
      setLoading(true);

      if (!playbackId) {
        setError("Playback ID tidak ditemukan");
        setLoading(false);
        return;
      }

      const nearestShow = await fetchNearestShow();
      if (nearestShow) {
        setShowInfo({
          title: nearestShow.title,
          showId: nearestShow.id,
        });
        await fetchShowMembers(nearestShow.id);
      }

      setTimeout(() => {
        setStreamData({
          playbackId: playbackId,
          title: nearestShow ? nearestShow.title : "Live Stream JKT48",
          viewerId: "viewer-" + Date.now(),
        });
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error("Error loading stream:", error);
      setError("Terjadi kesalahan saat memuat stream. Silakan coba lagi.");
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVerificationData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setVerificationError("");
  };

  const handleVerificationSubmit = (e) => {
    e.preventDefault();
    verifyAccess();
  };

  const goBack = () => {
    navigate(-1);
  };

  const handleLogout = () => {
    localStorage.removeItem("stream_verification");
    setIsVerified(false);
    setShowVerification(true);
    setVerificationData({ email: "", code: "" });
  };

  // Tampilan Verifikasi
  if (showVerification && !isVerified) {
    return (
      <div className="stream-container">
        <div className="stream-background">
          <img src="https://jkt48.com/images/og-image.jpg" alt="background" />
          <div className="background-overlay"></div>
        </div>

        <div className="verification-container">
          <div className="verification-card">
            <div className="verification-header">
              <h1 className="verification-title">Verifikasi Akses</h1>
              <p className="verification-subtitle">
                Masukkan email dan code untuk mengakses live stream
              </p>
            </div>

            <form
              onSubmit={handleVerificationSubmit}
              className="verification-form"
            >
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-input"
                  placeholder="masukkan email anda"
                  value={verificationData.email}
                  onChange={handleInputChange}
                  required
                  disabled={verifying}
                />
              </div>

              <div className="form-group">
                <label htmlFor="code" className="form-label">
                  Verification Code
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  className="form-input"
                  placeholder="masukkan code verifikasi"
                  value={verificationData.code}
                  onChange={handleInputChange}
                  required
                  disabled={verifying}
                  style={{ textTransform: "uppercase" }}
                />
              </div>

              {verificationError && (
                <div className="verification-error">
                  <span className="error-icon">⚠️</span>
                  {verificationError}
                </div>
              )}

              <button type="submit" className="btn-verify" disabled={verifying}>
                {verifying ? (
                  <>
                    <div className="loading-spinner-small"></div>
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    Verifikasi Akses
                  </>
                )}
              </button>

              <div className="verification-info">
                <p>
                  <strong>ℹ Informasi:</strong>
                </p>
                <ul>
                  <li>Code verifikasi hanya dapat digunakan sekali</li>
                  <li>IP address akan dicatat untuk keamanan</li>
                  <li>Akses berlaku selama 6 jam</li>
                </ul>
              </div>
            </form>

            <button onClick={goBack} className="btn-back-verification">
              ← Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tampilan Loading
  if (loading) {
    return (
      <div className="stream-container">
        <div className="stream-background">
          <img src="https://jkt48.com/images/logo.svg" alt="background" />
          <div className="background-overlay"></div>
        </div>
        <div className="stream-loading">
          <div className="loading-spinner"></div>
          <p>Memuat live stream...</p>
          <p className="loading-subtitle">Mengambil informasi show...</p>
        </div>
      </div>
    );
  }

  // Tampilan Error
  if (error || !streamData) {
    return (
      <div className="stream-container">
        <div className="stream-background">
          <img src="https://jkt48.com/images/og-image.jpg" alt="background" />
          <div className="background-overlay"></div>
        </div>
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Terjadi Kesalahan</h2>
          <p>{error || "Tidak dapat memuat live stream"}</p>
          <div className="error-actions">
            <button onClick={goBack} className="btn btn-back">
              ← Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tampilan Stream (setelah verifikasi berhasil)
  return (
    <div className="stream-container">
      <div className="stream-background">
        <img src="https://jkt48.com/images/logo.svg" alt="background" />
        <div className="background-overlay"></div>
      </div>

      <div className="stream-wrapper">
        {/* Header */}
        <div className="stream-header">
          <button onClick={goBack} className="btn-back">
            <span className="back-icon">←</span>
            Kembali
          </button>

          <div className="header-center">
            {showInfo && <h1 className="stream-title">{showInfo.title}</h1>}
          </div>

          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>

        {/* Player Container */}
        <div className="player-container">
          <div className="player-wrapper">
            <MuxPlayer
              streamType="live"
              playbackId={streamData.playbackId}
              metadata={{
                video_title: streamData.title,
                viewer_user_id: streamData.viewerId,
              }}
              autoPlay
              muted={false}
              primaryColor="#e50914"
              secondaryColor="#ffffff"
            />
          </div>
        </div>

        {/* Lineup Members Section */}
        {members.length > 0 && (
          <div className="lineup-section">
            <div className="lineup-container">
              <div className="lineup-header">
                <h2 className="lineup-title">
                  <span className="lineup-icon">👥</span>
                  Lineup Show
                </h2>
                <div className="lineup-count">{members.length} Member</div>
              </div>

              {loadingMembers ? (
                <div className="lineup-loading">
                  <div className="loading-spinner-small"></div>
                  <p>Memuat lineup...</p>
                </div>
              ) : (
                <div className="members-grid">
                  {members.map((member) => (
                    <div key={member.id} className="member-card">
                      <div className="member-avatar-wrapper">
                        <img
                          src={member.img}
                          alt={member.name}
                          className="member-avatar-img"
                        />
                      </div>
                      <div className="member-info">
                        <p className="member-name">{member.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="stream-footer">
          <div className="powered-by">
            <span className="powered-text">POWERED BY</span>
            <span className="brand-name">JKT48Connect</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveStream;
