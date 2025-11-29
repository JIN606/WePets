



import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@hey-boss/users-service/react";
import { Menu, X, User, LogOut } from "lucide-react";

export const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Friends", path: "/messages" },
    { label: "My Pets", path: "/pets" },
    { label: "Quests", path: "/quests" },
    { label: "Progress", path: "/progress" },
    { label: "Challenges", path: "/challenges" },
    { label: "Leaderboard", path: "/leaderboard" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b-2 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="https://heyboss.heeyo.ai/chat-images/屏幕截图 2025-11-21 163810_J1f0wd6g.png"
              alt="WePets Logo"
              className="h-12 w-auto transition-transform group-hover:scale-105"
            />
            <span className="text-2xl font-black tracking-tighter uppercase hidden sm:block">
              WePets
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-bold uppercase tracking-wider transition-colors hover:text-orange-600 ${
                  isActive(item.path) ? "text-orange-600" : "text-black"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Actions */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-sm font-bold uppercase hover:text-orange-600"
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center border-2 border-black overflow-hidden">
                    {user.picture ? (
                      <img src={user.picture} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <span className="hidden lg:block">{user.name || user.email?.split("@")[0]}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-6 py-2 bg-black text-white font-bold uppercase text-sm hover:bg-orange-600 transition-colors"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-black"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t-2 border-black absolute w-full">
          <div className="px-4 pt-2 pb-8 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-3 py-4 text-lg font-black uppercase ${
                  isActive(item.path) ? "text-orange-600 bg-gray-50" : "text-black"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-gray-200 my-4 pt-4">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="block px-3 py-4 text-lg font-black uppercase text-black"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Profile
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-4 text-lg font-black uppercase text-red-600"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="block px-3 py-4 text-lg font-black uppercase text-black"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};



