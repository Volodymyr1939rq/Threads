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


interface Statistic {
  likes: number;
  dislike: number;
  comments: number;
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
  repliesCount?:number;
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
  repliesCount:propRepliesCount
}: PostProps) => {
  const API_URL = "http://localhost:3000";
  const { user } = useCurrentUser();
  const isMe = user?.id === autor.id;
  const serverCommentsCount=propRepliesCount ?? stats?.comments ?? 0
  const { postStates, updatePostState, initPostState, decrementComments } = usePostContext();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [postIsDeleted, setPostIsDeleted] = useState(false);
  const navigate = useNavigate();
  const { openReplyModal } = useReplyModal();
  

  const queryClient = useQueryClient();

 

  useEffect(() => {
    initPostState(id, initialIsLiked, stats?.likes || 0, serverCommentsCount,);
  }, [id, initialIsLiked, stats?.likes, stats?.comments,serverCommentsCount, initPostState]);

  const storedState = postStates[id];
  const isLiked = storedState ? storedState.isLiked : initialIsLiked;
  const likesCount = storedState ? storedState.likesCount : stats?.likes || 0;
  const commentsCount = (serverCommentsCount>(storedState?.commentsCount || 0))
    ? serverCommentsCount
    : (storedState?.commentsCount || 0);

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
            <div className="flex items-center leading-none">
              <div className="flex items-center gap-1">
                <UserHoverCard userId={autor.id}>
                  <h3
                    onClick={handleProfileClick}
                    className="font-bold text-[16px] text-white hover:underline cursor-pointer"
                  >
                    {autor.name}
                  </h3>
                </UserHoverCard>
                <MdVerified color="#1d9bf0" size={16} />
                <span className="text-neutral-500 text-sm ">{timeAgo}</span>
              </div>
            </div>
          </div>
          <MenuButton />
        </div>

        <div className="mb-3">
          {description && (
            <p className="text-gray-300 font-normal text-[16px] mt-2 whitespace-pre-wrap leading-normal">
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
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-transparent">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            className="group p-2 hover:bg-neutral-600/15 rounded-2xl w-14 h-8 flex items-center justify-center duration-200 transition gap-1"
          >
            {isLiked ? (
              <IoHeart size={20} className="text-[#ff0033]" />
            ) : (
              <IoHeartOutline
                size={20}
                className="text-neutral-500 transition-colors"
              />
            )}
            {likesCount > 0 && (
              <span className={`text-sm transition-colors ${isLiked ? 'text-[#ff0033]' : 'text-neutral-500'}`}>{likesCount}</span>
            )}
          </button>

          <button
            onClick={replyHandleClick}
            className="group p-2 hover:bg-neutral-600/15 rounded-2xl w-14 h-8 flex items-center justify-center duration-200 transition gap-1"
          >
            <IoChatbubbleOutline
              size={20}
              className="text-neutral-500 transition-colors"
            />
            {commentsCount > 0 && (
              <span className="text-sm text-neutral-500">{commentsCount}</span>
            )}
          </button>
          <button className="group p-2 hover:bg-neutral-600/15 rounded-2xl w-14 h-8 flex items-center justify-center duration-200 transition">
            <IoRepeatOutline
              size={20}
              className="text-neutral-500 transition-colors"
            />
          </button>
          <button className="group p-2 hover:bg-neutral-600/15 rounded-2xl w-14 h-8 flex items-center justify-center duration-200 transition">
            <IoPaperPlaneOutline
              size={20}
              className="text-neutral-500 transition-colors"
            />
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


  return (
    <div
      onClick={handlePostClick}
      className={`
              relative w-full transition duration-200 cursor-pointer 
              ${hasBorder ? "border-b border-[#333]" : ""}
            `}
    >
      {hasThreadLine && (
        <div
          className={`
                  absolute w-0.5 bg-[#333] z-1
                  left-[33px] 
                  ${type === "comment" ? "top-[60px]" : "top-16"}
                  -bottom-2
                `}
        ></div>
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
            <Avatar
              src={getImageUrl(autor.avatarPath, "avatars")}
              alt="avatar"
            />
            {!isMe  && !isFollowing && (
              <div
                className={`absolute -bottom-1 -right-1 cursor-pointer bg-white text-black rounded-full w-4 h-4 flex items-center justify-center border-2 border-[#181818] transition-colors duration-200 ${
                  isFollowing ? "bg-black border-white" : "bg-white"
                }`}
                onClick={handleFollowClick} 
              >
                {isFollowing ? (
                  <Check size={10} strokeWidth={3} color="white" />
                ) : (
                  <Plus size={10} strokeWidth={3} color="black" />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="w-full flex flex-col pb-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1">
              <UserHoverCard userId={autor.id}>
                <h3
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onUserClick) onUserClick(autor.id);
                  }}
                  className="font-semibold text-[15px] text-white hover:underline decoration-1 cursor-pointer leading-none"
                >
                  {autor.name}
                </h3>
              </UserHoverCard>
              <MdVerified color="#1d9bf0" className="mt-0.5" size={14} />
              <span className="text-sm text-neutral-500">{timeAgo}</span>
            </div>

            <div className="flex items-center gap-3 text-neutral-500">
              <MenuButton />
            </div>
          </div>

          <div className="-mt-1 text-[15px] leading-snug">
            <p className="text-white font-medium whitespace-pre-wrap">
              {title}
            </p>
            {description && (
              <p className="text-[#cccccc] font-normal mt-0.5 whitespace-pre-wrap">
                {description}
              </p>
            )}
          </div>

          {image && (
            <div className="mt-2.5 rounded-xl overflow-hidden border border-[rgba(255,255,255,0.15)] w-full">
              <img
                src={getImageUrl(image, "posts") || ""}
                alt="Post content"
                className="w-full object-cover max-h-[500px]"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}

          <div
            className={`flex items-center gap-3 -ml-2 ${
              type === "comment" ? "mt-1" : "mt-2.5"
            }`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLike();
              }}
              className="group flex items-center justify-center gap-1 p-2 w-14 h-8 duration-200 rounded-2xl hover:bg-neutral-600/15 transition"
            >
              {isLiked ? (
                <IoHeart size={20} className="text-[#ff0033]" />
              ) : (
                <IoHeartOutline
                  size={20}
                  className="text-neutral-500 transition-colors"
                />
              )}
              {likesCount > 0 && (
                <span className={`text-sm transition-colors ${isLiked ? 'text-[#ff0033]' : 'text-neutral-500'}`}>{likesCount}</span>
              )}
            </button>
            <button
              onClick={replyHandleClick}
              className="group p-2 hover:bg-neutral-600/15 rounded-2xl w-14 h-8 flex items-center justify-center duration-200 transition gap-1"
            >
              <IoChatbubbleOutline
                size={20}
                className="text-neutral-500  transition-colors"
              />
              {commentsCount > 0 && (
                <span className="text-sm text-neutral-500">{commentsCount}</span>
              )}
            </button>
            <button className="group p-2 hover:bg-neutral-600/15 rounded-2xl w-14 h-8 flex items-center justify-center duration-200 transition">
              <IoRepeatOutline
                size={20}
                className="text-neutral-500  transition-colors"
                style={{ transform: 'scaleY(1.5)' }}
              />
            </button>
            <button className="group p-2 hover:bg-neutral-600/15 rounded-2xl w-14 h-8 flex items-center justify-center duration-200 transition">
              <IoPaperPlaneOutline
                size={20}
                className="text-neutral-500 transition-colors"
              />
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