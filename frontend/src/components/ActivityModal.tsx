import { useEffect, useState } from "react"
import Cookies from "js-cookie"
import { getShortTime } from "../utils/DateUtils"
import Avatar from "./Avatar"
import { IoChevronForward, IoEyeOutline, IoHeartOutline, IoRepeatOutline } from "react-icons/io5"
import UserHoverCard from "./UserHoverCard"
import { Heart } from "lucide-react"
import { formatCount } from "../utils/FormatData"
const API_URL = import.meta.env.VITE_API_URL

interface User {
    name: string,
    id: string,
    avatarPath: string
    isFollowing: boolean
}
interface ActivityItem {
    user: User,
    type: 'like' | 'repost',
    createdAt: string
}
interface ActivityStats {
    views: number,
    likes: number,
    reposts: number
}
interface ActivityModalProps {
    onClose: () => void,
    isOpen: boolean,
    post: any
}

interface JwtPayload {
    sub?: string;
    id?: string;
    exp?: number;
    iat?: number;
}
const parseJwt = (token: string): JwtPayload | null => {
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;
        return JSON.parse(atob(base64Url))
    } catch (error) {
        return null
    }
}

const ActivityModal = ({ onClose, isOpen, post }: ActivityModalProps) => {
    const [activityData, setActivityData] = useState<{ stats: ActivityStats, users: ActivityItem[] } | null>(null)
    const [loading, setLoading] = useState(false)
    
    
    const [processingUsers, setProcessingUsers] = useState<Set<string>>(new Set());
    

    const token = Cookies.get('token')
    const tokenData = token ? parseJwt(token) : null
    const currentUserId = tokenData?.sub || tokenData?.id || ''

    useEffect(() => {
        const fetchActivity = async () => {
            if (!isOpen) return;
            setLoading(true);
            try {
                const res = await fetch(`${API_URL}/post/${post.id}/activity`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    if (data) setActivityData(data)
                }
            } catch (error) {
                console.error("Помилка завантаження активності:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchActivity()
    }, [isOpen, post])

    const handleFollow = async (targetUserId: string, currentStatus: boolean) => {
        
        if (processingUsers.has(targetUserId)) return;

        setProcessingUsers(prev => new Set(prev).add(targetUserId));

        setActivityData(prev => {
            if (!prev) return null
            return {
                ...prev,
                users: prev.users.map(item => {
                    if (item.user.id === targetUserId) {
                        return {
                            ...item,
                            user: {
                                ...item.user,
                                isFollowing: !currentStatus
                            }
                        }
                    }
                    return item
                })
            }
        })

        try {
            const res = await fetch(`${API_URL}/user/${targetUserId}/follow`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (!res.ok && res.status !== 409) {
                throw new Error('Failed to follow');
            }

        } catch (error) {
            console.error('Follow error', error)
         
        } finally {
           
            setProcessingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(targetUserId);
                return newSet;
            });
        }
    }

    if (!isOpen) return null

    const getImageUrl = (path: string) => {
        if (!path) return null
        if (path.startsWith('http')) return path
        return `${API_URL}/uploads/avatars/${path}`
    }

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 " onClick={onClose}></div>
            <div className="bg-[#181818] w-full max-w-[550px] rounded-2xl border border-[#333] relative z-10 overflow-hidden flex flex-col max-h-[85vh] shadow-2xl">
                <div className="relative px-4 py-3 flex items-center justify-end shrink-0 mt-3">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                        <span className="font-bold text-[16px] text-white">Дії з дописом</span>
                    </div>
                    <button className="text-neutral-300 text-[15px] font-semibold mr-3">
                        Сортувати
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-4">
                        <div className="border border-[#333] rounded-lg p-4 mx-2 bg-[#1A1A1A]">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-6 h-6 rounded-full overflow-hidden">
                                    <Avatar src={getImageUrl(post?.autor?.avatarPath)} alt={post?.autor.name} />
                                </div>
                                <UserHoverCard userId={post.autor.id}>
                                    <span className="text-white text-sm font-semibold cursor-pointer hover:underline">{post?.autor.name}</span>
                                </UserHoverCard>
                                <span className="text-sm text-neutral-500 ">{getShortTime(post?.createdAt)}.</span>
                            </div>
                            <p className="text-[#ccc] text-[15px] line-clamp-2">
                                {post?.title || post?.content}
                            </p>
                        </div>
                    </div>
                    {activityData?.stats && (
                        <div className="flex flex-col ">
                            <div className="flex items-center justify-between p-4 ">
                                <div className="flex items-center gap-3 ml-3">
                                    <IoEyeOutline size={25} className="text-white" />
                                    <span className="text-white text-[15px] font-medium">Перегляди</span>
                                </div>
                                <span className="text-neutral-200 text-[15px] mr-3">
                                   {formatCount(activityData.stats.views)} 
                                    </span>
                            </div>
                            <div className="h-[0.5px] bg-[rgba(243,245,247,0.15)] ml-16"></div>
                            <div className="flex items-center justify-between p-4 cursor-pointer">
                                <div className="flex items-center gap-3 ml-3">
                                    <IoHeartOutline size={25} className="text-white" />
                                    <span className="text-white text-[15px] font-medium">Позначки «Подобається»</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-neutral-200 text-[15px]">{formatCount(activityData.stats.likes)}</span>
                                    <IoChevronForward className="text-white" size={23} />
                                </div>
                            </div>
                            <div className="h-[0.5px] bg-[rgba(243,245,247,0.15)] ml-16"></div>
                            <div className="flex items-center justify-between p-4 cursor-pointer">
                                <div className="flex items-center gap-3 ml-3">
                                    <IoRepeatOutline size={25} className="text-white" />
                                    <span className="text-white text-[15px] font-medium">Репости</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-neutral-200 text-[15px]">{formatCount(activityData.stats.reposts)}</span>
                                    <IoChevronForward className="text-white" size={23} />
                                </div>
                            </div>
                            <div className="h-[0.5px] bg-[rgba(243,245,247,0.15)] ml-16"></div>
                        </div>
                    )}
                    <div className="flex flex-col ">
                        {loading ? (
                            <div className="py-8 text-center text-neutral-500">Завантаження...</div>
                        ) : activityData?.users && activityData.users.length > 0 ? (
                            activityData.users.map((item, index) => {
                                const isProcessing = processingUsers.has(item.user.id);
                                return (
                                    <div key={index} className="flex flex-col">

                                        <div className="flex items-center justify-between px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="w-9 h-9 rounded-full overflow-hidden border border-[#333]">
                                                        <Avatar src={getImageUrl(item.user.avatarPath)} alt={post?.autor.name} />
                                                    </div>
                                                    {item.type === 'like' && (
                                                        <div className="absolute -bottom-1 -right-1 bg-[#ff0033] rounded-full p-[3px] border-2 border-[#181818] flex items-center justify-center z-30">
                                                            <Heart size={10} className="text-white fill-white" />
                                                        </div>
                                                    )}
                                                    {item.type === 'repost' && (
                                                        <div className="absolute -bottom-1 -right-1 bg-[#C026D3] rounded-full p-[3px] border-2 border-[#181818] flex items-center justify-center">
                                                            <IoRepeatOutline size={10} className="text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col leading-snug">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-white font-semibold text-[15px]">{item.user.name}</span>
                                                        <span className="text-neutral-500 text-[14px] ml-1">{getShortTime(item.createdAt)}</span>
                                                    </div>
                                                    <span className="text-neutral-500 text-[14px]">{item.user.name.toLowerCase().replace(/\s/g, '_')}</span>
                                                </div>
                                            </div>

                                           
                                            {item.user.id !== currentUserId && (
                                                <button
                                                    onClick={() => handleFollow(item.user.id, item.user.isFollowing)}
                                                    disabled={isProcessing}
                                                    className={`px-5 py-1.5 rounded-xl font-semibold text-[14px] transition border 
                                                    ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                                                    ${item.user.isFollowing 
                                                        ? 'bg-transparent border border-[rgba(255,255,255,0.15)] text-neutral-400 hover:text-white'
                                                        : 'bg-white text-black border-transparent hover:bg-neutral-200'
                                                    }`}
                                                >
                                                    {item.user.isFollowing ? 'Відстежується' : 'Стежити'}
                                                </button>
                                            )}
                                        </div>

                                        {index !== activityData.users.length - 1 && (
                                            <div className="h-[0.5px] bg-[rgba(243,245,247,0.15)] ml-16"></div>
                                        )}

                                    </div>
                                )
                            })
                        ) : (
                            !loading && <div className="py-8 text-center text-neutral-500 text-sm">Поки немає активності</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ActivityModal;