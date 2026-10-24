import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { uk } from "date-fns/locale";
import Cookies from "js-cookie";
import { formatDistanceToNowStrict } from "date-fns";
import { Heart, MessageCircle, User } from "lucide-react";
import Avatar from "../components/Avatar";
import UserHoverCard from "../components/UserHoverCard";
import FollowersModal from "../components/FollowersModal";
import Loader from "../components/Loader";

const API_URL = import.meta.env.VITE_API_URL;

interface Notification {
    id: string;
    type: 'FOLLOW' | 'LIKES' | 'COMMENT' | 'REPLY';
    createdAt: string;
    postId: string | null;
    creator: {
        id: string;
        name: string;
        avatarPath: string | null;
        followedBy: { followerId: string }[];
    };
    post?: {
        id: string;
        title?: string;
        image?: string;
    };
    comment?: {
        id: string;
        content: string;
    };
    isFollowing: boolean;
}

interface GroupNotifications extends Notification {
    count: number;
    avatars: string[];
    names: string[];
}

interface CurrentUserProfile {
    id: string;
    name: string;
    _count: {
        followedBy: number;
        following: number;
    };
}

const groupNotification = (notifs: Notification[]): GroupNotifications[] => {
    const group = new Map<string, GroupNotifications>();
    const result: GroupNotifications[] = [];

    notifs.forEach((notif) => {
        if (notif.type === 'LIKES' && notif.postId) {
            const key = `like-${notif.postId}`;

            if (group.has(key)) {
                const groupMap = group.get(key)!;
                groupMap.count += 1;

                if (notif.creator.avatarPath) {
                    groupMap.avatars.unshift(notif.creator.avatarPath);
                }
                groupMap.names.unshift(notif.creator.name);

                if (new Date(notif.createdAt).getTime() > new Date(groupMap.createdAt).getTime()) {
                    groupMap.createdAt = notif.createdAt;
                }
            } else {
                const newGroup: GroupNotifications = {
                    ...notif,
                    count: 1,
                    avatars: notif.creator.avatarPath ? [notif.creator.avatarPath] : [],
                    names: [notif.creator.name],
                };
                group.set(key, newGroup);
                result.push(newGroup);
            }
        } else {
            result.push({
                ...notif,
                count: 1,
                avatars: notif.creator.avatarPath ? [notif.creator.avatarPath] : [],
                names: [notif.creator.name]
            });
        }
    });

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const Activity = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpenFollowerModal, setIsOpenFolowerModal] = useState(false);
    const [myProfile, setMyProfile] = useState<CurrentUserProfile | null>(null);
    const navigate = useNavigate();
    const token = Cookies.get('token');

    const GroupNotifications = useMemo(() => {
        return groupNotification(notifications);
    }, [notifications]);

    const getCurrentUserId = () => {
        if (!token) return "";
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.userId || payload.id || payload.sub || "";
        } catch (e) {
            return "";
        }
    };
    const currentUserId = getCurrentUserId();

    useEffect(() => {
        const fetchNotifications = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_URL}/user/notifications`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const formattedData = data.map((n: any) => ({
                        ...n,
                        isFollowing: n.creator.followedBy?.some(
                            (follower: any) => follower.followerId === currentUserId
                        ) || false
                    }));
                    setNotifications(formattedData);
                }
            } catch (error) {
                console.error('Error loading activity', error);
            } finally {
                setLoading(false);
            }
        };

        if (currentUserId) {
            fetchNotifications();
        } else {
            setLoading(false);
        }
    }, [token, currentUserId]);

    useEffect(() => {
        if (!currentUserId) return;
        
        const fetchMyProfile = async () => {
            try {
                const res = await fetch(`${API_URL}/user/userprofile`, { 
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setMyProfile(data);
                }
            } catch (error) {
                console.error("Error fetching my profile", error);
            }
        };
        fetchMyProfile();
    }, [currentUserId, token]);

    const handleFollow = async (userId: string, currentStatus: boolean) => {
        setNotifications(prev => prev.map(n => {
            if (n.creator.id === userId) {
                return { ...n, isFollowing: !currentStatus };
            }
            return n;
        }));
        try {
            await fetch(`${API_URL}/user/${userId}/follow`, {
                method: "POST",
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleNotificationClick = (item: Notification) => {
        if (item.type === 'FOLLOW') {
            setIsOpenFolowerModal(true);
        } else if (item.postId) {
            navigate(`/post/${item.postId}`);
        }
    };

    const getNotification = (item: Notification) => {
        if (item.type === 'FOLLOW') {
            return <span className="text-[#a0a0a0]">Починає стежити за вами</span>;
        }

        let text = "";

        if (item.post?.title) {
            text = item.post.title;
        } else if (item.comment?.content) {
            text = item.comment.content;
        }

        if (text) {
            if (text.length > 60) text = text.substring(0, 60) + "...";
            return <span className="text-[#a0a0a0]">{text}</span>;
        }

        if (item.post?.image) {
            return <span className="text-[#a0a0a0]">Вподобав(ла) вашу світлину</span>;
        }

        return <span className="text-[#a0a0a0]">Вподобав(ла) ваш допис</span>;
    };

    const formattedTime = (dateString: string) => {
        return formatDistanceToNowStrict(new Date(dateString), {
            locale: uk,
            addSuffix: false
        })
            .replace('секунд', 'с')
            .replace('хвилин', 'хв')
            .replace('годин', 'год')
            .replace('днів', 'д');
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'FOLLOW': return <User size={12} className="text-white fill-white" />;
            case 'LIKES': return <Heart size={12} className="text-white fill-white" />;
            case 'COMMENT': return <MessageCircle size={12} className="text-white fill-[#0095f6]" />;
            default: return <User size={12} className="text-white" />;
        }
    };

    const getBadgeColor = (type: string) => {
        switch (type) {
            case 'FOLLOW': return 'bg-[#6D28D9]';
            case 'LIKES': return 'bg-[#ff3040]';
            case 'COMMENT': return 'bg-[#0095f6]';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="bg-black flex flex-col text-white relative h-screen w-full overflow-hidden font-sans">
            <div className="shrink-0 h-10 flex items-center justify-center px-4 z-50 bg-transparent py-8">
                <div className="flex items-center justify-center">
                    <span className="font-semibold text-[16px] text-white">Активність</span>
                </div>
            </div>
            <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <div className="mx-auto max-w-2xl overflow-y-auto scrollbar-hide bg-[#181818] rounded-t-3xl border-x border-t border-b-0 border-[#333] w-full flex-1">
                {loading && (
                    <div className="flex justify-center items-center py-20">
                        <Loader size={32} className="animate-spin text-white"/>
                    </div>
                )}

                {!loading && GroupNotifications.length === 0 && (
                    <div className="p-10 text-center text-[#616161]">
                        Тут поки що нічого немає
                    </div>
                )}
                
                {!loading && GroupNotifications.length > 0 && (
                    <div className="relative w-full mx-auto py-2 flex flex-col">
                        {GroupNotifications.map((item, index) => (
                            <div 
                                key={item.id} 
                                onClick={() => handleNotificationClick(item)}
                                className="flex flex-col hover:bg-[#222] transition-colors cursor-pointer"
                            >
                                <div className="flex items-center justify-between px-5 py-4 gap-3">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div 
                                            className="relative shrink-0 cursor-pointer" 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                navigate(`/profile/${item.creator.id}`); 
                                            }}
                                        >
                                            {item.count > 1 ? (
                                                <div className="relative w-12 h-10">
                                                    <div className="absolute top-0 right-0 w-8 h-8 rounded-full border border-[#333] overflow-hidden z-10">
                                                        <Avatar src={item.avatars?.[1] || null} alt="user2" />
                                                    </div>
                                                    <div className="absolute bottom-0 left-0 w-8 h-8 rounded-full border-2 border-black overflow-hidden z-20">
                                                        <Avatar src={item.avatars?.[0] || null} alt="user1" />
                                                    </div>
                                                    <div className="absolute -bottom-0.5 -right-0.5 bg-[#ff3040] rounded-full p-[3px] border-2 border-black flex items-center justify-center z-30">
                                                        <Heart size={10} className="text-white fill-white" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="relative w-10 h-10">
                                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-[#333]">
                                                        <Avatar src={item.creator.avatarPath} alt={item.creator.name} />
                                                    </div>
                                                    <div className={`absolute -bottom-0.5 -right-0.5 ${getBadgeColor(item.type)} rounded-full p-[3px] border-2 border-[#181818] flex items-center justify-center`}>
                                                        {getIcon(item.type)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex flex-col pt-0.5 w-full">
                                            <div className="flex items-baseline gap-1.5 flex-wrap">
                                                {item.count > 1 ? (
                                                    <span className="font-bold text-[14px] leading-snug">
                                                        {item.names?.[0]}
                                                        {item.count === 2 && (
                                                            <>
                                                                <span className="font-normal text-[#a0a0a0]"> та </span>
                                                                {item.names?.[1]}
                                                            </>
                                                        )}
                                                        {item.count > 2 && (
                                                            <>
                                                                <span className="font-normal text-[#a0a0a0]">, </span>
                                                                {item.names?.[1]}
                                                                <span className="font-normal text-[#a0a0a0]"> та ще {item.count - 2}</span>
                                                            </>
                                                        )}
                                                    </span>
                                                ) : (
                                                    <UserHoverCard userId={item.creator.id}>
                                                        <span 
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                navigate(`/profile/${item.creator.id}`); 
                                                            }} 
                                                            className="font-bold text-[14px] cursor-pointer hover:underline truncate"
                                                        >
                                                            {item.creator.name}
                                                        </span>
                                                    </UserHoverCard>
                                                )}
                                                <span className="text-[#616161] text-[13px] shrink-0">
                                                    {formattedTime(item.createdAt)}
                                                </span>
                                            </div>

                                            <span className="text-[#a0a0a0] text-[14px] leading-snug line-clamp-2 pr-2">
                                                {getNotification(item)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="ml-3 shrink-0">
                                        {item.type === 'FOLLOW' ? (
                                            <button
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    handleFollow(item.creator.id, item.isFollowing); 
                                                }}
                                                className={`px-4 py-1.5 rounded-[10px] font-bold text-[13px] transition-all border shrink-0
                                                    ${item.isFollowing 
                                                        ? 'bg-transparent text-[#616161] border-[#3a3a3a] hover:text-white'
                                                        : 'bg-white text-black border-transparent hover:bg-[#e0e0e0]'
                                                    }`}
                                            >
                                                {item.isFollowing ? 'Відстежується' : 'Стежити також'}
                                            </button>
                                        ) : (
                                            item.post?.image && (
                                                <div className="w-11 h-11 rounded-lg overflow-hidden border border-[#333]">
                                                    <img 
                                                        src={item.post.image.startsWith('http') ? item.post.image : `${API_URL}/${item.post.image}`} 
                                                        alt="post thumbnail" 
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>

                                {index !== GroupNotifications.length - 1 && (
                                    <div className="h-[0.33px] bg-[#333] ml-[70px]" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {isOpenFollowerModal && (
                <FollowersModal 
                    userId={currentUserId}
                    initialTab="followers"
                    onClose={() => setIsOpenFolowerModal(false)}
                    name={myProfile?.name || ''}
                    stats={{
                        followers: myProfile?._count?.followedBy || 0,
                        following: myProfile?._count?.following || 0
                    }}
                />
            )}
        </div>
    );
};

export default Activity;