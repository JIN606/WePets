

/**
 * @description MessagesPage component that allows users to add friends and chat with them in real-time.
 * This page features a tabbed interface with "Add Friend" and "Messages" tabs.
 * Users can search for friends, send friend requests, accept/reject requests, and send messages.
 * Messages are fetched and sent via API, with polling for real-time updates.
 */

import React, { useEffect, useState } from "react";
import { useAuth } from "@hey-boss/users-service/react";
import { Search, UserPlus, Check, X, Users, Loader2, Send, MessageCircle, User } from "lucide-react";

export const MessagesPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"friends" | "messages">("messages");
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<any>(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      loadFriends();
      loadPendingRequests();
    }
  }, [user, authLoading]);

  useEffect(() => {
    let interval: any;
    if (selectedFriend && activeTab === "messages") {
      loadMessages(selectedFriend.id);
      interval = setInterval(() => loadMessages(selectedFriend.id), 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedFriend, activeTab]);

  const loadFriends = async () => {
    try {
      const res = await fetch("/api/friendships/accepted");
      if (res.ok) {
        const data = await res.json();
        setFriends(data);
      }
    } catch (err) {
      console.error("Failed to load friends:", err);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const res = await fetch("/api/friendships/pending");
      if (res.ok) {
        const data = await res.json();
        setPendingRequests(data);
      }
    } catch (err) {
      console.error("Failed to load pending requests:", err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error("Search failed:", err);
    }
    setIsSearching(false);
  };

  const addFriend = async (friendId: number) => {
    try {
      const res = await fetch("/api/friendships/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friend_id: friendId }),
      });
      if (res.ok) {
        alert("Friend request sent!");
        setSearchResults([]);
        setSearchQuery("");
      } else {
        alert("Failed to send friend request.");
      }
    } catch (err) {
      console.error("Add friend failed:", err);
    }
  };

  const acceptFriend = async (friendshipId: number) => {
    try {
      const res = await fetch("/api/friendships/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendship_id: friendshipId }),
      });
      if (res.ok) {
        loadFriends();
        loadPendingRequests();
      }
    } catch (err) {
      console.error("Accept friend failed:", err);
    }
  };

  const rejectFriend = async (friendshipId: number) => {
    try {
      const res = await fetch("/api/friendships/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendship_id: friendshipId }),
      });
      if (res.ok) {
        loadPendingRequests();
      }
    } catch (err) {
      console.error("Reject friend failed:", err);
    }
  };

  const loadMessages = async (friendId: number) => {
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`/api/messages?friend_id=${friendId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
    setIsLoadingMessages(false);
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedFriend) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiver_user_id: selectedFriend.id,
          content: messageInput,
        }),
      });
      if (res.ok) {
        setMessageInput("");
        loadMessages(selectedFriend.id);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
    setIsSending(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-gray-900 mb-4 flex items-center justify-center gap-3 uppercase tracking-tighter">
            Squad <span className="text-green-600">Chat</span>
          </h1>
          <p className="text-xl text-gray-700 font-medium">Connect with your pet friends</p>
        </div>

        <div className="bg-white rounded-3xl shadow-[8px_8px_0px_0px_rgba(22,163,74,1)] overflow-hidden border-4 border-green-600">
          <div className="border-b-4 border-green-600">
            <div className="flex">
              <button
                onClick={() => setActiveTab("messages")}
                className={`flex-1 py-5 px-6 text-center font-black uppercase tracking-wider transition-all ${
                  activeTab === "messages"
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-500 hover:bg-green-50 hover:text-green-600"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Messages
                </div>
              </button>
              <div className="w-1 bg-green-600"></div>
              <button
                onClick={() => setActiveTab("friends")}
                className={`flex-1 py-5 px-6 text-center font-black uppercase tracking-wider transition-all ${
                  activeTab === "friends"
                    ? "bg-green-600 text-white"
                    : "bg-white text-gray-500 hover:bg-green-50 hover:text-green-600"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-5 h-5" />
                  Add Friend
                </div>
              </button>
            </div>
          </div>

          <div className="p-8 bg-white">
            {activeTab === "friends" && (
              <div>
                <div className="mb-8">
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      placeholder="Search by username or email..."
                      className="flex-1 px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-600 focus:ring-0 font-bold text-gray-900 placeholder-gray-400 transition-colors"
                    />
                    <button
                      onClick={handleSearch}
                      disabled={isSearching}
                      className="px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all flex items-center gap-2 disabled:opacity-50 font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                    >
                      {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                      Search
                    </button>
                  </div>
                </div>

                {searchResults.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-black mb-4 text-gray-900 uppercase tracking-wide">Search Results</h3>
                    <div className="space-y-3">
                      {searchResults.map((result: any) => (
                        <div key={result.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-xl border-2 border-gray-100 hover:border-green-200 transition-colors">
                          <div>
                            <div className="font-bold text-lg text-gray-900">{result.email}</div>
                            {result.name && <div className="text-sm font-medium text-gray-500">{result.name}</div>}
                          </div>
                          <button
                            onClick={() => addFriend(result.id)}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2 font-bold uppercase text-sm shadow-sm hover:shadow-md"
                          >
                            <UserPlus className="w-4 h-4" />
                            Add Friend
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {pendingRequests.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-black mb-4 text-gray-900 uppercase tracking-wide">Pending Requests</h3>
                    <div className="space-y-3">
                      {pendingRequests.map((request: any) => (
                        <div key={request.id} className="flex items-center justify-between p-6 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                          <div className="text-gray-900 font-bold">Friend request from user ID: {request.user_id}</div>
                          <div className="flex gap-3">
                            <button
                              onClick={() => acceptFriend(request.id)}
                              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2 font-bold uppercase text-sm shadow-sm"
                            >
                              <Check className="w-4 h-4" />
                              Accept
                            </button>
                            <button
                              onClick={() => rejectFriend(request.id)}
                              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center gap-2 font-bold uppercase text-sm shadow-sm"
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-black mb-4 text-gray-900 uppercase tracking-wide">Your Friends</h3>
                  {friends.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No friends yet. Search and add some above!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {friends.map((friend: any) => (
                        <div key={friend.id} className="p-6 bg-green-50 rounded-xl border-2 border-green-100 hover:border-green-300 transition-all">
                          <div className="font-bold text-lg text-gray-900">{friend.user_email}</div>
                          {friend.user_name && <div className="text-sm font-medium text-gray-600">{friend.user_name}</div>}
                          <div className="text-sm font-bold text-green-600 mt-2 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Total Score: {friend.total_score}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "messages" && (
              <div className="flex flex-col md:flex-row gap-8 h-[600px]">
                <div className="w-full md:w-1/3 border-r-0 md:border-r-2 border-gray-100 pr-0 md:pr-6 overflow-y-auto">
                  <h3 className="text-xl font-black mb-6 text-gray-900 uppercase tracking-wide sticky top-0 bg-white py-2 z-10">Friends</h3>
                  {friends.length === 0 ? (
                    <p className="text-gray-500 font-medium text-center py-8">No friends to chat with yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {friends.map((friend: any) => (
                        <button
                          key={friend.id}
                          onClick={() => setSelectedFriend(friend)}
                          className={`w-full text-left p-4 rounded-xl transition-all border-2 ${
                            selectedFriend?.id === friend.id
                              ? "bg-green-600 text-white border-green-600 shadow-md"
                              : "bg-white text-gray-900 border-gray-100 hover:border-green-200 hover:bg-green-50"
                          }`}
                        >
                          <div className="font-bold truncate">{friend.user_email}</div>
                          {friend.user_name && (
                            <div className={`text-sm font-medium truncate ${selectedFriend?.id === friend.id ? "text-green-100" : "text-gray-500"}`}>
                              {friend.user_name}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col bg-gray-50 rounded-2xl border-2 border-gray-100 overflow-hidden">
                  {!selectedFriend ? (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      <div className="text-center p-8">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <MessageCircle className="w-10 h-10 text-gray-300" />
                        </div>
                        <p className="font-bold text-lg">Select a friend to start chatting</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full">
                      <div className="p-6 bg-white border-b-2 border-gray-100 flex items-center gap-4 shadow-sm z-10">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center border-2 border-green-200 overflow-hidden">
                          {selectedFriend.user_picture ? (
                            <img src={selectedFriend.user_picture} alt={selectedFriend.user_name || selectedFriend.user_email} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-6 h-6 text-green-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-black text-gray-900 truncate">{selectedFriend.user_name || selectedFriend.user_email}</h3>
                          <div className="flex items-center gap-2 text-xs font-bold text-green-600 uppercase tracking-wider">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Online
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {isLoadingMessages && messages.length === 0 ? (
                          <div className="flex justify-center py-8">
                            <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                          </div>
                        ) : messages.length === 0 ? (
                          <div className="text-center py-12">
                            <p className="text-gray-400 font-medium">No messages yet. Say hello! 👋</p>
                          </div>
                        ) : (
                          messages.map((msg: any) => (
                            <div
                              key={msg.id}
                              className={`flex ${msg.is_sender ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[75%] px-5 py-3 rounded-2xl shadow-sm ${
                                  msg.is_sender
                                    ? "bg-green-600 text-white rounded-tr-none"
                                    : "bg-white text-gray-900 border-2 border-gray-100 rounded-tl-none"
                                }`}
                              >
                                <p className="font-medium leading-relaxed">{msg.content}</p>
                                <p className={`text-[10px] mt-1 font-bold uppercase tracking-wider ${msg.is_sender ? "text-green-100" : "text-gray-400"}`}>
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="p-4 bg-white border-t-2 border-gray-100">
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !isSending && sendMessage()}
                            placeholder="Type a message..."
                            className="flex-1 px-5 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-green-600 focus:bg-white transition-all font-medium"
                          />
                          <button
                            onClick={sendMessage}
                            disabled={isSending || !messageInput.trim()}
                            className="px-5 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                          >
                            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

