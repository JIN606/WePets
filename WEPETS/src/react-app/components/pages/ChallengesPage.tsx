

import React, { useEffect, useState } from "react";
import { Trophy, Users, Timer, Crown, Target, TrendingUp, Star, Medal, Award, Zap, Calendar, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@hey-boss/users-service/react";

interface Challenge {
  id: number;
  name: string;
  duration: number;
  completion_goal: string;
  bonus_reward: string;
  category: string;
  start_date: string;
  end_date: string;
  is_active: number;
}

interface LeaderboardEntry {
  id: number;
  challenge_id: number;
  user_id: number;
  pet_name: string;
  score: number;
  tier: string;
  user_email: string;
  user_name: string;
}

interface Participation {
  id: number;
  challenge_id: number;
  user_id: number;
  progress: number;
  status: string;
  joined_at: string;
}

const getCategoryStyles = (category: string) => {
  const normalized = category.toLowerCase();
  if (normalized.includes("fitness")) {
    return {
      icon: <TrendingUp className="w-6 h-6" />,
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      text: "text-emerald-900",
      accent: "text-emerald-600",
      badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
      button: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200",
      gradient: "from-emerald-500 to-teal-600"
    };
  } else if (normalized.includes("training")) {
    return {
      icon: <Target className="w-6 h-6" />,
      bg: "bg-orange-50",
      border: "border-orange-100",
      text: "text-orange-900",
      accent: "text-orange-600",
      badge: "bg-orange-100 text-orange-700 border-orange-200",
      button: "bg-orange-600 hover:bg-orange-700 shadow-orange-200",
      gradient: "from-orange-500 to-red-600"
    };
  } else if (normalized.includes("social")) {
    return {
      icon: <Users className="w-6 h-6" />,
      bg: "bg-purple-50",
      border: "border-purple-100",
      text: "text-purple-900",
      accent: "text-purple-600",
      badge: "bg-purple-100 text-purple-700 border-purple-200",
      button: "bg-purple-600 hover:bg-purple-700 shadow-purple-200",
      gradient: "from-purple-500 to-indigo-600"
    };
  } else {
    return {
      icon: <Star className="w-6 h-6" />,
      bg: "bg-gray-50",
      border: "border-gray-200",
      text: "text-gray-900",
      accent: "text-gray-600",
      badge: "bg-gray-100 text-gray-700 border-gray-200",
      button: "bg-black hover:bg-gray-800 shadow-gray-200",
      gradient: "from-gray-700 to-black"
    };
  }
};

const getRankStyle = (index: number) => {
  switch (index) {
    case 0:
      return {
        badge: <Medal className="w-6 h-6 text-yellow-400 fill-yellow-400/20" />,
        border: "border-yellow-400",
        bg: "bg-yellow-50/10",
        text: "text-yellow-500",
        label: "GOLD"
      };
    case 1:
      return {
        badge: <Medal className="w-6 h-6 text-gray-300 fill-gray-300/20" />,
        border: "border-gray-300",
        bg: "bg-gray-50/10",
        text: "text-gray-400",
        label: "SILVER"
      };
    case 2:
      return {
        badge: <Medal className="w-6 h-6 text-orange-400 fill-orange-400/20" />,
        border: "border-orange-400",
        bg: "bg-orange-50/10",
        text: "text-orange-500",
        label: "BRONZE"
      };
    default:
      return {
        badge: <span className="text-gray-500 font-black text-lg w-6 text-center">#{index + 1}</span>,
        border: "border-gray-800",
        bg: "bg-transparent",
        text: "text-gray-500",
        label: "RANK"
      };
  }
};

const calculateTimeRemaining = (endDate: string) => {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();

  if (diff <= 0) return "Ended";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
};

export const ChallengesPage = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboards, setLeaderboards] = useState<Record<number, LeaderboardEntry[]>>({});
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string>("");

  const fetchChallenges = async () => {
    try {
      const res = await fetch("/api/challenges");
      if (res.ok) {
        const data = await res.json();
        setChallenges(data);
        
        // Fetch leaderboards for all challenges immediately
        data.forEach(async (challenge: Challenge) => {
          fetchLeaderboard(challenge.id);
        });
      }
    } catch (error) {
      console.error("Failed to fetch challenges", error);
      setError("Failed to load challenges. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async (challengeId: number) => {
    try {
      const leaderRes = await fetch(`/api/challenge-leaderboard/${challengeId}`);
      if (leaderRes.ok) {
        const leaderData = await leaderRes.json();
        setLeaderboards(prev => ({ ...prev, [challengeId]: leaderData }));
      }
    } catch (error) {
      console.error(`Failed to fetch leaderboard for challenge ${challengeId}`, error);
    }
  };

  const fetchParticipations = async () => {
    try {
      const res = await fetch("/api/challenge-participations");
      if (res.ok) {
        const data = await res.json();
        setParticipations(data);
      }
    } catch (error) {
      console.error("Failed to fetch participations", error);
    }
  };

  useEffect(() => {
    fetchChallenges();
    fetchParticipations();
  }, []);

  // Real-time polling for leaderboards
  useEffect(() => {
    if (challenges.length === 0) return;

    const interval = setInterval(() => {
      challenges.forEach((challenge) => {
        fetchLeaderboard(challenge.id);
      });
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [challenges]);

  const handleJoinChallenge = async (challengeId: number) => {
    setJoinLoading(prev => ({ ...prev, [challengeId]: true }));
    setError("");

    try {
      const res = await fetch("/api/challenge-participations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge_id: challengeId }),
      });

      if (res.ok) {
        await fetchParticipations();
        // Refresh leaderboard to potentially show the new user (though they start with 0 score)
        fetchLeaderboard(challengeId);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to join challenge");
      }
    } catch (error) {
      console.error("Failed to join challenge", error);
      setError("Failed to join challenge. Please try again.");
    } finally {
      setJoinLoading(prev => ({ ...prev, [challengeId]: false }));
    }
  };

  const isJoined = (challengeId: number) => {
    return participations.some(p => p.challenge_id === challengeId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-28 pb-12 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          <p className="text-gray-500 font-medium animate-pulse">Loading Arena...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-16 text-center md:text-left relative">
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-orange-200 rounded-full blur-3xl opacity-30"></div>
          <div className="relative z-10">
            <h1 className="text-6xl md:text-7xl font-black uppercase tracking-tighter mb-4 leading-none">
              Challenge <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">League</span>
            </h1>
            <p className="text-xl text-gray-500 font-medium max-w-2xl">
              Compete in global events, climb the ranks, and earn exclusive badges for your squad.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-600 text-red-900 font-bold uppercase shadow-sm flex items-center gap-3 rounded-r-xl">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
            {error}
          </div>
        )}

        {challenges.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="relative w-full max-w-2xl mb-10 group cursor-pointer">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-500 rounded-3xl transform rotate-2 opacity-20 group-hover:rotate-1 transition-transform duration-500 blur-xl"></div>
              <img 
                src="https://heyboss.heeyo.ai/gemini-image-6e7b8b5caea24b13a20ec52272369a6f.png" 
                alt="No Active Challenges" 
                className="relative w-full rounded-3xl shadow-2xl transform -rotate-1 group-hover:rotate-0 transition-transform duration-500 border-4 border-white"
              />
              <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-white/50">
                <span className="text-sm font-black uppercase tracking-wider text-gray-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" /> Coming Soon
                </span>
              </div>
            </div>
            <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4 text-gray-900">
              Arena <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">Closed</span>
            </h3>
            <p className="text-xl text-gray-500 font-medium max-w-lg mx-auto leading-relaxed">
              The stadium is quiet... for now. Our trainers are preparing the next set of legendary challenges. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {challenges.map((challenge) => {
              const styles = getCategoryStyles(challenge.category);
              const joined = isJoined(challenge.id);
              
              return (
                <div key={challenge.id} className="bg-white border-2 border-black rounded-3xl overflow-hidden hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 flex flex-col group">
                  {/* Card Header */}
                  <div className={`p-8 flex-grow relative overflow-hidden`}>
                    {/* Background Pattern */}
                    <div className={`absolute top-0 right-0 w-64 h-64 ${styles.bg} rounded-full blur-3xl -mr-32 -mt-32 opacity-50 pointer-events-none`}></div>
                    
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-16 h-16 ${styles.bg} ${styles.text} flex items-center justify-center rounded-2xl shadow-sm border-2 ${styles.border}`}>
                            {styles.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`inline-block px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border ${styles.badge}`}>
                                {challenge.category}
                              </span>
                              {joined && (
                                <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-wider rounded-full border border-green-200 flex items-center gap-1">
                                  <Target className="w-3 h-3" /> Joined
                                </span>
                              )}
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tight leading-none text-gray-900">{challenge.name}</h3>
                          </div>
                        </div>
                        <div className="text-right bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                          <div className={`flex items-center justify-end gap-1.5 ${styles.accent} mb-0.5`}>
                            <Timer className="w-4 h-4" />
                            <span className="text-base font-black tracking-tight">{calculateTimeRemaining(challenge.end_date)}</span>
                          </div>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Time Remaining</span>
                        </div>
                      </div>

                      {/* Challenge Description */}
                      <div className="mb-8">
                        <p className="text-gray-600 text-lg font-medium leading-relaxed mb-6">
                          {challenge.completion_goal}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-gray-400">
                              <Users className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="block text-xs font-bold text-gray-400 uppercase">Contenders</span>
                              <span className="font-black text-gray-700">
                                {leaderboards[challenge.id]?.length || 0}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm text-yellow-500">
                              <Trophy className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="block text-xs font-bold text-yellow-600/70 uppercase">Reward</span>
                              <span className="font-black text-yellow-700">
                                {challenge.bonus_reward}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Join Button */}
                      {!joined ? (
                        <button
                          onClick={() => handleJoinChallenge(challenge.id)}
                          disabled={joinLoading[challenge.id]}
                          className={`w-full py-4 text-white font-black uppercase tracking-widest transition-all duration-300 rounded-xl flex items-center justify-center gap-3 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:shadow-none group relative overflow-hidden shadow-lg hover:shadow-xl hover:-translate-y-1 ${styles.button}`}
                        >
                          <span className="relative z-10 flex items-center gap-2">
                            {joinLoading[challenge.id] ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Joining...
                              </>
                            ) : (
                              <>
                                Join Challenge <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                              </>
                            )}
                          </span>
                        </button>
                      ) : (
                        <div className="w-full py-4 bg-green-50 border-2 border-green-500 text-green-700 font-black uppercase tracking-widest text-center rounded-xl flex items-center justify-center gap-2 shadow-sm">
                          <Target className="w-5 h-5" /> Active Participant
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Leaderboard Section */}
                  <div className="bg-black text-white p-6 border-t-2 border-black">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-gray-400">
                        <Crown className="w-4 h-4 text-yellow-400" /> Top Ranking
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Live</span>
                      </div>
                    </div>

                    {leaderboards[challenge.id] && leaderboards[challenge.id].length > 0 ? (
                      <div className="space-y-2">
                        {leaderboards[challenge.id].slice(0, 3).map((entry, index) => {
                          const rankStyle = getRankStyle(index);
                          return (
                            <div
                              key={entry.id}
                              className={`flex items-center justify-between p-3 rounded-lg border ${rankStyle.border} bg-gray-900/50 hover:bg-gray-800 transition-colors group`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 w-6 flex justify-center">
                                  {rankStyle.badge}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-white uppercase tracking-wide">
                                      {entry.pet_name || entry.user_name || "Anonymous"}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-sm font-mono font-black text-white tracking-tight">
                                  {entry.score.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {leaderboards[challenge.id].length > 3 && (
                          <div className="text-center pt-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                              + {leaderboards[challenge.id].length - 3} more contenders
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 border-2 border-dashed border-gray-800 rounded-xl bg-gray-900/30">
                        <p className="text-gray-500 text-sm font-medium">Be the first to join the leaderboard!</p>
                      </div>
                    )}
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
  
