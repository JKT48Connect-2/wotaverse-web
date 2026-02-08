import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/header.css";
import {
  FaPhone,
  FaEnvelope,
  FaBell,
  FaShoppingCart,
  FaUser,
  FaChevronDown,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaEllipsisV,
} from "react-icons/fa";

const Header = () => {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(2);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [dropdowns, setDropdowns] = useState({
    kategori: false,
    akun: false,
    bantuan: false,
    menu: false, // Tambahan untuk menu titik 3
  });

  const dropdownRefs = useRef({
    kategori: null,
    akun: null,
    bantuan: null,
    menu: null, // Tambahan untuk menu titik 3
  });

  // Function to get cart count from localStorage
  const getCartCount = () => {
    try {
      const cartData = JSON.parse(localStorage.getItem("cart") || "[]");
      const totalItems = cartData.reduce(
        (total, item) => total + (item.quantity || 1),
        0
      );
      return totalItems;
    } catch (error) {
      console.error("Error reading cart from localStorage:", error);
      return 0;
    }
  };

  // Function to check login status
  const checkAuthStatus = () => {
    try {
      // Check for login data in sessionStorage
      const loginData = JSON.parse(
        sessionStorage.getItem("userLogin") || "null"
      );
      if (loginData && loginData.isLoggedIn && loginData.token) {
        setIsLoggedIn(true);
        setUserInfo(loginData.user || { username: "User" });
        return;
      }

      // Check for registration data in sessionStorage (auto-login after registration)
      const registrationData = JSON.parse(
        sessionStorage.getItem("userRegistration") || "null"
      );
      if (registrationData && registrationData.isRegistered) {
        setIsLoggedIn(true);
        setUserInfo({
          username: registrationData.username || "User",
          ...registrationData.userData,
        });
        return;
      }

      // Check for successful registration in localStorage (persistent)
      const successfulRegData = JSON.parse(
        localStorage.getItem("successfulRegistration") || "null"
      );
      if (successfulRegData && successfulRegData.isSuccessfullyRegistered) {
        setIsLoggedIn(true);
        setUserInfo({
          username: successfulRegData.username || "User",
          email: successfulRegData.email,
          full_name: successfulRegData.full_name,
        });
        return;
      }

      // No valid authentication found
      setIsLoggedIn(false);
      setUserInfo(null);
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsLoggedIn(false);
      setUserInfo(null);
    }
  };

  // Function to handle logout
  const handleLogout = () => {
    try {
      // Clear all authentication related data
      sessionStorage.removeItem("userLogin");
      sessionStorage.removeItem("userRegistration");
      sessionStorage.removeItem("authToken");
      localStorage.removeItem("successfulRegistration");
      localStorage.removeItem("registerFormData");

      // Reset state
      setIsLoggedIn(false);
      setUserInfo(null);

      // Close any open dropdowns
      setDropdowns({
        kategori: false,
        akun: false,
        bantuan: false,
        menu: false,
      });

      // Close mobile menu
      setIsMobileMenuOpen(false);

      // Navigate to home page
      navigate("/");

      console.log("User logged out successfully");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Update cart count on component mount and when localStorage changes
  useEffect(() => {
    const updateCartCount = () => {
      setCartCount(getCartCount());
    };

    // Initial count
    updateCartCount();

    // Listen for storage changes (when cart is updated from other tabs/components)
    const handleStorageChange = (e) => {
      if (e.key === "cart") {
        updateCartCount();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Listen for custom cart update events (for same-tab updates)
    const handleCartUpdate = () => {
      updateCartCount();
    };

    window.addEventListener("cartUpdated", handleCartUpdate);

    // Cleanup event listeners
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("cartUpdated", handleCartUpdate);
    };
  }, []);

  // Check authentication status on component mount and when storage changes
  useEffect(() => {
    checkAuthStatus();

    // Listen for storage changes to update auth status
    const handleStorageChange = (e) => {
      if (
        e.key === "userLogin" ||
        e.key === "userRegistration" ||
        e.key === "successfulRegistration"
      ) {
        checkAuthStatus();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Also check periodically for sessionStorage changes
    const authCheckInterval = setInterval(checkAuthStatus, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(authCheckInterval);
    };
  }, []);

  // Also update cart count periodically (optional - for better UX)
  useEffect(() => {
    const interval = setInterval(() => {
      setCartCount(getCartCount());
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, []);

  const handleDropdownToggle = (dropdownName) => {
    setDropdowns((prev) => {
      const newState = {
        kategori: dropdownName === "kategori" ? !prev.kategori : false,
        akun: dropdownName === "akun" ? !prev.akun : false,
        bantuan: dropdownName === "bantuan" ? !prev.bantuan : false,
        menu: dropdownName === "menu" ? !prev.menu : false,
      };

      // Auto-adjust dropdown position to prevent cutoff
      setTimeout(() => {
        const dropdownElement = dropdownRefs.current[dropdownName];
        if (dropdownElement && newState[dropdownName]) {
          const dropdownMenu = dropdownElement.querySelector(".dropdown-menu");
          if (dropdownMenu) {
            const dropdownRect = dropdownElement.getBoundingClientRect();
            const menuRect = dropdownMenu.getBoundingClientRect();
            const viewportWidth = window.innerWidth;

            // Reset classes first
            dropdownMenu.classList.remove("dropdown-menu-right");

            // Check if dropdown would go off-screen to the right
            if (dropdownRect.left + 200 > viewportWidth - 20) {
              dropdownMenu.classList.add("dropdown-menu-right");
            }
          }
        }
      }, 10);

      return newState;
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isClickInsideDropdown = Object.values(dropdownRefs.current).some(
        (ref) => ref && ref.contains(event.target)
      );

      if (!isClickInsideDropdown) {
        setDropdowns({
          kategori: false,
          akun: false,
          bantuan: false,
          menu: false,
        });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close mobile menu and dropdowns when window is resized
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileMenuOpen(false);
      }
      setDropdowns({
        kategori: false,
        akun: false,
        bantuan: false,
        menu: false,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Modified handleCartClick function to navigate to /keranjang
  const handleCartClick = () => {
    console.log("Cart clicked - navigating to /keranjang");
    navigate("/keranjang");
  };

  const handleNotificationClick = () => {
    console.log("Notification clicked");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    // Close all dropdowns when mobile menu is toggled
    setDropdowns({
      kategori: false,
      akun: false,
      bantuan: false,
      menu: false,
    });
  };

  // Function to handle logo/beranda click
  const handleLogoClick = () => {
    navigate("/");
  };

  const handleBerandaClick = () => {
    navigate("/");
  };

  const handleLoginClick = () => {
    navigate("/login");
  };

  const handleRegisterClick = () => {
    navigate("/register");
  };

  // Function to handle verify click
  const handleVerifyClick = () => {
    setDropdowns({
      kategori: false,
      akun: false,
      bantuan: false,
      menu: false,
    });
    navigate("/verify");
  };

  return (
    <header>
      {/* Top Bar */}
      {/*<div className="top-bar">
        <div>
          <FaPhone className="phone-icon" />
          0852-1514-7628
          <FaEnvelope style={{ marginLeft: "20px" }} /> support@nayrakuen.com
        </div>
        <div>
          <a href="#">Tentang Nayrakuen Shop</a>
        </div>
      </div>*/}

      {/* Navbar */}
      <nav className="navbar">
        <div
          className="logo"
          onClick={handleLogoClick}
          style={{ cursor: "pointer" }}
        >
          <span className="logo-bold">wotaverse</span>
        </div>
      </nav>
    </header>
  );
};

export default Header;
