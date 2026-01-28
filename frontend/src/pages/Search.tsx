import { SearchIcon, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import Avatar from "../components/Avatar";
import UserHoverCard from "../components/UserHoverCard";
import UnfollowModal from "../components/UnfollowModal";
import SearchFilter from "../components/SearchFilter";
import DatePicker, { registerLocale } from "react-datepicker";
import { uk } from "date-fns/locale/uk"; 
import { format } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css"; 

registerLocale('uk', uk);

const API_URL = 'http://localhost:3000'

interface UserResult {
    id: string;
    name: string;
    avatarPath: string;
    bio?: string;
    _count: {
        followedBy: number;
    }
    isFollowing: boolean;
}

const Search = () => {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<UserResult[]>([])
    const [loading, setLoading] = useState(false)
    const [userToUnfollow, setUserToUnfollow] = useState<UserResult | null>(null)
    const navigate = useNavigate()
    

    const [isOpenFilterModal, setIsOpenFilterModal] = useState(false)
    
  
    const [openDatePicker, setOpenDatePicker] = useState<'start' | 'end' | null>(null)
    
    
    const [startDate, setStartDate] = useState<Date | null>(null)
    const [endDate, setEndDate] = useState<Date | null>(null)

    const filterRef = useRef<HTMLDivElement>(null)
    const inputContainerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const token = Cookies.get('token')
    let currentUserId = '';
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]))
            currentUserId = payload.sub || payload.id
        } catch (e) {
            console.error('Token decode error', e)
        }
    }

    
    useEffect(() => {
        const handleClickOutSide = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsOpenFilterModal(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutSide)
        return () => document.removeEventListener('mousedown', handleClickOutSide)
    }, [])

   
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)
            try {
               
                const params = new URLSearchParams({ limit: '10' });
                
                if (query) params.append('search', query);
                
                if (startDate) params.append('startDate', startDate.toISOString());
                if (endDate) params.append('endDate', endDate.toISOString());

                const url = `${API_URL}/user/search?${params.toString()}`;
                
                const res = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setResults(data.data || [])
                }
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
       
        const delayDebounce = setTimeout(fetchData, 300)
        return () => clearTimeout(delayDebounce)
    }, [query, startDate, endDate]) 

    const handleFollow = async (userId: string, currentStatus: boolean) => {
        setResults(prev => prev.map(user => {
            if (user.id === userId) {
                const newStatus = !currentStatus
                return {
                    ...user,
                    isFollowing: newStatus,
                    _count: {
                        ...user._count,
                        followedBy: newStatus
                            ? user._count.followedBy + 1
                            : user._count.followedBy - 1
                    }
                }
            }
            return user
        }))
        try {
            await fetch(`${API_URL}/user/${userId}/follow`, {
                method: 'POST',
                headers: { "Authorization": `Bearer ${token}` }
            })
        } catch (error) {
            console.error(error)
        }
    }

    const handleFollowClick = (user: UserResult) => {
        if (user.isFollowing) {
            setUserToUnfollow(user)
        } else {
            handleFollow(user.id, user.isFollowing)
        }
    }

    const handleUnfollowConfirm = () => {
        if (userToUnfollow) {
            handleFollow(userToUnfollow.id, true)
            setUserToUnfollow(null)
        }
    }

  
    const DateChip = ({ label, date, onClear }: { label: string, date: Date, onClear: () => void }) => (
        <div className="flex items-center bg-[#333] pl-3 pr-2 py-1 rounded-lg mr-2 shrink-0 animate-in fade-in zoom-in duration-200">
            <span className="text-white text-[13px] font-semibold whitespace-nowrap">
                {label} {format(date, 'd MMM yyyy', { locale: uk })} р.
            </span>
            <div 
                onClick={(e) => { e.stopPropagation(); onClear(); }} 
                className="ml-1 p-0.5 hover:bg-[#444] rounded-full cursor-pointer text-[#a0a0a0] hover:text-white transition-colors"
            >
                <X size={14} />
            </div>
        </div>
    );

    return (
        <div className="bg-black min-h-screen w-full text-white px-4 font-sans overflow-y-auto relative z-0 pl-24 pt-6">
            <UnfollowModal
                isOpen={!!userToUnfollow}
                onClose={() => setUserToUnfollow(null)}
                onConfirm={handleUnfollowConfirm}
                name={userToUnfollow?.name || ''}
                avatarPath={userToUnfollow?.avatarPath || null}>
            </UnfollowModal>

            <div className="max-w-2xl mx-auto">
                <div className="flex justify-center items-center mb-6">
                    <span className="text-white font-semibold text-[16px]">Пошук</span>
                </div>
            </div>

            <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <div className="mx-auto max-w-2xl overflow-y-auto scrollbar-hide bg-[#181818] rounded-3xl border border-[#333] w-full flex-1 p-4 min-h-[80vh]">
                
                <div className="relative mb-6">
                    
                    <div 
                        ref={inputContainerRef}
                        className="w-full bg-black rounded-2xl border border-transparent focus-within:border-[#333] transition-all flex items-center px-4 py-2 relative min-h-[50px]"
                        onClick={() => inputRef.current?.focus()} 
                    >
                        <div className="text-[#616161] mr-3 shrink-0">
                            <SearchIcon size={20} />
                        </div>

                        {startDate && <DateChip label="Після" date={startDate} onClear={() => setStartDate(null)} />}
                        {endDate && <DateChip label="До" date={endDate} onClear={() => setEndDate(null)} />}
                        
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder={(!startDate && !endDate) ? "Пошук" : ""}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="bg-transparent text-white placeholder-[#616161] outline-none flex-1 min-w-[50px] py-1 text-[15px]"
                        />

                        <div ref={filterRef} className="ml-2 relative">
                            <div 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpenFilterModal(!isOpenFilterModal);
                                }}
                                className={`
                                    cursor-pointer transition-all duration-200 
                                    flex items-center justify-center w-9 h-9 rounded-full 
                                    hover:bg-[#1f1f1f] 
                                    ${(isOpenFilterModal || startDate || endDate) ? 'text-white' : 'text-[#616161] hover:text-white'}
                                `}
                            >
                                <SlidersHorizontal size={20} />
                            </div>

                           
                            {isOpenFilterModal && (
                                <SearchFilter 
                                    onStartDateClick={() => {
                                        setOpenDatePicker('start');
                                        setIsOpenFilterModal(false);
                                    }}
                                    onEndDateClick={() => {
                                        setOpenDatePicker('end');
                                        setIsOpenFilterModal(false);
                                    }}
                                />
                            )}
                        </div>
                    </div>

                
                    {openDatePicker && (
                        <div className="absolute top-16 right-0 z-50 animate-in fade-in zoom-in duration-200">
                        
                            <div className="fixed inset-0 z-40" onClick={() => setOpenDatePicker(null)}></div>
                            
                            <div className="relative z-50">
                                <DatePicker
                                    selected={openDatePicker === 'start' ? startDate : endDate}
                                    onChange={(date:Date | null) => {
                                        if (openDatePicker === 'start') setStartDate(date);
                                        else setEndDate(date);
                                        setOpenDatePicker(null);
                                    }}
                                    inline
                                    locale="uk"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <h2 className="text-[#616161] text-[16px] font-semibold mb-2 px-1">
                    {query ? 'Результати пошуку' : 'Стежте за рекомендованими користувачами'}
                </h2>
                
                <div className="flex flex-col gap-2 scrollbar-hide flex-1 overflow-y-auto">
                    {loading && <div className="text-[#616161] text-center py-4">Завантаження...</div>}

                    {!loading && results.length === 0 && (
                        <div className="text-[#616161] text-center py-10 opacity-50">
                            {query ? 'Нічого не знайдено' : 'Немає рекомендацій'}
                        </div>
                    )}

                    {results.map(user => (
                        <div key={user.id} className="flex items-start py-3 border-b border-[#333] last:border-0">
                            <div 
                                onClick={() => navigate(`/profile/${user.id}`)}
                                className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden shrink-0 mr-3 cursor-pointer"
                            >
                                <Avatar src={user.avatarPath} alt={user.name}></Avatar>
                            </div>
                            
                            <div className="flex-1 min-w-0 mr-3">
                                <div className="flex flex-col">
                                    <div className="w-fit">
                                        <UserHoverCard userId={user.id}>
                                            <div onClick={() => navigate(`/profile/${user.id}`)} className="cursor-pointer group">
                                                <h3 className="font-bold text-[15px] leading-tight group-hover:underline">
                                                    {user.name}
                                                </h3>
                                                <span className="text-[#616161] text-[15px]">
                                                    {user.name.toLowerCase().replace(/\s/g, '_')}
                                                </span>
                                            </div>
                                        </UserHoverCard>
                                    </div>
                                    {user.bio && (
                                        <p className="mt-1 text-[15px] leading-snug text-[#f3f5f7] line-clamp-2">
                                            {user.bio}
                                        </p>
                                    )}
                                    <div className="mt-2 text-[14px] text-[#616161]">
                                        {user._count.followedBy.toLocaleString()} читачів
                                    </div>
                                </div>
                            </div>
                            
                            {user.id !== currentUserId && (
                                <button onClick={() => handleFollowClick(user)}
                                    className={`px-6 py-1.5 rounded-[10px] font-bold text-[14px] transition-all border shrink-0 mt-1
                                    ${user.isFollowing 
                                        ? 'bg-transparent text-[#616161] border-[#3a3a3a] hover:bg-[#222]'
                                        : 'bg-white text-black border-white hover:bg-[#e0e0e0]'
                                    }`}
                                >
                                    {user.isFollowing ? 'Відстежується' : 'Стежити'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
export default Search;