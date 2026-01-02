import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MuxPlayer from "@mux/mux-player-react";
import "../styles/live-stream.css";

function Replay() {
  const { playbackId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [streamData, setStreamData] = useState(null);
  const [accessGranted, setAccessGranted] = useState(false);

  // Fungsi untuk mengecek apakah membership sudah expired
  const isMembershipExpired = (registeredDate, membershipType) => {
    try {
      const now = new Date();
      const regDate = new Date(registeredDate);

      if (isNaN(regDate.getTime())) {
        console.error("Invalid date format:", registeredDate);
        return true; // Anggap expired jika date invalid
      }

      const type = (membershipType || "monthly").toLowerCase();

      // Hitung tanggal expiry berdasarkan type
      let expiryDate = new Date(regDate);

      if (type === "weekly" || type === "mingguan") {
        expiryDate.setDate(expiryDate.getDate() + 7);
      } else if (type === "monthly" || type === "bulanan") {
        expiryDate.setMonth(expiryDate.getMonth() + 1);
      } else if (type === "yearly" || type === "tahunan") {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      }

      console.log("Registered:", regDate);
      console.log("Expiry:", expiryDate);
      console.log("Now:", now);
      console.log("Is Expired:", now > expiryDate);

      return now > expiryDate;
    } catch (error) {
      console.error("Error checking expiry:", error);
      return true;
    }
  };

  // Fungsi untuk mendapatkan sisa hari membership
  const getRemainingDays = (registeredDate, membershipType) => {
    try {
      const now = new Date();
      const regDate = new Date(registeredDate);

      if (isNaN(regDate.getTime())) {
        return "Tidak diketahui";
      }

      const type = (membershipType || "monthly").toLowerCase();
      let expiryDate = new Date(regDate);

      if (type === "weekly" || type === "mingguan") {
        expiryDate.setDate(expiryDate.getDate() + 7);
      } else if (type === "monthly" || type === "bulanan") {
        expiryDate.setMonth(expiryDate.getMonth() + 1);
      } else if (type === "yearly" || type === "tahunan") {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      }

      const diffTime = expiryDate - now;
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (daysLeft <= 0) {
        return "Sudah Expired";
      }

      return `${daysLeft} hari lagi`;
    } catch (error) {
      console.error("Error calculating remaining days:", error);
      return "Tidak diketahui";
    }
  };

  // Fungsi untuk mendapatkan display membership type
  const getMembershipTypeDisplay = (type) => {
    const typeStr = (type || "monthly").toLowerCase();
    if (typeStr === "weekly" || typeStr === "mingguan") {
      return "⭐ Mingguan";
    } else if (typeStr === "monthly" || typeStr === "bulanan") {
      return "💎 Bulanan";
    } else if (typeStr === "yearly" || typeStr === "tahunan") {
      return "👑 Tahunan";
    }
    return type;
  };

  useEffect(() => {
    const checkAccess = () => {
      try {
        // Cek apakah ada playback ID
        if (!playbackId) {
          setError("Playback ID tidak ditemukan");
          setLoading(false);
          return;
        }

        // Ambil data membership dari localStorage
        const verifiedUserStr = localStorage.getItem("jkt48_verified_user");

        if (!verifiedUserStr) {
          setError(
            "Anda belum memiliki membership aktif. Silakan verifikasi terlebih dahulu."
          );
          setAccessGranted(false);
          setLoading(false);
          return;
        }

        let userData;
        try {
          userData = JSON.parse(verifiedUserStr);
        } catch (parseError) {
          console.error("Error parsing userData:", parseError);
          setError("Data membership tidak valid");
          setAccessGranted(false);
          setLoading(false);
          return;
        }

        console.log("User data loaded:", userData);

        // Validasi minimal: hanya perlu token, membershipType, dan tanggal registrasi
        if (!userData.token) {
          setError("Token tidak ditemukan. Silakan verifikasi ulang.");
          setAccessGranted(false);
          setLoading(false);
          return;
        }

        if (!userData.membership_type && !userData.membershipType) {
          setError("Tipe membership tidak ditemukan.");
          setAccessGranted(false);
          setLoading(false);
          return;
        }

        // Ambil membershipType (prioritas camelCase karena data Anda menggunakan ini)
        const membershipType =
          userData.membershipType || userData.membership_type;

        // VALIDASI: HANYA MONTHLY YANG BISA AKSES REPLAY
        const typeStr = (membershipType || "monthly").toLowerCase();
        if (typeStr !== "monthly" && typeStr !== "bulanan") {
          setError(
            "Akses Replay hanya tersedia untuk membership Bulanan. Silakan upgrade membership Anda."
          );
          setAccessGranted(false);
          setLoading(false);
          return;
        }

        // Cari registered_date dari berbagai sumber yang mungkin
        let registeredDate =
          userData.registered_date || userData.registeredDate;
        if (
          !registeredDate &&
          userData.verifiedAt &&
          userData.verifiedAt.fullDate
        ) {
          registeredDate = userData.verifiedAt.fullDate;
        }

        if (!registeredDate) {
          setError("Data registrasi tidak ditemukan.");
          setAccessGranted(false);
          setLoading(false);
          return;
        }

        // CEK APAKAH SUDAH EXPIRED
        if (isMembershipExpired(registeredDate, membershipType)) {
          // Hapus data membership yang expired
          localStorage.removeItem("jkt48_verified_user");
          localStorage.removeItem("jkt48_auth_token");
          setError(
            "Membership Anda telah berakhir. Silakan perpanjang membership."
          );
          setAccessGranted(false);
          setLoading(false);
          return;
        }

        // Jika semua validasi lolos, berikan akses
        setAccessGranted(true);

        // Set stream data
        setTimeout(() => {
          setStreamData({
            playbackId: playbackId,
            title: "Replay Live Stream JKT48",
            viewerId: userData.token,
            membershipType: getMembershipTypeDisplay(membershipType),
            remainingTime: getRemainingDays(registeredDate, membershipType),
            email: userData.email || "user@jkt48connect.com",
          });
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error("Error checking access:", error);
        setError("Terjadi kesalahan saat memeriksa akses. Silakan coba lagi.");
        setAccessGranted(false);
        setLoading(false);
      }
    };

    checkAccess();
  }, [playbackId]);

  const goBack = () => {
    navigate(-1);
  };

  const goToUpgrade = () => {
    window.open("https://forms.gle/iqbdVfb4ySwX8snc8", "_blank");
  };

  if (loading) {
    return (
      <div className="stream-container">
        <div className="stream-loading">
          <div className="loading-spinner"></div>
          <p>Memuat replay...</p>
        </div>
      </div>
    );
  }

  if (error || !accessGranted || !streamData) {
    return (
      <div className="stream-container">
        <div className="error-container">
          <div className="error-icon">🔒</div>
          <h2>Akses Ditolak</h2>
          <p>{error || "Anda tidak memiliki akses ke replay ini"}</p>
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "20px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button className="btn btn-primary" onClick={goToUpgrade}>
              Upgrade ke Membership Bulanan
            </button>
            <button className="btn btn-back" onClick={goBack}>
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stream-container">
      <div className="stream-wrapper">
        <div className="stream-header">
          <button className="btn-back" onClick={goBack}>
            <span className="back-icon">←</span>
            <span>Kembali</span>
          </button>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              fontSize: "12px",
              color: "rgba(255, 255, 255, 0.7)",
            }}
          >
            <span>Membership: {streamData.membershipType}</span>
            <span>Berlaku: {streamData.remainingTime}</span>
          </div>
        </div>

        <div className="player-container">
          <MuxPlayer
            playbackId={streamData.playbackId}
            metadata={{
              video_id: streamData.playbackId,
              video_title: streamData.title,
              viewer_user_id: streamData.viewerId,
            }}
            streamType="on-demand"
          />
        </div>

        <div className="stream-footer">
          <div className="powered-by">
            <span>POWERED BY</span>
            <svg className="mux-logo" viewBox="0 0 200 60" fill="currentColor">
              <text
                x="10"
                y="40"
                fontSize="32"
                fontWeight="bold"
                fontFamily="Arial, sans-serif"
              >
                JKT48Connect
              </text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Replay;
