"use client"

import React, { useState } from "react"
import { Search, UserPlus, MoreHorizontal, Users, Plus, MapPin, Clock, Heart, MessageCircle, ChevronRight } from "lucide-react"
import { Friend, FriendsFeed, Group } from "./models/friend-models"
import { getFriends, getFriendsFeed, getFriendsGroups } from "./ReadData"

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [feed, setFeed] = useState<FriendsFeed[]>([])

  React.useEffect(() => {
    setFriends(getFriends())
    setGroups(getFriendsGroups())
    setFeed(getFriendsFeed())
  }, [])

  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"feed" | "friends" | "groups">("feed")
  const [likedPosts, setLikedPosts] = useState<number[]>([1])

  const filteredFriends = friends.filter((friend) => friend.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const getStatusColor = (status: Friend["status"]) => {
    switch (status) {
      case "drinking":
        return "bg-primary"
      case "online":
        return "bg-blue-400"
      default:
        return "bg-gray-500"
    }
  }

  const toggleLike = (id: number) => {
    setLikedPosts((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-lg z-10 px-5 pt-6 pb-4 lg:px-8 border-b border-white/5">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-foreground">Social</h1>
          <button className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-background" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search friends, groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card rounded-2xl py-3 pl-12 pr-4 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("feed")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === "feed" ? "bg-primary text-background" : "bg-card text-foreground-muted"
              }`}
          >
            Feed
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === "friends" ? "bg-primary text-background" : "bg-card text-foreground-muted"
              }`}
          >
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab("groups")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === "groups" ? "bg-primary text-background" : "bg-card text-foreground-muted"
              }`}
          >
            Groups ({groups.length})
          </button>
        </div>
      </header>

      <main className="px-5 pb-24 lg:px-8 pt-4">
        {activeTab === "feed" && (
          <div className="space-y-4">
            {feed.map((activity) => (
              <div key={activity.id} className="bg-card rounded-2xl p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      <img
                        src={activity.user.avatar || "/placeholder.svg"}
                        alt={activity.user.name}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-card flex items-center justify-center text-sm">
                      {activity.drinkIcon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground">
                      <span className="font-semibold">{activity.user.name}</span>{" "}
                      <span className="text-foreground-muted">{activity.action}</span>{" "}
                      <span className="font-semibold text-primary">{activity.drink}</span>
                    </p>
                    <div className="flex items-center gap-2 text-sm text-foreground-muted mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{activity.time}</span>
                      {activity.location && (
                        <>
                          <span>•</span>
                          <MapPin className="w-3 h-3" />
                          <span>{activity.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 pt-3 border-t border-white/5">
                  <button onClick={() => toggleLike(activity.id)} className="flex items-center gap-2 text-sm">
                    <Heart
                      className={`w-5 h-5 ${likedPosts.includes(activity.id) ? "fill-red-500 text-red-500" : "text-foreground-muted"}`}
                    />
                    <span className="text-foreground-muted">
                      {activity.likes + (likedPosts.includes(activity.id) && !activity.liked ? 1 : 0)}
                    </span>
                  </button>
                  <button className="flex items-center gap-2 text-sm text-foreground-muted">
                    <MessageCircle className="w-5 h-5" />
                    <span>{activity.comments}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Friends Tab Content */}
        {activeTab === "friends" && (
          <div className="space-y-3">
            {filteredFriends.map((friend) => (
              <div key={friend.id} className="bg-card rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full overflow-hidden">
                      <img
                        src={friend.avatar || "/placeholder.svg"}
                        alt={friend.name}
                        width={56}
                        height={56}
                        className="object-cover"
                      />
                    </div>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card ${getStatusColor(friend.status)}`}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{friend.name}</p>
                    <p className="text-sm text-foreground-muted">
                      {friend.status === "drinking" ? (
                        <span className="text-primary">
                          {friend.drinksTonight} drinks • {friend.lastDrink}
                        </span>
                      ) : friend.status === "online" ? (
                        "Online"
                      ) : (
                        "Offline"
                      )}
                    </p>
                  </div>
                </div>
                <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                  <MoreHorizontal className="w-5 h-5 text-foreground-muted" />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "groups" && (
          <div className="space-y-3">
            {/* Create Group Button */}
            <button className="w-full bg-primary/10 border-2 border-dashed border-primary/30 rounded-2xl p-4 flex items-center justify-center gap-3 hover:bg-primary/20 transition-colors">
              <Plus className="w-5 h-5 text-primary" />
              <span className="font-medium text-primary">Create New Group</span>
            </button>

            {groups.map((group) => (
              <div
                key={group.id}
                className={`bg-card rounded-2xl p-4 ${group.isActive ? "ring-1 ring-primary/30" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{group.name}</p>
                        {group.isActive && (
                          <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full">Active</span>
                        )}
                      </div>
                      <p className="text-sm text-foreground-muted">
                        {group.members.length} members • {group.activeDrinks} drinks tonight
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-foreground-muted" />
                </div>

                {/* Member Avatars */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                  <div className="flex -space-x-2">
                    {group.members.slice(0, 4).map((member, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-card overflow-hidden">
                        <img
                          src={member.avatar || "/placeholder.svg"}
                          alt="Member"
                          width={32}
                          height={32}
                          className="object-cover"
                        />
                      </div>
                    ))}
                    {group.members.length > 4 && (
                      <div className="w-8 h-8 rounded-full border-2 border-card bg-white/10 flex items-center justify-center text-xs text-foreground-muted">
                        +{group.members.length - 4}
                      </div>
                    )}
                  </div>
                  <button className="ml-auto px-4 py-1.5 bg-primary/20 text-primary text-sm font-medium rounded-full hover:bg-primary/30 transition-colors">
                    {group.isActive ? "Join Session" : "Start Session"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
