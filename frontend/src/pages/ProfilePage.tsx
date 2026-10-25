import { IoArrowBack, IoArrowForward, IoLogoInstagram } from "react-icons/io5";
import { FiBarChart2, FiCheck } from "react-icons/fi";
import { TbEdit, TbUserPlus } from "react-icons/tb";
import { LuPenLine } from "react-icons/lu";
import { useEffect, useRef, useState } from "react";
import EditProfilModal from "../components/EditProfileModal";
import Cookies from "js-cookie";
import Post from "../components/Post";
import { useCurrentUser } from "../context/UserContext";
import Avatar from "../components/Avatar";
import ThreadsModal from "../components/CreateThreadModal";
import FollowersModal from "../components/FollowersModal";
import { useNavigate, useParams } from "react-router-dom";
import { HiUserAdd } from "react-icons/hi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Loader from "../components/Loader";

interface UserProfileData {
  id: string;
  name: string;
  bio?: string;
  avatar?: string;
  avatarPath?: string;
  _count?: {
    followedBy: number;
    following: number;
  };
  isFollowing?: boolean;
}

const API_URL = import.meta.env.VITE_API_URL;

const getUserIdFromJwt=():string | null =>{
  const token=Cookies.get('token')
  if(!token){
    return null
  }
  try {
    const payload=JSON.parse(atob(token.split('.')[1]))
    return payload.id || payload.sub || payload.userId || null
  } catch (error) {
    return null
  }
}

const Profile = () => {
  const [activeTab, setActiveTab] = useState("threads");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isFollowLoading,setIsFollowLoading]=useState(false)
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [createThreadModal, setCreateThreadModal] = useState(false);

  const { user: globalUser } = useCurrentUser();
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [expandedImage, setExpandedImage] = useState(false);
  const [openFollowersModal, setOpenFollowersModal] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();

  const replies: any[] = [];
  const media: any[] = [];
  const currentUserId=globalUser?.id || getUserIdFromJwt()
  const isOwnProfile = !id || id === currentUserId;
  const targetUserId = id || currentUserId;

  const fetchUserPosts = async () => {
    const token = Cookies.get("token");
    const endpoint = isOwnProfile
      ? `${API_URL}/post/my-posts`
      : `${API_URL}/post/user/${targetUserId}`;

    const res = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch post");
    }
    return res.json();
  };

  const { data: rawPost, isLoading: isPostsLoading } = useQuery({
    queryKey: ["posts", targetUserId],
    queryFn: fetchUserPosts,
    enabled: !!targetUserId,
  });
  const userPost = Array.isArray(rawPost) ? rawPost : rawPost?.data || [];

  const fetchUserReposts = async () => {
    const token = Cookies.get("token");

    const res = await fetch(`${API_URL}/post/${targetUserId}/reposts`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error("Failed to fetch reposts");
    }
    return res.json();
  };

  const { data: repostsData, isLoading: isRepostsLoading } = useQuery({
    queryKey: ["reposts", targetUserId],
    queryFn: fetchUserReposts,
    enabled: !!targetUserId && activeTab === "repost",
  });

  const userReposts = Array.isArray(repostsData) ? repostsData : [];

  useEffect(() => {
    if (isOwnProfile && globalUser) {
      setUserProfile((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          name: globalUser.name,
          bio: globalUser.bio,
          avatar: globalUser.avatar || undefined,
          avatarPath: globalUser.avatar || undefined,
        };
      });
    }
  }, [globalUser, isOwnProfile]);

  useEffect(() => {
    if (!targetUserId) return;

    const handleProfileUser = async () => {
      setIsProfileLoading(true);
      try {
        const token = Cookies.get("token");

        const res = await fetch(`${API_URL}/user/${targetUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUserProfile(data);
        }
      } catch (error) {
        console.error("Error fetching profile", error);
      } finally {
        setIsProfileLoading(false);
      }
    };
    handleProfileUser();
  }, [targetUserId]);

  const handleFollowToggle = async () => {
    if (!userProfile || isOwnProfile || isFollowLoading) return;
    const previousProfile=userProfile
    const isNewFollowing = !userProfile.isFollowing;
    setIsFollowLoading(true)

    setUserProfile((prev)=>
      prev ?
      {
       ...prev,
       isFollowing:isNewFollowing,
       _count:{
        following:prev._count?.following || 0,
        followedBy:isNewFollowing 
        ? (prev._count?.followedBy || 0) + 1
        : Math.max(0,(prev._count?.followedBy || 0) -1),
       },
    }
    :null
  )
    try {
      const token = Cookies.get("token");
      const res=await fetch(`${API_URL}/user/${userProfile.id}/follow`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if(!res.ok){
        throw new Error('Failed to toggle follow')
      }
    } catch (error) {
      console.error(error);
      setUserProfile(previousProfile)
    }finally{
      setIsFollowLoading(false)
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = 240;
      if (direction === "left") {
        current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else {
        current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }
  };

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 1);
  };

  if (isProfileLoading || !userProfile) {
    return (
      <div className="bg-black flex flex-col text-white relative h-screen w-full overflow-hidden font-sans">
        <div className="shrink-0 h-10 flex items-center justify-center px-4 z-50 bg-transparent py-8">
          <span className="text-white font-semibold text-[17px]">Профіль</span>
        </div>
        <div className="mx-auto max-w-2xl bg-[#181818] rounded-t-3xl border-x border-t border-b-0 border-[#333] w-full flex-1 flex items-center justify-center">
          <Loader size={36} className="animate-spin text-white"/>
        </div>
      </div>
    );
  }

  const avatarUrl =
    userProfile?.avatarPath || userProfile?.avatar || "/person.png";

  const isPostsDone = userPost.length > 0;
  const isBioDone = !!(userProfile?.bio && userProfile.bio.length > 0);
  const isAvatarDone = Boolean(userProfile?.avatarPath || userProfile?.avatar);
  const isFollowingDone = Boolean(
    userProfile?._count?.following && userProfile._count.following > 0
  );

  return (
    <div className="bg-black flex flex-col text-white relative h-screen w-full overflow-hidden font-sans">
      <div className="shrink-0 h-10 flex items-center justify-center px-4 z-50 bg-transparent py-8 ">
        <div className="flex justify-center items-center">
          <span className="text-white font-semibold text-[17px]">Профіль</span>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="mx-auto max-w-2xl overflow-y-auto scrollbar-hide bg-[#181818] rounded-t-3xl border-x border-t border-b-0 border-[#333] w-full flex-1">
        <div className="relative w-full mx-auto py-6 flex flex-col ">
          <div className="flex justify-between items-start ml-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold leading-tight">
                {userProfile?.name}
              </h1>
              <div className="flex items-center gap-1">
                <p className="text-white text-[15px]">
                  @{userProfile.name.toLowerCase().replace(/\s/g, "")}
                </p>
              </div>
            </div>
            <div
              onClick={() => setExpandedImage(true)}
              className="h-20 w-20 mr-5 cursor-pointer duration-200 active:scale-90"
            >
              <div className="w-full h-full rounded-full overflow-hidden border border-[#333]">
                <Avatar src={avatarUrl} alt="avatar" />
              </div>
            </div>
          </div>

          <div className="flex items-center ml-6">
            <p className="mt-4 text-[15px] whitespace-pre-wrap text-neutral-300">
              {userProfile?.bio || ""}
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between text-[#616161] text-[15px]">
            <div>
              <span
                onClick={() => setOpenFollowersModal(true)}
                className="hover:underline cursor-pointer ml-6"
              >
                {userProfile?._count?.followedBy} читачів
              </span>
            </div>
            <div className="flex gap-4 text-2xl mr-6">
              <FiBarChart2
                size={28}
                className="text-white cursor-pointer transition"
              />
              <IoLogoInstagram
                size={28}
                className="text-white cursor-pointer transition"
              />
            </div>
          </div>
          {isOwnProfile ? (
            <button
              onClick={() => setEditProfileModal(true)}
              className="w-[calc(100%-48px)] mx-6 mt-6 py-1.5 border border-[#3a3a3a] rounded-xl font-semibold text-[15px] transition hover:bg-[#2a2a2a]"
            >
              Змінити профіль
            </button>
          ) : (
            <button
              onClick={handleFollowToggle}
              disabled={isFollowLoading}
              className={`w-[calc(100%-48px)] mx-6 mt-6 py-1.5 rounded-xl font-semibold text-[15px] transition duration-200
                ${
                  userProfile.isFollowing
                    ? "bg-transparent border border-[#3a3a3a] text-white hover:bg-[#2a2a2a]"
                    : "bg-white text-black hover:bg-neutral-200"
                }`}
            >
              {userProfile.isFollowing ? "Відстежується" : "Стежити"}
            </button>
          )}

          <div className="flex mt-2 border-b border-[#3a3a3a]">
            <div
              onClick={() => setActiveTab("threads")}
              className={`flex-1 text-center py-3 cursor-pointer font-medium text-[15px] border-b transition-colors duration-200
                ${
                  activeTab === "threads"
                    ? "text-white border-white"
                    : "text-[#616161] border-transparent hover:text-[#a0a0a0]"
                }`}
            >
              Ланцюжки
            </div>
            <div
              onClick={() => setActiveTab("replies")}
              className={`flex-1 text-center py-3 cursor-pointer font-medium text-[15px] border-b transition-colors duration-200 ${
                activeTab === "replies"
                  ? "text-white border-white"
                  : "text-[#616161] border-transparent hover:text-[#a0a0a0]"
              }`}
            >
              Відповіді
            </div>
            <div
              onClick={() => setActiveTab("media")}
              className={`flex-1 text-center py-3 cursor-pointer font-medium text-[15px] border-b transition-colors duration-200 ${
                activeTab === "media"
                  ? "text-white border-white"
                  : "text-[#616161] border-transparent hover:text-[#a0a0a0]"
              }`}
            >
              Медіафайли
            </div>
            <div
              onClick={() => setActiveTab("repost")}
              className={`flex-1 text-center py-3 cursor-pointer font-medium text-[15px] border-b transition-colors duration-200 ${
                activeTab === "repost"
                  ? "text-white border-white"
                  : "text-[#616161] border-transparent hover:text-[#a0a0a0]"
              }`}
            >
              Репости
            </div>
          </div>

          {activeTab === "threads" && isOwnProfile && (
            <div className="flex items-center gap-3 py-4 border-b border-[#3a3a3a] px-6">
              <div className="h-9 w-9 rounded-full overflow-hidden border border-[#333]">
                <Avatar src={avatarUrl} alt="me" />
              </div>
              <div
                onClick={() => setCreateThreadModal(true)}
                className="text-[#616161] text-[15px] grow cursor-text"
              >
                Що нового?
              </div>
              <button
                onClick={() => setCreateThreadModal(true)}
                className="text-white text-[15px] border border-[#3a3a3a] px-4 py-1.5 rounded-xl font-semibold duration-200 active:scale-90"
              >
                Опублікувати
              </button>
            </div>
          )}

          {activeTab === "threads" && (
            <div className="pb-20">
              {isPostsLoading ? (
                <Loader size={32} className="pt-12" />
              ) : (() => {
                if (!isOwnProfile) {
                  return userPost.length > 0 ? (
                    <div className="flex flex-col">
                      {userPost.map((post: any) => (
                        <Post
                          key={post.id}
                          id={post.id}
                          title={post.title}
                          description={post.description}
                          image={post.image}
                          autor={post.autor}
                          createdAt={post.createdAt}
                          isLiked={post.isLiked}
                          isFollowing={post.autor?.isFollowing ?? post.isFollowing}
                          replyName={post.replyName}
                          repostCount={post.stats?.reposts ?? post._count?.reposts ?? 0}
                          stats={{
                            likes: post.stats?.likes ?? post._count?.reactions ?? 0,
                            dislike: 0,
                            comments: post.stats?.comments ?? post._count?.comments ?? 0,
                            reposts: post.stats?.reposts ?? post._count?.reposts ?? 0,
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center pt-16 text-[#616161] text-[15px]">
                      Ще немає публікацій.
                    </div>
                  );
                }

                const tasks = [
                  isPostsDone,
                  isBioDone,
                  isAvatarDone,
                  isFollowingDone,
                ];
                const completedCount = tasks.filter(Boolean).length;
                const remainingCount = tasks.length - completedCount;
                const allTasksCompleted = remainingCount === 0;

                return (
                  <>
                    {!allTasksCompleted && (
                      <div className="mt-6 mb-8 relative group border-b border-[#333] pb-8">
                        <div className="flex justify-between items-center mb-3 px-6">
                          <h3 className="text-[15px] font-semibold">
                            Заповніть свій профіль
                          </h3>
                          <span className="text-[15px] text-[#616161]">
                            Залишилося {remainingCount}
                          </span>
                        </div>

                        {showLeftArrow && (
                          <button
                            onClick={() => scroll("left")}
                            className="absolute left-2 top-[55%] z-10 w-8 h-8 bg-[#616161]/90 border border-[#333] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#333] transition shadow-lg"
                          >
                            <IoArrowBack size={16} />
                          </button>
                        )}

                        {showRightArrow && (
                          <button
                            onClick={() => scroll("right")}
                            className="absolute right-2 top-[55%] z-10 w-8 h-8 bg-[#616161]/90 border border-[#333] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#333] transition shadow-lg"
                          >
                            <IoArrowForward size={16} />
                          </button>
                        )}

                        <div
                          ref={scrollRef}
                          onScroll={checkScroll}
                          className="flex gap-2 overflow-x-auto scrollbar-hide px-6"
                        >
                          <div className="min-w-[205px] w-[205px] bg-[#1E1E1E] p-4 rounded-2xl flex flex-col items-center text-center shrink-0">
                            <div
                              className={`w-14 h-14 rounded-full border flex items-center justify-center mb-2 shrink-0 transition-colors duration-200
                                ${
                                  isPostsDone
                                    ? "bg-[#1a1a1a] border-[#333] text-[#616161]"
                                    : "bg-black border-white/10 text-white"
                                }`}
                            >
                              {isPostsDone ? (
                                <FiCheck size={28} />
                              ) : (
                                <TbEdit size={28} />
                              )}
                            </div>
                            <h4 className="font-bold text-sm mb-1 text-white">
                              Створіть ланцюжок
                            </h4>
                            <p className="text-[#616161] text-[13px] leading-4 mb-4 px-2">
                              Розкажіть, що у вас на думці.
                            </p>
                            <button
                              onClick={() => setCreateThreadModal(true)}
                              disabled={isPostsDone}
                              className={`w-full py-1.5 font-bold rounded-lg text-sm mt-auto transition-all duration-200 border
                                ${
                                  isPostsDone
                                    ? "bg-transparent border-[#333] text-[#616161] cursor-default"
                                    : "bg-white border-white text-black hover:bg-neutral-200"
                                }`}
                            >
                              {isPostsDone ? "Виконано" : "Створити"}
                            </button>
                          </div>

                          <div className="min-w-[205px] w-[205px] bg-[#1E1E1E] p-4 rounded-2xl flex flex-col items-center text-center shrink-0">
                            <div
                              className={`w-14 h-14 rounded-full border flex items-center justify-center mb-2 shrink-0 transition-colors duration-200
                                ${
                                  isFollowingDone
                                    ? "bg-[#1a1a1a] border-[#333] text-[#616161]"
                                    : "bg-black border-white/10 text-white"
                                }`}
                            >
                              {isFollowingDone ? (
                                <FiCheck size={28} />
                              ) : (
                                <TbUserPlus size={28} />
                              )}
                            </div>
                            <h4 className="font-bold text-sm mb-1 text-white">
                              Почніть стежити
                            </h4>
                            <p className="text-[#616161] text-[13px] leading-4 mb-4 px-2">
                              Наповніть свою стрічку.
                            </p>
                            <button
                              onClick={() => navigate("/search")}
                              disabled={isFollowingDone}
                              className={`w-full py-1.5 font-bold rounded-lg text-sm mt-auto transition-all duration-200 border
                                ${
                                  isFollowingDone
                                    ? "bg-transparent border-[#333] text-[#616161] cursor-default"
                                    : "bg-white border-white text-black hover:bg-neutral-200"
                                }`}
                            >
                              {isFollowingDone ? "Виконано" : "Стежити"}
                            </button>
                          </div>

                          <div className="min-w-[205px] w-[205px] bg-[#1E1E1E] p-4 rounded-2xl flex flex-col items-center text-center shrink-0">
                            <div
                              className={`w-14 h-14 rounded-full border flex items-center justify-center mb-2 shrink-0 transition-colors duration-200
                                ${
                                  isBioDone
                                    ? "bg-[#1a1a1a] border-[#333] text-[#616161]"
                                    : "bg-black border-white/10 text-white"
                                }`}
                            >
                              {isBioDone ? (
                                <FiCheck size={28} />
                              ) : (
                                <LuPenLine size={28} />
                              )}
                            </div>
                            <h4 className="font-bold text-sm mb-1 text-white">
                              Додайте біографію
                            </h4>
                            <p className="text-[#616161] text-[13px] leading-4 mb-4 px-2">
                              Представтеся людям.
                            </p>
                            <button
                              onClick={() =>
                                !isBioDone && setEditProfileModal(true)
                              }
                              disabled={isBioDone}
                              className={`w-full py-1.5 font-bold rounded-lg text-sm mt-auto transition-all duration-200 border
                                ${
                                  isBioDone
                                    ? "bg-transparent border-[#333] text-[#616161] cursor-default"
                                    : "bg-white border-white text-black hover:bg-neutral-200"
                                }`}
                            >
                              {isBioDone ? "Виконано" : "Додати"}
                            </button>
                          </div>

                          <div className="min-w-[205px] w-[205px] bg-[#1E1E1E] p-4 rounded-2xl flex flex-col items-center text-center shrink-0">
                            <div
                              className={`w-14 h-14 rounded-full border flex items-center justify-center mb-2 shrink-0 transition-colors duration-200
                                ${
                                  isAvatarDone
                                    ? "bg-[#1a1a1a] border-[#333] text-[#616161]"
                                    : "bg-black border-white/10 text-white"
                                }`}
                            >
                              {isAvatarDone ? (
                                <FiCheck size={28} />
                              ) : (
                                <HiUserAdd size={28} />
                              )}
                            </div>
                            <h4 className="font-bold text-sm mb-1 text-white">
                              Додайте світлину
                            </h4>
                            <p className="text-[#616161] text-[13px] leading-4 mb-4 px-2">
                              Щоб людям було легше вас упізнати.
                            </p>
                            <button
                              onClick={() =>
                                !isAvatarDone && setEditProfileModal(true)
                              }
                              disabled={isAvatarDone}
                              className={`w-full py-1.5 font-bold rounded-lg text-sm mt-auto transition-all duration-200 border
                                ${
                                  isAvatarDone
                                    ? "bg-transparent border-[#333] text-[#616161] cursor-default"
                                    : "bg-white border-white text-black hover:bg-neutral-200"
                                }`}
                            >
                              {isAvatarDone ? "Виконано" : "Додати"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {isPostsDone && (
                      <div className="flex flex-col">
                        {userPost.map((post: any) => (
                          <Post
                            key={post.id}
                            id={post.id}
                            title={post.title}
                            description={post.description}
                            image={post.image}
                            autor={post.autor}
                            createdAt={post.createdAt}
                            isLiked={post.isLiked}
                            isFollowing={post.autor?.isFollowing ?? post.isFollowing}
                            replyName={post.replyName}
                            repostCount={post.stats?.reposts ?? post._count?.reposts ?? 0}
                            stats={{
                              likes: post.stats?.likes ?? post._count?.reactions ?? 0,
                              dislike: 0,
                              comments: post.stats?.comments ?? post._count?.comments ?? 0,
                              reposts: post.stats?.reposts ?? post._count?.reposts ?? 0,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {activeTab === "replies" && (
            <div className="grow flex items-center justify-center pt-20">
              {replies.length > 0 ? (
                <div>Відповіді</div>
              ) : (
                <div className="text-[#616161] text-[15px]">
                  Ще немає відповідей.
                </div>
              )}
            </div>
          )}

          {activeTab === "media" && (
            <div className="grow flex items-center justify-center pt-20">
              {media.length > 0 ? (
                <div>Медіа</div>
              ) : (
                <div className="text-[#616161] text-[15px]">
                  Ще немає медіафайлів.
                </div>
              )}
            </div>
          )}

          {activeTab === "repost" && (
            <div className="pb-20">
              {isRepostsLoading ? (
                <Loader size={32} className="pt-12" />
              ) : userReposts.length > 0 ? (
                <div className="flex flex-col">
                  {userReposts.map((post: any) => (
                    <Post
                      key={post.repostId}
                      id={post.id}
                      title={post.title}
                      description={post.description}
                      image={post.image}
                      autor={post.autor}
                      createdAt={post.createdAt}
                      isLiked={post.isLiked}
                      isFollowing={post.autor?.isFollowing}
                      isRepostByMe={post.isRepostedByMe}
                      replyName={post.replyName}
                      repostCount={post.stats?.reposts || 0}
                      stats={{
                        likes: post.stats?.likes || 0,
                        dislike: 0,
                        comments: post.stats?.comments || 0,
                        reposts: post.stats?.reposts || 0,
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="grow flex items-center justify-center pt-20">
                  <div className="text-[#616161] text-[15px]">
                    Репостів ще немає.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {openFollowersModal && userProfile && (
        <FollowersModal
          userId={userProfile.id}
          initialTab="followers"
          onClose={() => setOpenFollowersModal(false)}
          name={userProfile?.name || "Користувач"}
          stats={{
            followers: userProfile._count?.followedBy || 0,
            following: userProfile._count?.following || 0,
          }}
        />
      )}

      {createThreadModal && (
        <ThreadsModal
          onClose={() => setCreateThreadModal(false)}
          onPostCreated={() => {
            queryClient.invalidateQueries({ queryKey: ["posts", targetUserId] });
          }}
        />
      )}

      {editProfileModal && isOwnProfile && (
        <EditProfilModal
          isOpen={true}
          onClose={() => {
            setEditProfileModal(false);
          }}
        />
      )}

      {expandedImage && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setExpandedImage(false)}
        >
          <div
            className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full h-full rounded-full overflow-hidden">
              <Avatar src={avatarUrl} className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;