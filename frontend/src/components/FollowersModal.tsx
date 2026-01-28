import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Avatar from "./Avatar";
import UserHoverCard from "./UserHoverCard";
import { useQueryClient } from "@tanstack/react-query";

const API_URL = 'http://localhost:3000'

interface FollowersProps {
    userId: string;
    initialTab: 'followers' | 'following';
    onClose: () => void;
    name: string;
    stats: {
        followers: number;
        following: number;
    }
}

interface UserList {
    id: string,
    name: string,
    avatarPath: string | null,
    isFollowing: boolean
}

const FollowersModal = ({ userId, initialTab, onClose, name, stats }: FollowersProps) => {
    const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab)
    const [users, setUsers] = useState<UserList[]>([])
    const [loading, setLoading] = useState(false)
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
    
    const [localStats, setLocalStats] = useState(stats)
    
    const queryClient = useQueryClient();
    const token = Cookies.get('token');

   
    useEffect(() => {
        setLocalStats(stats)
    }, [stats])

    const getCurrentUserId = () => {
        if (!token) return "";
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.sub ||payload.userId || payload.id || "";
        } catch (e) {
            return "";
        }
    };
    
    const currentUserId = getCurrentUserId();
    const isMyProfile = userId === currentUserId;

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const endpoint = activeTab === 'followers'
                ? `${API_URL}/user/${userId}/followers`
                : `${API_URL}/user/${userId}/following`

            const res = await fetch(endpoint, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data: UserList[] = await res.json()
                const uniqueUsers = Array.from(new Map(data.map(item => [item.id, item])).values())
                    .map(u => ({ ...u, isFollowing: !!u.isFollowing }));
                setUsers(uniqueUsers)
            } else {
                console.error('Помилка завантаження користувачів')
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [activeTab])

    const handleFollow = async (targetUser: UserList) => {
       
        if (processingIds.has(targetUser.id)) return;
        if (targetUser.id === currentUserId) return; 

        setProcessingIds(prev => new Set(prev).add(targetUser.id));
        
        const previousStatus = targetUser.isFollowing;
        const newStatus = !previousStatus;

        setUsers(prev => prev.map(u => 
            u.id === targetUser.id ? { ...u, isFollowing: newStatus } : u
        ));

      
        if(isMyProfile){
            setLocalStats(prev => ({
                ...prev,
                
                following: newStatus ? prev.following + 1 : prev.following - 1
            }))
        }

        try {
         
            const method = 'POST';
            
            const res = await fetch(`${API_URL}/user/${targetUser.id}/follow`, {
                method: method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!res.ok) {
                 if (res.status === 409) {
                     setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, isFollowing: true } : u));
                 } else if (res.status === 404) {
                     setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, isFollowing: false } : u));
                 } else {
                     throw new Error('Api Error');
                 }
            } else {
                await queryClient.invalidateQueries({ queryKey: ['posts'] });
                await queryClient.invalidateQueries({ queryKey: ['user'] });
                if (isMyProfile) {
                    await queryClient.invalidateQueries({ queryKey: ['profile'] });
                }
            }

        } catch (error) {
            console.error("Помилка підписки:", error);
            
            setUsers(prev => prev.map(u => 
                u.id === targetUser.id ? { ...u, isFollowing: previousStatus } : u
            ));

            if(isMyProfile){
                setLocalStats(prev => ({
                    ...prev,
                    following: newStatus ? prev.following - 1 : prev.following + 1
                }))
            }
        } finally {
            setProcessingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(targetUser.id);
                return newSet;
            });
        }
    };
     console.log("=== DEBUG ID ===");
    console.log("Мій токен:", token);
    
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log("Ввесь Payload токена:", payload);
            console.log("React витягнув ID:", currentUserId);
        } catch (e) {
            console.error("Помилка парсингу токена:", e);
        }
    }

    users.forEach(u => {
        if (u.id === currentUserId) {
            console.log("!!! ЗНАЙШОВ СПІВПАДІННЯ !!! ID рівні:", u.id);
        }
      
        if (u.name === name) {
             console.log("Це я у списку (ID бази):", u.id);
             console.log("А React думає я (ID токена):", currentUserId);
             console.log("Чи вони рівні?", u.id === currentUserId);
        }
    });
    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 animate-in fade-in duration-200"
            onClick={onClose}>
            <div className="w-full max-w-[540px] bg-[#181818] rounded-2xl border border-[#333] overflow-hidden flex flex-col mx-4 max-h-[70vh]"
                onClick={(e) => e.stopPropagation()}>
            
                <div className="flex w-full border-b border-[#333] shrink-0">
                    <button onClick={() => setActiveTab('followers')}
                        className={`flex-1 py-3 flex flex-col items-center justify-center transition-all relative ${activeTab === 'followers' ? 'text-white' : 'text-[#616161]'}`}>
                        <span className="font-bold text-[15px]">Читачі</span>
                        <span className="text-[15px]">{localStats?.followers}</span>
                        {activeTab === 'followers' && <div className="absolute bottom-0 w-full h-px bg-white"></div>}
                    </button>
                    <button onClick={() => setActiveTab('following')}
                        className={`flex-1 py-3 flex flex-col items-center justify-center transition-all relative ${activeTab === 'following' ? 'text-white' : 'text-[#616161]'}`}>
                        <span className="font-bold text-[15px]">Відстежування</span>
                        <span className="text-[15px]">{localStats?.following}</span>
                        {activeTab === 'following' && <div className="absolute bottom-0 w-full h-px bg-white"></div>}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col min-h-[50px]">
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <div className="w-8 h-8 border-2 border-[#333] border-t-white rounded-full animate-spin mb-3"></div>
                            <span className="text-[#616161] text-[14px]">Завантаження...</span>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-[#616161] text-[15px]">
                            {activeTab === 'followers' ? `${name} ще немає читачів` : `${name} ще нікого не відстежує`}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {users.map(user => (
                                <div key={user.id} className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full border border-[#333] overflow-hidden shrink-0">
                                            <Avatar src={user.avatarPath} alt={user.name} />
                                        </div>
                                        <div className="flex flex-col group">
                                            <UserHoverCard userId={user.id}>
                                                <span className="text-[15px] font-semibold text-white leading-tight group-hover:underline cursor-pointer">
                                                    {user.name}
                                                </span>
                                            </UserHoverCard>
                                            <span className="text-[14px] text-[#616161]">{user.name}</span>
                                        </div>
                                    </div>
                                    
                                    
                                    {user.id !== currentUserId && (
                                        <button
                                            disabled={processingIds.has(user.id)}
                                            onClick={() => handleFollow(user)}
                                            className={`px-5 py-1.5 rounded-xl text-[14px] font-bold border transition-all duration-200
                                                ${processingIds.has(user.id) ? 'opacity-50 cursor-not-allowed' : ''}
                                                ${user.isFollowing
                                                    ? 'bg-transparent border-[#3a3a3a] text-[#616161] hover:border-[#555]' 
                                                    : 'bg-white border-white text-black' 
                                                }`}
                                        >
                                            {user.isFollowing ? 'Відстежується' : 'Стежити'}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default FollowersModal;