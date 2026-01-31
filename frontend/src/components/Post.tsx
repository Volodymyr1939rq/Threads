import {
  IoChatbubbleOutline,
  IoEllipsisHorizontal,
  IoHeartOutline,
  IoHeart,
  IoPaperPlaneOutline,
  IoRepeatOutline,
} from "react-icons/io5";
import { MdVerified } from "react-icons/md";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Avatar from "./Avatar";
import { Check, Plus } from "lucide-react";
import { useCurrentUser } from "../context/UserContext";
import UserHoverCard from "./UserHoverCard";
import { getShortTime } from "../utils/DateUtils";
import { useNavigate } from "react-router-dom";
import { useReplyModal } from "../context/ReplyModalContext";
import { usePostContext } from "../context/PostContext";
import { PostOptionsModal } from "./PostOptionalMenu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import RepostMenu from "./RepostMenu";

interface Statistic {
  likes: number;
  dislike: number;
  comments: number;
  reposts?: number;
}

interface Autor {
  id: string;
  name: string;
  avatarPath: string;
}

interface PostProps {
  id: string;
  title: string;
  description?: string | null;
  image: string | null;
  autor: Autor;
  createdAt: string;
  stats?: Statistic;
  isLiked: boolean;
  onUserClick?: (userId: string) => void;
  isFollowing?: boolean;
  onFollowChange?: (userId: string, newStatus: boolean) => void;
  isMainPost?: boolean;
  hasThreadLine?: boolean;
  type?: string;
  rootPostId?: string;
  onClick?: () => void;
  hasBorder?: boolean;
  repliesCount?: number;
  repostCount?: number;
  isRepostByMe?: boolean;
  isRepost?: boolean;
  replyName?: string | null;
}

const Post = ({
  id,
  title,
  description,
  image,
  autor,
  createdAt,
  stats,
  isLiked: initialIsLiked = false,
  onUserClick,
  isFollowing = false,
  isMainPost = false,
  hasThreadLine = false,
  type = "post",
  rootPostId,
  onClick,
  hasBorder = true,
  repliesCount: propRepliesCount,
  repostCount: propRepostCount,
  isRepostByMe = false,
  isRepost = false,
  replyName,
}: PostProps) => {
  const API_URL = "http://localhost:3000";
  const { user } = useCurrentUser();
  const isMe = user?.id === autor.id;
  const serverCommentsCount = propRepliesCount ?? stats?.comments ?? 0;
  const { postStates, updatePostState, initPostState, decrementComments } =
    usePostContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [postIsDeleted, setPostIsDeleted] = useState(false);
  const [isReposted, setIsReposted] = useState(isRepostByMe);
  const [repostCount, setRepostCount] = useState(
    propRepostCount ?? stats?.reposts ?? 0
  );
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const { openReplyModal } = useReplyModal();

  useEffect(() => {
    setRepostCount(stats?.reposts || 0);
    setIsReposted(isRepostByMe || false);
  }, [stats?.reposts, isRepostByMe]);

  const queryClient = useQueryClient();

  useEffect(() => {
    initPostState(
      id,
      initialIsLiked,
      stats?.likes || 0,
      serverCommentsCount
    );
  }, [
    id,
    initialIsLiked,
    stats?.likes,
    stats?.comments,
    serverCommentsCount,
    initPostState,
  ]);

  const storedState = postStates[id];
  const isLiked = storedState ? storedState.isLiked : initialIsLiked;
  const likesCount = storedState ? storedState.likesCount : stats?.likes || 0;
  const commentsCount =
    serverCommentsCount > (storedState?.commentsCount || 0)
      ? serverCommentsCount
      : storedState?.commentsCount || 0;

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const token = Cookies.get("token");
      if (!token) throw new Error("No token");

      const endpoint = type === "post" ? "post" : "comment";
      const res = await fetch(`${API_URL}/${endpoint}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete");
      }
      return res.json();
    },
    onSuccess: () => {
      setIsMenuOpen(false);
      if (rootPostId) {
        decrementComments(rootPostId);
      }
      setPostIsDeleted(true);

      queryClient.invalidateQueries({ queryKey: ["posts"] });
      if (rootPostId) {
        queryClient.invalidateQueries({ queryKey: ["post", rootPostId] });
      }

      if (isMainPost) navigate(-1);
    },
    onError: (error) => {
      console.error("Delete error:", error);
    },
  });

  const handleDeletePost = () => {
    deleteMutation.mutate();
  };

  const replyHandleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openReplyModal({
      id: id,
      title: title || "Допис",
      description: description || title,
      createdAt: createdAt,
      autor: {
        name: autor.name,
        avatarPath: autor.avatarPath,
      },
      ...(rootPostId ? { postId: rootPostId } : {}),
    });
  };

  const handlePostClick = () => {
    if (isMainPost) return;
    if (onClick) {
      onClick();
    } else {
      navigate(`/post/${id}`);
      window.scrollTo(0, 0);
    }
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUserClick) {
      onUserClick(autor.id);
    } else {
      navigate(`/profile/${autor.id}`);
    }
  };

  const handleLike = async () => {
    const token = Cookies.get("token");
    if (!token) {
      alert("Потрібно увійти в акаунт!");
      return;
    }
    const newIsLiked = !isLiked;
    updatePostState(id, newIsLiked, newIsLiked ? 1 : -1);
    const endpoint = type === "post" ? "post" : "comment";

    try {
      await fetch(`${API_URL}/${endpoint}/${id}/reaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isLiked: newIsLiked }),
      });
    } catch (error) {
      console.error("Помилка лайка:", error);
      updatePostState(id, !newIsLiked, newIsLiked ? -1 : 1);
    }
  };

  let timeAgo = getShortTime(createdAt);

  const getImageUrl = (
    path: string | null | undefined,
    imgType: "avatars" | "posts"
  ) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${API_URL}/uploads/${imgType}/${path}`;
  };

  const MenuButton = () => (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsMenuOpen(true);
        }}
        className="text-neutral-500 rounded-full p-1 hover:bg-neutral-800 transition"
      >
        <IoEllipsisHorizontal />
      </button>
    </div>
  );

  if (postIsDeleted) return null;

  // ===== ВІДОБРАЖЕННЯ ДЛЯ ОКРЕМОЇ СТОРІНКИ ПОСТА (Main Post) =====
  if (isMainPost) {
    return (
      <div className="w-full px-4 py-4 cursor-default">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 relative cursor-pointer"
              onClick={handleProfileClick}
            >
              <Avatar
                src={getImageUrl(autor.avatarPath, "avatars")}
                alt="avatar"
              />
              {!isMe && !isFollowing && (
                <div
                  className={`absolute -bottom-1 -right-1 cursor-pointer bg-white text-black rounded-full w-5 h-5 flex items-center justify-center border-2 border-[#181818] transition-colors duration-200 ${
                    isFollowing ? "bg-black border-white" : "bg-white"
                  }`}
                  onClick={handleFollowClick}
                >
                  {isFollowing ? (
                    <Check size={12} strokeWidth={3} color="white" />
                  ) : (
                    <Plus size={12} strokeWidth={3} color="black" />
                  )}
                </div>
              )}
            </div>
            
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1 leading-tight">
                <UserHoverCard userId={autor.id}>
                  <h3
                    onClick={handleProfileClick}
                    className="font-bold text-[16px] text-white hover:underline cursor-pointer"
                  >
                    {autor.name}
                  </h3>
                </UserHoverCard>
                <MdVerified color="#1d9bf0" size={16} />
                <span className="text-neutral-500 text-sm">{timeAgo}</span>
              </div>
              
              {replyName && (
                <div className="text-neutral-500 text-sm mt-0.5">
                  Відповідь користувачу{" "}
                  <span className="text-[#1d9bf0]">@{replyName}</span>
                </div>
              )}
            </div>
          </div>
          <MenuButton />
        </div>

        <div className="mb-3 text-[15px] wrap-break-word">
          <p className="text-white font-medium whitespace-pre-wrap">
              {title}
          </p>
          {description && (
            <p className="text-gray-300 font-normal mt-2 whitespace-pre-wrap leading-normal">
              {description}
            </p>
          )}
        </div>

        {image && (
          <div className="mb-4 rounded-xl overflow-hidden border border-[rgba(255,255,255,0.15)] w-full">
            <img
              src={getImageUrl(image, "posts") || ""}
              alt="Post content"
              className="w-full object-cover max-h-[600px]"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}

        {/* КНОПКИ ДІЙ (Main Post) */}
        <div className="flex items-center gap-6 -ml-2 mt-2 pt-2 border-t border-transparent">
          <button
            onClick={(e) => { e.stopPropagation(); handleLike(); }}
            className="group flex items-center justify-center p-2 duration-200 rounded-full hover:bg-neutral-600/15 transition"
          >
            {isLiked ? (
              <IoHeart size={20} className="text-[#ff0033]" />
            ) : (
              <IoHeartOutline size={20} className="text-neutral-500 transition-colors" />
            )}
            {likesCount > 0 && (
              <span className={`text-sm ml-1.5 transition-colors ${isLiked ? "text-[#ff0033]" : "text-neutral-500"}`}>
                {likesCount}
              </span>
            )}
          </button>

          <button
            onClick={replyHandleClick}
            className="group flex items-center justify-center p-2 duration-200 rounded-full hover:bg-neutral-600/15 transition"
          >
            <IoChatbubbleOutline size={20} className="text-neutral-500 transition-colors" />
            {commentsCount > 0 && (
              <span className="text-sm ml-1.5 text-neutral-500">{commentsCount}</span>
            )}
          </button>

          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="group flex items-center justify-center p-2 duration-200 rounded-full hover:bg-neutral-600/15 transition"
            >
              <IoRepeatOutline
                size={20}
                className={`${isRepostByMe ? "text-green-500" : "text-neutral-500"} transition-colors`}
                style={{ transform: "scaleY(1.2)" }}
              />
              {repostCount > 0 && (
                <span className={`text-sm ml-1.5 ${isRepostByMe ? "text-green-500" : "text-neutral-500"}`}>
                  {repostCount}
                </span>
              )}
            </button>
            {showMenu && (
              <RepostMenu
                postId={id}
                isReposted={isReposted}
                currentCount={repostCount}
                onClose={() => setShowMenu(false)}
                updateState={(newState, newCount) => {
                  setIsReposted(newState);
                  setRepostCount(newCount);
                }}
                type={type}
              />
            )}
          </div>

          <button className="group flex items-center justify-center p-2 duration-200 rounded-full hover:bg-neutral-600/15 transition">
            <IoPaperPlaneOutline size={20} className="text-neutral-500 transition-colors" />
          </button>
        </div>

        <PostOptionsModal
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          isOwner={isMe}
          onDelete={handleDeletePost}
          postId={id}
        />
      </div>
    );
  }

  // ===== ВІДОБРАЖЕННЯ ДЛЯ СТРІЧКИ (Feed Item) =====
  return (
    <div
      onClick={handlePostClick}
      className={`relative w-full transition duration-200 cursor-pointer ${hasBorder ? "border-b border-[#333]" : ""}`}
    >
      {isRepost && (
        <div className="flex items-center gap-2 text-[#616161] px-4 pt-3 pb-0 text-[13px] font-bold">
          <IoRepeatOutline size={16} />
          <span>Повторно опубліковано</span>
        </div>
      )}
      
      {hasThreadLine && (
        <div className={`absolute w-0.5 bg-[#333] z-1 left-[33px] ${type === "comment" ? "top-[60px]" : "top-16"} -bottom-2`}></div>
      )}

      <div className="flex w-full h-fit px-4 gap-3 py-4">
        <div className="flex flex-col items-center shrink-0">
          <div
            className="h-9 w-9 cursor-pointer z-10 relative"
            onClick={(e) => {
              e.stopPropagation();
              if (onUserClick) onUserClick(autor.id);
            }}
          >
            <Avatar src={getImageUrl(autor.avatarPath, "avatars")} alt="avatar" />
            {!isMe && !isFollowing && (
              <div
                className={`absolute -bottom-1 -right-1 cursor-pointer bg-white text-black rounded-full w-4 h-4 flex items-center justify-center border-2 border-[#181818] transition-colors duration-200 ${
                  isFollowing ? "bg-black border-white" : "bg-white"
                }`}
                onClick={handleFollowClick}
              >
                {isFollowing ? <Check size={10} strokeWidth={3} color="white" /> : <Plus size={10} strokeWidth={3} color="black" />}
              </div>
            )}
          </div>
        </div>

        <div className="w-full flex flex-col pb-0 min-w-0">
          <div className="flex justify-between items-start w-full">
            <div className="flex items-center gap-1 overflow-hidden">
              <UserHoverCard userId={autor.id}>
                <h3
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onUserClick) onUserClick(autor.id);
                  }}
                  className="font-semibold text-[15px] text-white hover:underline decoration-1 cursor-pointer truncate"
                >
                  {autor.name}
                </h3>
              </UserHoverCard>
              <MdVerified color="#1d9bf0" className="shrink-0" size={14} />
              <span className="text-sm text-neutral-500 whitespace-nowrap ml-1">{timeAgo}</span>
            </div>
            <div className="flex items-center gap-3 text-neutral-500 shrink-0 ml-2">
              <MenuButton />
            </div>
          </div>

          {replyName && (
            <div className="text-[#616161] text-[14px] mt-0.5 mb-1 leading-none truncate w-full">
              Відповідь користувачу{" "}
              <span className="text-[#1d9bf0] cursor-pointer hover:underline">@{replyName}</span>
            </div>
          )}

          <div className={`text-[15px] leading-snug wrap-break-word ${replyName ? "" : "mt-0.5"}`}>
            <p className="text-white font-medium whitespace-pre-wrap">{title}</p>
            {description && <p className="text-[#cccccc] font-normal mt-0.5 whitespace-pre-wrap">{description}</p>}
          </div>

          {image && (
            <div className="mt-2.5 rounded-xl overflow-hidden border border-[rgba(255,255,255,0.15)] w-full">
              <img
                src={getImageUrl(image, "posts") || ""}
                alt="Post content"
                className="w-full object-cover max-h-[500px]"
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
            </div>
          )}

          {/* КНОПКИ ДІЙ (Feed Item) */}
          <div className="flex items-center gap-6 -ml-2 mt-2.5">
            <button
              onClick={(e) => { e.stopPropagation(); handleLike(); }}
              className="group flex items-center justify-center p-2 duration-200 rounded-full hover:bg-neutral-600/15 transition"
            >
              {isLiked ? (
                <IoHeart size={20} className="text-[#ff0033]" />
              ) : (
                <IoHeartOutline size={20} className="text-neutral-500 transition-colors" />
              )}
              {likesCount > 0 && (
                <span className={`text-sm ml-1.5 transition-colors ${isLiked ? "text-[#ff0033]" : "text-neutral-500"}`}>
                  {likesCount}
                </span>
              )}
            </button>

            <button
              onClick={replyHandleClick}
              className="group flex items-center justify-center p-2 duration-200 rounded-full hover:bg-neutral-600/15 transition"
            >
              <IoChatbubbleOutline size={20} className="text-neutral-500 transition-colors" />
              {commentsCount > 0 && (
                <span className="text-sm ml-1.5 text-neutral-500">{commentsCount}</span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                className="group flex items-center justify-center p-2 duration-200 rounded-full hover:bg-neutral-600/15 transition"
              >
                <IoRepeatOutline
                  size={20}
                  className={`${isRepostByMe ? "text-green-500" : "text-neutral-500"} transition-colors`}
                  style={{ transform: "scaleY(1.2)" }}
                />
                {repostCount > 0 && (
                  <span className={`text-sm ml-1.5 ${isRepostByMe ? "text-green-500" : "text-neutral-500"}`}>
                    {repostCount}
                  </span>
                )}
              </button>
              {showMenu && (
                <RepostMenu
                  postId={id}
                  isReposted={isReposted}
                  currentCount={repostCount}
                  onClose={() => setShowMenu(false)}
                  updateState={(newState, newCount) => {
                    setIsReposted(newState);
                    setRepostCount(newCount);
                  }}
                  type={type}
                />
              )}
            </div>

            <button className="group flex items-center justify-center p-2 duration-200 rounded-full hover:bg-neutral-600/15 transition">
              <IoPaperPlaneOutline size={20} className="text-neutral-500 transition-colors" />
            </button>
          </div>
        </div>
      </div>

      <PostOptionsModal
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        isOwner={isMe}
        onDelete={handleDeletePost}
        postId={id}
      />
    </div>
  );
};

export default Post;