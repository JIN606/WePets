


import React, { useState, useEffect } from "react";
import { useAuth } from "@hey-boss/users-service/react";
import { User, Mail, LogOut, Camera, Check, X, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.picture || "");
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [tempAvatarFile, setTempAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (user) {
      setDisplayName(user.name || "");
      setAvatarUrl(user.picture || "");
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setTempAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/upload/avatar", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("Upload failed");
    const data = await response.json();
    return data.url;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let finalAvatarUrl = avatarUrl;

      if (tempAvatarFile) {
        setUploadingAvatar(true);
        finalAvatarUrl = await uploadAvatar(tempAvatarFile);
        setUploadingAvatar(false);
      }

      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: displayName,
          picture: previewUrl || finalAvatarUrl,
        }),
      });

      if (!response.ok) throw new Error("Update failed");

      setAvatarUrl(previewUrl || finalAvatarUrl);
      setPreviewUrl("");
      setTempAvatarFile(null);
      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
      setUploadingAvatar(false);
    }
  };

  const handleCancel = () => {
    setDisplayName(user?.name || "");
    setAvatarUrl(user?.picture || "");
    setPreviewUrl("");
    setTempAvatarFile(null);
    setIsEditing(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-black uppercase tracking-tighter mb-12">My Profile</h1>

        <div className="bg-white border-2 border-black p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-8">
            <div className="relative">
              <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center border-4 border-black overflow-hidden">
                {previewUrl || avatarUrl ? (
                  <img src={previewUrl || avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-gray-400" />
                )}
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-black text-white p-2 rounded-full cursor-pointer hover:bg-orange-600 transition-colors">
                  <Camera className="w-5 h-5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="flex-1 w-full">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold uppercase text-gray-500 mb-2 block">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-black font-bold uppercase focus:outline-none focus:border-orange-500"
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold uppercase text-gray-500 mb-2 block">Email</label>
                    <div className="flex items-center gap-2 text-gray-700 font-medium px-4 py-3 bg-gray-50 border-2 border-gray-200">
                      <Mail className="w-4 h-4" /> {user.email}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-3xl font-black uppercase mb-2">{displayName || "Adventurer"}</h2>
                  <div className="flex items-center gap-2 text-gray-500 font-medium">
                    <Mail className="w-4 h-4" /> {user.email}
                  </div>
                </div>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="border-t border-gray-100 pt-8 flex gap-4">
              <button
                onClick={handleSave}
                disabled={isSaving || uploadingAvatar}
                className="flex-1 px-6 py-3 bg-green-600 text-white font-bold uppercase hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving || uploadingAvatar ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" /> Save Changes
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving || uploadingAvatar}
                className="flex-1 px-6 py-3 border-2 border-gray-600 text-gray-600 font-bold uppercase hover:bg-gray-600 hover:text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" /> Cancel
              </button>
            </div>
          ) : (
            <div className="border-t border-gray-100 pt-8 flex gap-4">
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 bg-black text-white font-bold uppercase hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                <User className="w-5 h-5" /> Edit Profile
              </button>
              <button
                onClick={handleLogout}
                className="px-6 py-3 border-2 border-red-600 text-red-600 font-bold uppercase hover:bg-red-600 hover:text-white transition-colors flex items-center gap-2"
              >
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
  

