

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@hey-boss/users-service/react";
import { Calendar, TrendingUp, Award, ChevronDown, Plus, Check, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuestLog {
  id: number;
  quest_name: string;
  xp_value: number;
  completion_date: string;
}

interface Pet {
  id: number;
  name: string;
  total_xp: number;
  level: number;
}

export const ProgressPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [logs, setLogs] = useState<QuestLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const res = await fetch("/api/pets");
        if (res.ok) {
          const data = await res.json();
          setPets(data);
          
          // Try to get active pet from local storage or default to first
          const savedActiveId = localStorage.getItem("activePetId");
          if (savedActiveId && data.find((p: Pet) => p.id === Number(savedActiveId))) {
            setSelectedPetId(Number(savedActiveId));
          } else if (data.length > 0) {
            setSelectedPetId(data[0].id);
            localStorage.setItem("activePetId", String(data[0].id));
          }
        }
      } catch (error) {
        console.error("Failed to fetch pets", error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchPets();
  }, [user]);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!selectedPetId) return;
      try {
        const res = await fetch(`/api/quest-logs?petId=${selectedPetId}`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data);
        }
      } catch (error) {
        console.error("Failed to fetch logs", error);
      }
    };
    fetchLogs();
  }, [selectedPetId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePetSelect = (id: number) => {
    setSelectedPetId(id);
    localStorage.setItem("activePetId", String(id));
    setIsDropdownOpen(false);
  };

  const selectedPet = pets.find(p => p.id === selectedPetId);

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter mb-2">Progress Hub</h1>
            <p className="text-gray-600 font-medium">Track your pet's journey and milestones.</p>
          </div>
          
          {/* Custom Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <label className="text-xs font-black uppercase text-gray-500 mb-1 tracking-wider block">Active Pet</label>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={pets.length === 0}
              className="flex items-center justify-between w-72 px-4 py-3 bg-white border-2 border-black font-black uppercase hover:bg-gray-50 transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="truncate mr-2">
                {selectedPet ? selectedPet.name : (pets.length === 0 ? "No Pets Found" : "Select Pet")}
              </span>
              <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="max-h-60 overflow-y-auto py-2">
                  {pets.map((pet) => (
                    <button
                      key={pet.id}
                      onClick={() => handlePetSelect(pet.id)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center justify-between group transition-colors"
                    >
                      <div>
                        <div className="font-bold uppercase text-sm">{pet.name}</div>
                        <div className="text-xs text-gray-500 font-medium">Level {pet.level}</div>
                      </div>
                      {selectedPetId === pet.id && (
                        <Check className="w-4 h-4 text-orange-600" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="border-t-2 border-gray-100 p-2 bg-gray-50">
                  <button
                    onClick={() => navigate('/pets')}
                    className="w-full px-4 py-2 bg-black text-white font-bold uppercase text-sm hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add New Pet
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        ) : !selectedPet ? (
          <div className="text-center py-20 bg-white border-2 border-dashed border-gray-300 rounded-xl">
            <p className="text-xl font-bold text-gray-400 mb-4">No pets found.</p>
            <button
                onClick={() => navigate('/pets')}
                className="px-6 py-2 bg-black text-white font-bold uppercase hover:bg-orange-600 transition-colors"
            >
                Add Your First Pet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Stats Card */}
            <div className="bg-black text-white p-8 border-2 border-black lg:col-span-1 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Crown className="w-32 h-32 rotate-12" />
              </div>
              
              <div className="relative z-10">
                <h3 className="text-2xl font-black uppercase mb-8 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-orange-500" /> 
                  Stats For: <span className="text-orange-500">{selectedPet.name}</span>
                </h3>
                
                <div className="space-y-8">
                  <div>
                    <div className="text-sm text-gray-400 uppercase font-bold mb-1">Current Level</div>
                    <div className="text-6xl font-black text-orange-500">{selectedPet.level}</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-400 uppercase font-bold mb-1">Total XP</div>
                    <div className="text-4xl font-black">{selectedPet.total_xp}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-400 uppercase font-bold mb-1">Quests Completed</div>
                    <div className="text-4xl font-black">{logs.length}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Log */}
            <div className="bg-white border-2 border-black p-8 lg:col-span-2">
              <h3 className="text-2xl font-black uppercase mb-8 flex items-center gap-2">
                <Calendar className="w-6 h-6" /> Recent Activity
              </h3>

              <div className="space-y-4">
                {logs.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 font-medium">No activity yet. Complete some quests!</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 hover:border-black transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                          <Award className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-bold uppercase">{log.quest_name}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(log.completion_date).toLocaleDateString()} at {new Date(log.completion_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <div className="font-black text-orange-600">+{log.xp_value} XP</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
  
