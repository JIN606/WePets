




import React, { useEffect, useState } from "react";
import { Check, Plus, Clock, Zap, Star } from "lucide-react";
import { CustomForm } from "../components/CustomForm";
import { formTheme } from "../components/CustomForm/themes";
import allConfigs from "../../shared/form-configs.json";
import { useAuth } from "@hey-boss/users-service/react";

interface Quest {
  id: number;
  name: string;
  emoji: string;
  description: string;
  type: string;
  xp_value: number;
  is_custom: number;
}

interface Pet {
  id: number;
  name: string;
}

export const QuestsPage = () => {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [questsRes, petsRes] = await Promise.all([
        fetch("/api/quests"),
        fetch("/api/pets")
      ]);
      
      if (questsRes.ok && petsRes.ok) {
        const questsData = await questsRes.json();
        const petsData = await petsRes.json();
        setQuests(questsData);
        setPets(petsData);
        if (petsData.length > 0 && !selectedPetId) {
          setSelectedPetId(petsData[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleAddQuest = async (data: any) => {
    try {
      const res = await fetch("/api/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, is_custom: 1 }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({});
        fetchData();
      }
    } catch (error) {
      console.error("Failed to add quest", error);
    }
  };

  const handleCompleteQuest = async (questId: number) => {
    if (!selectedPetId) return;
    
    const petName = pets.find(p => p.id === selectedPetId)?.name || "Pet";

    try {
      const res = await fetch("/api/quests/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ petId: selectedPetId, questId }),
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(`🎉 Quest Completed! ${petName} earned ${data.xpEarned} XP!`);
        fetchData(); // Refresh data to update any progress indicators
      } else {
        const errorData = await res.json();
        alert(`Failed: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to complete quest", error);
      alert("An error occurred while completing the quest.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter mb-2">Quests</h1>
            <p className="text-gray-700 font-medium">Complete tasks to level up your pet.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
            {pets.length > 0 ? (
              <div className="flex flex-col items-end sm:items-start">
                <label className="text-xs font-black uppercase text-gray-500 mb-1 tracking-wider">Select Active Pet</label>
                <div className="relative">
                  <select 
                    value={selectedPetId || ""} 
                    onChange={(e) => setSelectedPetId(Number(e.target.value))}
                    className="appearance-none pl-4 pr-10 py-3 bg-white border-2 border-black font-black uppercase focus:outline-none focus:border-orange-500 min-w-[200px] cursor-pointer shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all"
                  >
                    <option value="" disabled>Select Pet</option>
                    {pets.map(pet => (
                      <option key={pet.id} value={pet.id}>{pet.name}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-black">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-red-500 font-black uppercase text-sm tracking-wider">Create a pet to start!</div>
            )}
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-black text-white font-black uppercase tracking-wider hover:bg-orange-600 transition-colors flex items-center gap-2 h-[52px] shadow-[4px_4px_0px_0px_rgba(234,88,12,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              <Plus className="w-5 h-5" /> New Quest
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {quests.map((quest) => (
              <div key={quest.id} className="bg-white border-2 border-black p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-200">
                <div className="flex items-start gap-6 flex-1">
                  <div className={`p-4 rounded-full border-2 border-black text-3xl ${quest.type === 'daily' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                    {quest.emoji || (quest.type === 'daily' ? '⏰' : '⚡')}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="text-xl font-black uppercase text-gray-900">{quest.name}</h3>
                      <span className="px-2 py-0.5 bg-black text-white text-xs font-bold uppercase tracking-wider">{quest.type}</span>
                      {quest.is_custom === 1 && (
                        <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                          <Star className="w-3 h-3" /> Custom
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700">{quest.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                  <div className="text-right">
                    <div className="text-xs text-gray-500 uppercase font-bold">Reward</div>
                    <div className="text-xl font-black text-orange-600">+{quest.xp_value} XP</div>
                  </div>
                  <button
                    onClick={() => handleCompleteQuest(quest.id)}
                    disabled={!selectedPetId}
                    className="px-6 py-3 bg-green-500 text-white font-black uppercase tracking-wider hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Check className="w-5 h-5" /> Complete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-8 relative border-4 border-black">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100"
            >
              <Plus className="w-6 h-6 rotate-45 text-gray-900" />
            </button>
            <h2 className="text-2xl font-black uppercase mb-6 text-center text-gray-900">Create Custom Quest</h2>
            <CustomForm
              id="add_quest_form"
              schema={allConfigs.add_quest_form.jsonSchema}
              formData={formData}
              onChange={(data) => setFormData(data)}
              onSubmit={handleAddQuest}
              theme={formTheme}
            />
          </div>
        </div>
      )}
    </div>
  );
};
  



