

import React, { useEffect, useState } from "react";
import { useAuth } from "@hey-boss/users-service/react";
import { Trophy, Medal, TrendingUp, Crown, Zap, Star } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  user_id: number;
  user_email: string;
  user_name: string;
  user_picture?: string;
  total_score: number;
  is_current_user: boolean;
}

const getRankStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return {
        badge: <Crown className="w-8 h-8 text-yellow-400 fill-yellow-400/20" />,
        border: "border-yellow-400",
        bg: "bg-yellow-50",
        text: "text-yellow-600",
        label: "CHAMPION",
      };
    case 2:
      return {
        badge: <Medal className="w-8 h-8 text-gray-300 fill-gray-300/20" />,
        border: "border-gray-300",
        bg: "bg-gray-50",
        text: "text-gray-500",
        label: "RUNNER-UP",
      };
    case 3:
      return {
        badge: <Medal className="w-8 h-8 text-orange-400 fill-orange-400/20" />,
        border: "border-orange-400",
        bg: "bg-orange-50",
        text: "text-orange-500",
        label: "THIRD PLACE",
      };
    default:
      return {
        badge: <span className="text-gray-500 font-black text-xl w-8 text-center">#{rank}</span>,
        border: "border-gray-800",
        bg: "bg-white",
        text: "text-gray-700",
        label: `RANK ${rank}`,
      };
  }
};

export const LeaderboardPage = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("/api/leaderboard");
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data);
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();

    // Poll every 15 seconds for real-time updates
    const interval = setInterval(fetchLeaderboard, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-28 pb-12 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          <p className="text-gray-500 font-medium animate-pulse">Loading Rankings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-16 text-center md:text-left relative">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-yellow-200 rounded-full blur-3xl opacity-30"></div>
          <div className="relative z-10">
            <h1 className="text-6xl md:text-7xl font-black uppercase tracking-tighter mb-4 leading-none">
              Global <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-orange-600">Leaderboard</span>
            </h1>
            <p className="text-xl text-gray-500 font-medium max-w-2xl">
              The ultimate ranking of pet trainers worldwide. Climb the ranks by earning XP through quests and challenges!
            </p>
          </div>
        </div>

        {leaderboard.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="relative w-full max-w-2xl mb-10">
              <img 
                src="https://heyboss.heeyo.ai/gemini-image-f57c4d3883214c2794730ced23c24c31.png" 
                alt="Empty Leaderboard" 
                className="w-full rounded-3xl shadow-2xl border-4 border-white"
              />
            </div>
            <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-gray-900">
              No Rankings Yet
            </h3>
            <p className="text-xl text-gray-500 font-medium max-w-lg mx-auto leading-relaxed">
              Be the first to claim the throne! Complete quests and challenges to earn your spot on the leaderboard.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {leaderboard.map((entry) => {
              const rankStyle = getRankStyle(entry.rank);
              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center justify-between p-6 rounded-2xl border-4 transition-all duration-300 hover:shadow-xl ${
                    entry.is_current_user
                      ? "bg-green-50 border-green-500 shadow-lg"
                      : `${rankStyle.bg} ${rankStyle.border} hover:-translate-y-1`
                  }`}
                >
                  <div className="flex items-center gap-6 flex-1">
                    <div className="flex-shrink-0 w-16 flex justify-center">
                      {rankStyle.badge}
                    </div>
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center border-4 border-black overflow-hidden">
                      {entry.user_picture ? (
                        <img src={entry.user_picture} alt={entry.user_name || entry.user_email} className="w-full h-full object-cover" />
                      ) : (
                        <Star className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">
                          {entry.user_name || entry.user_email}
                        </h3>
                        {entry.is_current_user && (
                          <span className="px-3 py-1 bg-green-600 text-white text-xs font-black uppercase tracking-wider rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <div className={`text-sm font-bold uppercase ${rankStyle.text}`}>
                        {rankStyle.label}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2 text-2xl font-black text-gray-900">
                      <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                      {entry.total_score.toLocaleString()}
                    </div>
                    <span className="text-xs font-bold uppercase text-gray-400 tracking-wider">Total XP</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
  
