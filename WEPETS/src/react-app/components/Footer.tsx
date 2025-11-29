

import React from "react";
import { Link } from "react-router-dom";
import { Twitter, Youtube, Linkedin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-black text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <img
                src="https://heyboss.heeyo.ai/chat-images/屏幕截图 2025-11-21 163810_J1f0wd6g.png"
                alt="WePets Logo"
                className="h-10 w-auto brightness-0 invert"
              />
              <span className="text-xl font-black tracking-tighter uppercase">
                WePets
              </span>
            </div>
            <p className="text-gray-400 max-w-sm">
              Transforming daily pet care into an epic RPG adventure. Level up your pet, earn rewards, and build healthy habits together.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold uppercase mb-6 tracking-wider">Links</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/pets" className="text-gray-400 hover:text-white transition-colors">My Pets</Link>
              </li>
              <li>
                <Link to="/quests" className="text-gray-400 hover:text-white transition-colors">Quests</Link>
              </li>
              <li>
                <Link to="/challenges" className="text-gray-400 hover:text-white transition-colors">Challenges</Link>
              </li>
              <li>
                <Link to="/account" className="text-gray-400 hover:text-white transition-colors">Account</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold uppercase mb-6 tracking-wider">Legal</h3>
            <ul className="space-y-4">
              <li>
                <a href="https://legal.heyboss.tech/67845a5e6e6bf5ecd4a3ae47/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
              </li>
              <li>
                <a href="https://legal.heyboss.tech/67845cfe76f9675292514b80/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">Terms & Conditions</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-6">
            <a href="https://x.com/heybossAI" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
            <a href="https://www.youtube.com/@heyboss-xyz" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
              <Youtube className="w-5 h-5" />
            </a>
            <a href="https://www.linkedin.com/company/heyboss-xyz/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
          
          <div className="text-sm text-gray-500">
            Made with <a href="https://heyboss.ai" target="_blank" rel="noopener noreferrer" className="text-[#0066cc] underline hover:text-blue-400">Heyboss.ai</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
  
