
import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Trophy, Heart, Activity } from "lucide-react";

export const HomePage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source
              src="https://cdn.pixabay.com/video/2023/03/27/156318-812205657_medium.mp4"
              type="video/mp4"
            />
          </video>
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter mb-6 drop-shadow-lg">
            Level Up Your <br />
            <span className="text-orange-500">Pet's Life</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-2xl mx-auto font-medium">
            Transform daily care into an epic RPG adventure. Complete quests, earn rewards, and build a healthier life together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/pets"
              className="px-8 py-4 bg-orange-600 text-white font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300 text-lg flex items-center justify-center gap-2"
            >
              Start Adventure <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-300 text-lg"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="group p-8 border-2 border-black hover:bg-black hover:text-white transition-all duration-300 cursor-pointer">
              <div className="mb-6 p-4 bg-orange-100 w-fit rounded-full group-hover:bg-orange-600 transition-colors">
                <Trophy className="w-8 h-8 text-orange-600 group-hover:text-white" />
              </div>
              <h3 className="text-2xl font-black uppercase mb-4">Daily Quests</h3>
              <p className="text-gray-600 group-hover:text-gray-300 mb-6">
                Turn walks, feeding, and grooming into rewarding missions. Earn XP and coins for every completed task.
              </p>
              <Link to="/quests" className="font-bold uppercase tracking-wider flex items-center gap-2 group-hover:text-orange-500">
                View Quests <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 border-2 border-black hover:bg-black hover:text-white transition-all duration-300 cursor-pointer">
              <div className="mb-6 p-4 bg-blue-100 w-fit rounded-full group-hover:bg-blue-600 transition-colors">
                <Heart className="w-8 h-8 text-blue-600 group-hover:text-white" />
              </div>
              <h3 className="text-2xl font-black uppercase mb-4">Pet Health</h3>
              <p className="text-gray-600 group-hover:text-gray-300 mb-6">
                Track vitals, manage multiple pets, and get AI-powered health insights and reminders.
              </p>
              <Link to="/pets" className="font-bold uppercase tracking-wider flex items-center gap-2 group-hover:text-blue-400">
                Manage Pets <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 border-2 border-black hover:bg-black hover:text-white transition-all duration-300 cursor-pointer">
              <div className="mb-6 p-4 bg-green-100 w-fit rounded-full group-hover:bg-green-600 transition-colors">
                <Activity className="w-8 h-8 text-green-600 group-hover:text-white" />
              </div>
              <h3 className="text-2xl font-black uppercase mb-4">Track Progress</h3>
              <p className="text-gray-600 group-hover:text-gray-300 mb-6">
                Visualize your journey with detailed charts, level-up milestones, and challenge leagues.
              </p>
              <Link to="/progress" className="font-bold uppercase tracking-wider flex items-center gap-2 group-hover:text-green-400">
                See Stats <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

