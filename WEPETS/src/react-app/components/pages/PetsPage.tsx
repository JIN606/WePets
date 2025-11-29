

/**
 * @description PetsPage component for managing user's pets.
 * Allows users to view, add, and delete pets.
 * Uses CustomForm for adding pets with name and avatar URL.
 * Displays pet stats (level, xp, coins) and health status.
 */
import React, { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, PawPrint, MoreVertical, Crown, X } from "lucide-react";
import { CustomForm } from "../components/CustomForm";
import { formTheme } from "../components/CustomForm/themes";
import allConfigs from "../../shared/form-configs.json";
import { useAuth } from "@hey-boss/users-service/react";
import { ChatPetsWidget } from "../components/ChatPetsWidget";

interface Pet {
  id: number;
  name: string;
  avatar_url: string;
  breed?: string;
  level: number;
  total_xp: number;
  coins: number;
}

export const PetsPage = () => {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [activePetId, setActivePetId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [contextMenuPetId, setContextMenuPetId] = useState<number | null>(null);

  const fetchPets = async () => {
    try {
      const res = await fetch("/api/pets");
      if (res.ok) {
        const data = await res.json();
        setPets(data);
        if (data.length > 0 && !activePetId) {
          const savedActiveId = localStorage.getItem("activePetId");
          if (savedActiveId && data.find((p: Pet) => p.id === Number(savedActiveId))) {
            setActivePetId(Number(savedActiveId));
          } else {
            setActivePetId(data[0].id);
            localStorage.setItem("activePetId", String(data[0].id));
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch pets", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchPets();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenuPetId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleAddPet = async (data: any) => {
    try {
      const res = await fetch("/api/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          avatar_url: data.avatar_url,
        }),
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({});
        fetchPets();
      } else {
        const errorData = await res.json();
        alert(`Failed to add pet: ${errorData.error || "Unknown error"}`);
      }
    } catch (error: any) {
      console.error("Failed to add pet", error);
      alert(`Error: ${error.message || "Failed to add pet"}`);
    }
  };

  const handleDeletePet = async (id: number) => {
    if (!confirm("Are you sure you want to remove this pet? This action cannot be undone.")) return;
    try {
      await fetch(`/api/pets/${id}`, { method: "DELETE" });
      const remainingPets = pets.filter((p) => p.id !== id);
      setPets(remainingPets);
      
      if (activePetId === id) {
        const newActiveId = remainingPets.length > 0 ? remainingPets[0].id : null;
        setActivePetId(newActiveId);
        if (newActiveId) {
          localStorage.setItem("activePetId", String(newActiveId));
        } else {
          localStorage.removeItem("activePetId");
        }
      }
      setContextMenuPetId(null);
    } catch (error) {
      console.error("Failed to delete pet", error);
    }
  };

  const getHealthStatusColor = (pet: Pet) => {
    const xpProgress = pet.total_xp % 100;
    if (xpProgress >= 70) return "border-green-500 bg-green-50";
    if (xpProgress >= 30) return "border-yellow-500 bg-yellow-50";
    return "border-orange-500 bg-orange-50";
  };

  const getHealthStatusBadge = (pet: Pet) => {
    const xpProgress = pet.total_xp % 100;
    if (xpProgress >= 70) return { color: "bg-green-500", text: "Healthy" };
    if (xpProgress >= 30) return { color: "bg-yellow-500", text: "Needs Care" };
    return { color: "bg-orange-500", text: "Attention" };
  };

  const handleCardClick = (petId: number) => {
    setActivePetId(petId);
    localStorage.setItem("activePetId", String(petId));
    setContextMenuPetId(null);
  };

  const handleLongPress = (petId: number) => {
    setContextMenuPetId(contextMenuPetId === petId ? null : petId);
  };

  let pressTimer: NodeJS.Timeout | null = null;

  const handleMouseDown = (petId: number) => {
    pressTimer = setTimeout(() => {
      handleLongPress(petId);
    }, 600);
  };

  const handleMouseUp = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setFormData({});
  };

  return (
    <>
      <ChatPetsWidget />
      <div className="min-h-screen bg-white pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
            <div>
              <h1 className="text-6xl font-black uppercase tracking-tighter mb-4 leading-none">
                My <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">Pets</span>
              </h1>
              <p className="text-xl text-gray-500 font-medium max-w-2xl">
                Manage your companions, track their growth, and keep them healthy. 
                Tap a card to set as active.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 bg-black text-white font-black uppercase tracking-widest hover:bg-orange-600 transition-all duration-300 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 flex items-center gap-3"
            >
              <Plus className="w-6 h-6" /> Add New Pet
            </button>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center py-32">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-black"></div>
            </div>
          ) : pets.length === 0 ? (
            /* Empty State */
            <div className="text-center py-32 bg-gray-50 border-4 border-dashed border-gray-200 rounded-3xl">
              <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <PawPrint className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 uppercase mb-2">No pets yet</h3>
              <p className="text-gray-500 mb-8 text-lg">Add your first companion to start the adventure!</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-orange-600 font-black uppercase tracking-widest hover:underline text-lg"
              >
                Add Pet Now
              </button>
            </div>
          ) : (
            /* Pet Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pets.map((pet) => {
                const isActive = activePetId === pet.id;
                const status = getHealthStatusBadge(pet);
                const statusStyles = getHealthStatusColor(pet);

                return (
                  <div
                    key={pet.id}
                    className={`relative group cursor-pointer transition-all duration-300 rounded-3xl overflow-hidden border-4 ${
                      isActive 
                        ? "border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] -translate-y-2" 
                        : "border-gray-100 hover:border-gray-300 hover:shadow-xl"
                    } bg-white`}
                    onClick={() => handleCardClick(pet.id)}
                    onMouseDown={() => handleMouseDown(pet.id)}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={() => handleMouseDown(pet.id)}
                    onTouchEnd={handleMouseUp}
                  >
                    {/* Active Indicator */}
                    {isActive && (
                      <div className="absolute top-0 right-0 bg-black text-white px-6 py-2 rounded-bl-2xl z-10 font-black uppercase tracking-wider text-sm flex items-center gap-2">
                        <Crown className="w-4 h-4 text-yellow-400 fill-current" /> Active
                      </div>
                    )}

                    {/* Context Menu Button */}
                    <div className="absolute top-4 left-4 z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLongPress(pet.id);
                        }}
                        className="p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-black hover:text-white transition-colors shadow-sm border-2 border-transparent hover:border-black"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Context Menu Dropdown */}
                    {contextMenuPetId === pet.id && (
                      <div className="absolute top-16 left-4 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-30 w-48 rounded-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            alert("Edit functionality coming soon!");
                            setContextMenuPetId(null);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 font-bold uppercase text-sm border-b-2 border-gray-100"
                        >
                          <Edit2 className="w-4 h-4" /> Edit Details
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePet(pet.id);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-red-50 text-red-600 flex items-center gap-3 font-bold uppercase text-sm"
                        >
                          <Trash2 className="w-4 h-4" /> Archive Pet
                        </button>
                      </div>
                    )}

                    {/* Card Content */}
                    <div className="p-8">
                      {/* Avatar & Status */}
                      <div className="flex justify-center mb-6 relative">
                        <div className={`w-32 h-32 rounded-full border-4 p-1 ${statusStyles.split(' ')[0]}`}>
                          <img 
                            src={pet.avatar_url} 
                            alt={pet.name} 
                            className="w-full h-full object-cover rounded-full"
                          />
                        </div>
                        <div className={`absolute -bottom-3 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider text-white shadow-md ${status.color}`}>
                          {status.text}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="text-center mb-8">
                        <h3 className="text-3xl font-black uppercase mb-1 tracking-tight">{pet.name}</h3>
                        <p className="text-gray-500 font-bold uppercase tracking-wide text-sm">
                          {pet.breed || "Unknown Breed"}
                        </p>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50 p-3 rounded-xl text-center border-2 border-gray-100">
                          <div className="text-xs font-black text-gray-400 uppercase mb-1">Level</div>
                          <div className="text-2xl font-black text-black">{pet.level}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl text-center border-2 border-gray-100">
                          <div className="text-xs font-black text-gray-400 uppercase mb-1">Coins</div>
                          <div className="text-2xl font-black text-yellow-600">{pet.coins}</div>
                        </div>
                      </div>

                      {/* XP Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-black uppercase text-gray-400">
                          <span>XP Progress</span>
                          <span>{pet.total_xp % 100} / 100</span>
                        </div>
                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                          <div
                            className={`h-full transition-all duration-500 ${status.color}`}
                            style={{ width: `${pet.total_xp % 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Floating Action Button (Mobile/Desktop) */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 bg-black text-white rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:bg-orange-600 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center z-40 md:hidden"
          aria-label="Add New Pet"
        >
          <Plus className="w-8 h-8" />
        </button>

        {/* Add Pet Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg p-8 relative border-4 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              <button
                onClick={handleModalClose}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="text-center mb-8">
                <div className="inline-block p-3 bg-orange-100 rounded-full mb-4">
                  <PawPrint className="w-8 h-8 text-orange-600" />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tight">Add New Companion</h2>
                <p className="text-gray-500 font-medium mt-2">Start a new adventure with your pet</p>
              </div>

              {/* CustomForm for Name and Avatar URL */}
              <div>
                <CustomForm
                  id="add_pet_form"
                  schema={allConfigs.add_pet_form.jsonSchema}
                  formData={formData}
                  onChange={(data) => setFormData(data)}
                  onSubmit={handleAddPet}
                  theme={formTheme}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
  
