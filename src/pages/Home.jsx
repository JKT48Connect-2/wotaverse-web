import { useEffect, useState } from "react";
import "../styles/carousel.css";
import "../styles/liveShow.css";

function Home() {
  const [loading, setLoading] = useState(true);
  const [currentBanner, setCurrentBanner] = useState(0);

  // Banner images array
  const bannerImages = [
    "https://res.cloudinary.com/haymzm4wp/image/upload/v1760105848/bi5ej2hgh0cc2uowu5xr.jpg",
    "https://res.cloudinary.com/haymzm4wp/image/upload/v1709811057/hjsfgaw0kf3fhxg677fs.jpg",
    "https://res.cloudinary.com/haymzm4wp/image/upload/v1709811568/hm6aztwojrngb6ryrdn9.png",
    "https://res.cloudinary.com/haymzm4wp/image/upload/v1746940686/gnzangtum7a8ygmk8hvj.jpg",
    "https://res.cloudinary.com/haymzm4wp/image/upload/v1746940449/zjdka1gtuuoc5gx9kkco.jpg",
  ];

  // Combined products data - All orders in one section
  const allProducts = [
    {
      id: 1,
      name: "Show Mingguan",
      price: 15000,
      image_url: ["https://files.catbox.moe/0cswhe.jpg"],
      custom_url: "https://forms.gle/JgoWTNXsdDzGg1gL9",
      category: "weekly",
      description: "Weekly Show Access",
    },
    {
      id: 3,
      name: "Membership Stream - Bulanan",
      price: 25000,
      image_url: ["https://files.catbox.moe/qjz93c.jpg"],
      custom_url: "https://forms.gle/iqbdVfb4ySwX8snc8",
      category: "monthly",
      description: "Monthly Membership",
    },     

  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Auto-slide banner every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % bannerImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [bannerImages.length]);

  // Navigate to specific banner
  const goToBanner = (index) => {
    setCurrentBanner(index);
  };

  // Navigate to previous banner
  const prevBanner = () => {
    setCurrentBanner((prev) =>
      prev === 0 ? bannerImages.length - 1 : prev - 1
    );
  };

  // Navigate to next banner
  const nextBanner = () => {
    setCurrentBanner((prev) => (prev + 1) % bannerImages.length);
  };

  return (
    <div className="container">
      {/* Banner Carousel */}
      <div className="banner-carousel">
        <div className="carousel-container">
          {bannerImages.map((img, index) => (
            <div
              key={index}
              className={`carousel-slide ${
                index === currentBanner ? "active" : ""
              }`}
            >
              <img src={img} alt={`Banner ${index + 1}`} />
            </div>
          ))}

          {/* Navigation Arrows */}
          <button
            className="carousel-arrow carousel-arrow-left"
            onClick={prevBanner}
            aria-label="Previous banner"
          >
            ‹
          </button>
          <button
            className="carousel-arrow carousel-arrow-right"
            onClick={nextBanner}
            aria-label="Next banner"
          >
            ›
          </button>

          {/* Dots Indicator */}
          <div className="carousel-dots">
            {bannerImages.map((_, index) => (
              <button
                key={index}
                className={`carousel-dot ${
                  index === currentBanner ? "active" : ""
                }`}
                onClick={() => goToBanner(index)}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Order Here Section - Combined Products */}
      <OrderSection loading={loading} products={allProducts} />

      {/* Live Show Section */}
      <LiveShowSection loading={loading} />

      {/* Replay Show Section */}
      <ReplayShowSection loading={loading} />
    </div>
  );
}

// Order Section Component - New unified component
function OrderSection({ loading, products }) {
  const productCount = products.length;

  if (loading) {
    return (
      <div className="order-section">
        <div className="section-title-img">
          <h2 className="section-title-text">Order Here</h2>
        </div>
        <div className="checking-live-status">
          <div className="spinner"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-section">
      <div className="section-title-img">
        <h2 className="section-title-text">
          Order Here
          {productCount > 0 && (
            <span className="replay-count-badge">{productCount} Available</span>
          )}
        </h2>
      </div>

      <div className="live-show-grid">
        {products.map((product) => (
          <ProductOrderCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

// Product Order Card Component - Similar to ReplayShowCard
function ProductOrderCard({ product }) {
  const handleOrder = () => {
    window.location.href = `${product.custom_url}`;
  };

  // Format price to IDR
  const formatPrice = (price) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="live-show-card replay-card product-card">
      <div className="live-show-thumbnail" onClick={handleOrder}>
        <img
          src={product.image_url[0]}
          alt={product.name}
          onError={(e) => {
            e.target.src =
              "https://res.cloudinary.com/haymzm4wp/image/upload/v1760105848/bi5ej2hgh0cc2uowu5xr.jpg";
          }}
        />

        {/* Price Badge */}
        <div className="duration-badge price-badge">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path
              d="M6 1L7.5 4.5L11 5L8.5 7.5L9 11L6 9L3 11L3.5 7.5L1 5L4.5 4.5L6 1Z"
              fill="white"
            />
          </svg>
          {formatPrice(product.price)}
        </div>

        {/* Category Badge */}
        <div className="views-badge category-badge">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <rect x="2" y="2" width="8" height="8" rx="1" fill="white" />
          </svg>
          {product.category === "weekly" ? "Weekly" : "Monthly"}
        </div>

        {/* Order Overlay */}
        <div className="play-overlay">
          <div className="play-button order-button">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="white">
              <circle cx="20" cy="20" r="20" fill="rgba(0,0,0,0.7)" />
              <path
                d="M15 14h10v2H15v-2zm0 4h10v2H15v-2zm0 4h7v2h-7v-2z"
                fill="white"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="live-show-info">
        <h3 className="live-show-title">{product.name}</h3>
        <p className="live-show-host">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M7 1L8.5 4.5L12 5L9.5 7.5L10 11L7 9L4 11L4.5 7.5L2 5L5.5 4.5L7 1Z" />
          </svg>
          {product.description || "Premium Access"}
        </p>

        <button
          className="watch-live-btn replay order-btn"
          onClick={handleOrder}
        >
          Order Now
        </button>
      </div>
    </div>
  );
}

// Live Show Component
function LiveShowSection({ loading }) {
  const [liveShows, setLiveShows] = useState([]);
  const [checkingLive, setCheckingLive] = useState(true);

  // Fetch live shows from Mux API
  const fetchLiveShows = async () => {
    try {
      const response = await fetch(
        "https://v2.jkt48connect.my.id/api/mux/live-streams?apikey=JKTCONNECT&username=vzy&password=vzy"
      );
      const result = await response.json();

      if (!result.success) {
        console.error("Failed to fetch live streams:", result.message);
        setLiveShows([]);
        setCheckingLive(false);
        return;
      }

      const activeLiveShows = result.data.data
        .filter(
          (stream) => stream.status === "active" && stream.connected === true
        )
        .map((stream) => {
          const today = new Date();
          const day = String(today.getDate()).padStart(2, "0");
          const month = String(today.getMonth() + 1).padStart(2, "0");
          const year = String(today.getFullYear()).slice(-2);
          const showName = `Show ${day}-${month}-${year}`;

          const playbackId =
            stream.playback_ids && stream.playback_ids.length > 0
              ? stream.playback_ids[0].id
              : "";

          return {
            id: stream.id,
            title: showName,
            host: "GStream Team",
            thumbnail: playbackId
              ? `https://image.mux.com/${playbackId}/thumbnail.jpg?time=0`
              : "https://res.cloudinary.com/haymzm4wp/image/upload/v1760105848/bi5ej2hgh0cc2uowu5xr.jpg",
            isLive: true,
            viewers: Math.floor(Math.random() * 1000) + 100,
            muxPlaybackId: playbackId,
            streamUrl: `/live/${playbackId}`,
            streamKey: stream.stream_key,
            createdAt: stream.created_at,
          };
        });

      setLiveShows(activeLiveShows);
    } catch (error) {
      console.error("Error fetching live shows:", error);
      setLiveShows([]);
    } finally {
      setCheckingLive(false);
    }
  };

  useEffect(() => {
    fetchLiveShows();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchLiveShows();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const liveCount = liveShows.length;

  if (loading || checkingLive) {
    return (
      <div className="live-show-section">
        <div className="section-title-img">
          <h2 className="section-title-text">Live Shows</h2>
        </div>
        <div className="checking-live-status">
          <div className="spinner"></div>
          <p>Checking for live shows...</p>
        </div>
      </div>
    );
  }

  if (liveCount === 0) {
    return (
      <div className="live-show-section">
        <div className="section-title-img">
          <h2 className="section-title-text">Live Shows</h2>
        </div>
        <div className="no-live-shows">
          <div className="no-live-icon">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="38" stroke="#e0e0e0" strokeWidth="4" />
              <path
                d="M40 20C28.954 20 20 28.954 20 40s8.954 20 20 20 20-8.954 20-20S51.046 20 40 20zm0 36c-8.837 0-16-7.163-16-16s7.163-16 16-16 16 7.163 16 16-7.163 16-16 16z"
                fill="#ccc"
              />
              <circle cx="40" cy="40" r="8" fill="#ccc" />
            </svg>
          </div>
          <h3>No Live Shows Right Now</h3>
          <p>Check back soon! We'll be live with exciting content.</p>
          <button
            className="notify-btn"
            onClick={() => alert("Notification feature coming soon!")}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2c-.69 0-1.25.56-1.25 1.25v.5C5.34 4.24 4.5 5.7 4.5 7.5v3l-1.5 1.5v.5h10v-.5L11.5 10.5v-3c0-1.8-.84-3.26-2.25-3.75v-.5C9.25 2.56 8.69 2 8 2zm0 12c-.55 0-1-.45-1-1h2c0 .55-.45 1-1 1z" />
            </svg>
            Notify Me
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="live-show-section">
      <div className="section-title-img">
        <h2 className="section-title-text">
          Live Shows
          {liveCount > 0 && (
            <span className="live-count-badge">{liveCount} LIVE</span>
          )}
        </h2>
      </div>

      <div className="live-show-grid">
        {liveShows.map((show) => (
          <LiveShowCard key={show.id} show={show} />
        ))}
      </div>
    </div>
  );
}

// Replay Show Component
function ReplayShowSection({ loading }) {
  const [replayShows, setReplayShows] = useState([]);
  const [checkingReplays, setCheckingReplays] = useState(true);

  const fetchReplayShows = async () => {
    try {
      const response = await fetch(
        "https://v2.jkt48connect.my.id/api/mux/assets?apikey=JKTCONNECT&username=vzy&password=vzy"
      );
      const result = await response.json();

      if (!result.success) {
        console.error("Failed to fetch replay shows:", result.message);
        setReplayShows([]);
        setCheckingReplays(false);
        return;
      }

      const readyReplays = result.data.data
        .filter((asset) => asset.status === "ready")
        .map((asset) => {
          const playbackId =
            asset.playback_ids && asset.playback_ids.length > 0
              ? asset.playback_ids[0].id
              : "";

          let recordingDate;
          if (asset.recording_times && asset.recording_times.length > 0) {
            recordingDate = new Date(asset.recording_times[0].started_at);
          } else {
            recordingDate = new Date(asset.created_at);
          }

          const day = String(recordingDate.getDate()).padStart(2, "0");
          const month = String(recordingDate.getMonth() + 1).padStart(2, "0");
          const year = String(recordingDate.getFullYear()).slice(-2);
          const showName = `Replay ${day}-${month}-${year}`;

          let duration = "N/A";
          if (
            asset.recording_times &&
            asset.recording_times.length > 0 &&
            asset.recording_times[0].duration
          ) {
            const totalSeconds = Math.floor(asset.recording_times[0].duration);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            duration = `${minutes}:${String(seconds).padStart(2, "0")}`;
          } else if (asset.duration) {
            const totalSeconds = Math.floor(asset.duration);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            duration = `${minutes}:${String(seconds).padStart(2, "0")}`;
          }

          return {
            id: asset.id,
            title: showName,
            host: "GStream Team",
            thumbnail: playbackId
              ? `https://image.mux.com/${playbackId}/thumbnail.jpg?time=0`
              : "https://res.cloudinary.com/haymzm4wp/image/upload/v1760105848/bi5ej2hgh0cc2uowu5xr.jpg",
            isLive: false,
            duration: duration,
            views: Math.floor(Math.random() * 5000) + 100,
            muxPlaybackId: playbackId,
            replayUrl: `/replay/${playbackId}`,
            recordingDate: recordingDate.toISOString(),
            createdAt: asset.created_at,
            assetData: asset,
          };
        })
        .sort((a, b) => new Date(b.recordingDate) - new Date(a.recordingDate))
        .slice(0, 6);

      setReplayShows(readyReplays);
    } catch (error) {
      console.error("Error fetching replay shows:", error);
      setReplayShows([]);
    } finally {
      setCheckingReplays(false);
    }
  };

  useEffect(() => {
    fetchReplayShows();
  }, []);

  const replayCount = replayShows.length;

  if (loading || checkingReplays) {
    return (
      <div className="replay-show-section">
        <div className="section-title-img">
          <h2 className="section-title-text">Replay Shows</h2>
        </div>
        <div className="checking-live-status">
          <div className="spinner"></div>
          <p>Loading replay shows...</p>
        </div>
      </div>
    );
  }

  if (replayCount === 0) {
    return (
      <div className="replay-show-section">
        <div className="section-title-img">
          <h2 className="section-title-text">Replay Shows</h2>
        </div>
        <div className="no-live-shows">
          <div className="no-live-icon">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="38" stroke="#e0e0e0" strokeWidth="4" />
              <path d="M40 25v20l15 10-2 3-18-12V25h5z" fill="#ccc" />
            </svg>
          </div>
          <h3>No Replay Shows Available</h3>
          <p>Replay shows will appear here after live streams end.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="replay-show-section">
      <div className="section-title-img">
        <h2 className="section-title-text">
          Replay Shows
          {replayCount > 0 && (
            <span className="replay-count-badge">{replayCount} Available</span>
          )}
        </h2>
      </div>

      <div className="live-show-grid">
        {replayShows.map((show) => (
          <ReplayShowCard key={show.id} show={show} />
        ))}
      </div>
    </div>
  );
}

// Live Show Card Component
function LiveShowCard({ show }) {
  const handleWatchLive = () => {
    window.location.href = show.streamUrl;
  };

  return (
    <div className="live-show-card">
      <div className="live-show-thumbnail" onClick={handleWatchLive}>
        <img src={show.thumbnail} alt={show.title} />

        {show.isLive && (
          <div className="live-badge">
            <span className="live-dot"></span>
            LIVE
          </div>
        )}

        <div className="play-overlay">
          <div className="play-button">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="white">
              <circle cx="20" cy="20" r="20" fill="rgba(0,0,0,0.7)" />
              <path d="M15 12l12 8-12 8V12z" fill="white" />
            </svg>
          </div>
        </div>
      </div>

      <div className="live-show-info">
        <h3 className="live-show-title">{show.title}</h3>
        <p className="live-show-host">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <circle cx="7" cy="4" r="3" />
            <path d="M7 8c-3.3 0-6 1.8-6 4v1h12v-1c0-2.2-2.7-4-6-4z" />
          </svg>
          {show.host}
        </p>

        <button
          className={`watch-live-btn ${show.isLive ? "live" : "offline"}`}
          onClick={handleWatchLive}
        >
          {show.isLive ? "Watch Live" : "View Details"}
        </button>
      </div>
    </div>
  );
}

// Replay Show Card Component
function ReplayShowCard({ show }) {
  const handleWatchReplay = () => {
    window.location.href = show.replayUrl;
  };

  return (
    <div className="live-show-card replay-card">
      <div className="live-show-thumbnail" onClick={handleWatchReplay}>
        <img src={show.thumbnail} alt={show.title} />

        <div className="duration-badge">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <circle
              cx="6"
              cy="6"
              r="5"
              stroke="white"
              strokeWidth="1"
              fill="none"
            />
            <path d="M6 3v3l2 2" stroke="white" strokeWidth="1" fill="none" />
          </svg>
          {show.duration}
        </div>

        <div className="play-overlay">
          <div className="play-button">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="white">
              <circle cx="20" cy="20" r="20" fill="rgba(0,0,0,0.7)" />
              <path d="M15 12l12 8-12 8V12z" fill="white" />
            </svg>
          </div>
        </div>
      </div>

      <div className="live-show-info">
        <h3 className="live-show-title">{show.title}</h3>
        <p className="live-show-host">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <circle cx="7" cy="4" r="3" />
            <path d="M7 8c-3.3 0-6 1.8-6 4v1h12v-1c0-2.2-2.7-4-6-4z" />
          </svg>
          {show.host}
        </p>

        <button className="watch-live-btn replay" onClick={handleWatchReplay}>
          Watch Replay
        </button>
      </div>
    </div>
  );
}

export default Home;
