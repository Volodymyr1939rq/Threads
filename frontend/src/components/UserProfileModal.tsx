import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Avatar from "./Avatar";
import { useNavigate } from "react-router-dom";

interface OpenUserProfileModal {
    userId: string;
    onClose: () => void;
    onFollowStatus?: (userId: string, isFollowing: boolean) => void
    isHover?: boolean;
}

interface UserData {
    id: string;
    name: string;
    bio?: string;
    avatarPath: string | null;
    _count?: {
        followedBy: number,
        following: number
    }
    isFollowing: boolean
}


const parseJwt = (token: string) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
};

const UserProfileModal = ({ userId, onClose, onFollowStatus, isHover = false }: OpenUserProfileModal) => {
    const [user, setUser] = useState<UserData | null>(null)
    const [loading, setLoading] = useState(false)
    const [isFollowing, setIsFollowing] = useState(false)
    const [followersCount, setFollowersCount] = useState(0)
    const navigate = useNavigate()
    const API_URL = import.meta.env.VITE_API_URL

    const token = Cookies.get('token');
    const tokenData = token ? parseJwt(token) : null;
    const currentUserId = tokenData?.sub || tokenData?.id || '';

    const isMyProfile = currentUserId === userId;

    useEffect(() => {
        let isMounted=true
        const fetchUser = async () => {
            setLoading(true); 
            try {
                const res = await fetch(`${API_URL}/user/${userId}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    if(isMounted){
                        setUser(data)
                        setIsFollowing(data.isFollowing)
                        setFollowersCount(data._count?.followedBy || 0)
                    }
                }
            } catch (error) {
                console.error(error)
            } finally {
                if(isMounted){
                    setLoading(false)
                }
            }
        }
        fetchUser()
        return ()=>{isMounted=false}
    }, [userId, token]) 

    const handleFollowToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (isMyProfile) return;

        try {
            const newIsFollowing = !isFollowing
            
            setIsFollowing(newIsFollowing)
            setFollowersCount(prev => newIsFollowing ? prev + 1 : prev - 1)

            if (onFollowStatus) {
                onFollowStatus(userId, newIsFollowing)
            }

            const res = await fetch(`${API_URL}/user/${userId}/follow`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (!res.ok) {
                setIsFollowing(!newIsFollowing)
                setFollowersCount(prev => newIsFollowing ? prev - 1 : prev + 1) 
                if (onFollowStatus) onFollowStatus(userId, !newIsFollowing)
            }
        } catch (error) {
            console.error('Follow error', error)
        
            setIsFollowing(!isFollowing)
        }
    }

    const handleGoToProfile = (e: React.MouseEvent) => {
        e.stopPropagation()
        onClose();
        navigate(`/profile/${userId}`)
    }

    const content = (
        <div
            onClick={(e) => e.stopPropagation()}

            className={`rounded-3xl bg-[#181818] border border-[#333] overflow-hidden p-6 relative shadow-2xl flex flex-col
                ${isHover ? 'w-80 cursor-default' : 'w-full max-w-[400px]'}
            `}
        >
            {loading ? (
                <div className="text-center text-gray-500 py-10">Завантаження...</div>
            ) : (
                <>
                    <div className="flex items-start justify-between w-full">
                        <div className="flex-1 pr-4">
                            <h2
                                onClick={handleGoToProfile} className="text-2xl font-bold text-white leading-none hover:cursor-pointer transition-transform duration-100 active:scale-95 active:opacity-70 origin-left">{user?.name}</h2>
                            <p
                                onClick={handleGoToProfile}
                                className="text-[#616161] mb-0.5 mt-1 cursor-pointer transition-transform duration-100 ease-in-out active:scale-95 active:opacity-70 origin-left">@{user?.name.toLowerCase().replace(/\s/g, '')}</p>
                        </div>
                        <div
                            onClick={handleGoToProfile}
                            className="w-16 h-16 rounded-full flex-col items-center justify-between shrink-0 cursor-pointer transition-transform duration-100 ease-in-out active:scale-95 active:opacity-70 orgin-left">
                            <Avatar src={user?.avatarPath} alt={user?.name}></Avatar>
                        </div>
                    </div>

                    <div className="mt-3">
                        <p className="text-white mb-4 whitespace-pre-wrap text-[15px] leading-snug">{user?.bio}</p>
                    </div>

                    <div className="mt-auto mb-5">
                        <span className="text-[#616161] text-sm mb-6">
                            {followersCount.toLocaleString()} читачів
                        </span>
                    </div>

                    {!isMyProfile ? (
                        <button
                            onClick={handleFollowToggle}
                            className={`w-full py-1.5 rounded-xl font-bold text-[16px] transition-all duration-200 
                            ${isFollowing
                                    ? 'bg-transparent border border-[#444] text-[#616161] hover:border-[#666] hover:text-gray-300'
                                    : 'bg-white text-black hover:bg-gray-200'
                                }`}
                        >
                            {isFollowing ? 'Відстежується' : 'Стежити'}
                        </button>
                    ) : (
                        
                        <button
                            onClick={handleGoToProfile}
                            className="w-full py-1.5 rounded-xl font-bold text-[16px] border border-[#444] text-white hover:bg-[#262626] transition-all"
                        >
                            Мій профіль
                        </button>
                    )}
                </>
            )}
        </div>
    );

    if (isHover) {
        return (
            <div className="animate-in fade-in zoom-in-95 duration-200">
                {content}
            </div>
        );
    }

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 animate-in fade-in duration-200"
        >
            {content}
        </div>
    );
}

export default UserProfileModal;