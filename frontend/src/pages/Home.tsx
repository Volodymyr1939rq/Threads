import Post from "../components/Post"
import ThreadsModal from "../components/CreateThreadModal"
import { useState, useEffect, useRef } from "react"
import Cookies from "js-cookie"
import { useCurrentUser } from "../context/UserContext";
import Avatar from "../components/Avatar";
import SnowFall from "../components/SnowFall";
import { useNavigate } from "react-router-dom";
import UserProfileModal from "../components/UserProfileModal";
import { useQueryClient, useInfiniteQuery } from "@tanstack/react-query";

const API_URL = 'http://localhost:3000'

interface HomeProps {
    refresh: number;
}


interface PostData {
    id: string;
    title: string;
    description: string | null;
    image: string | null;
    createdAt: string;
    autor: {
        id: string;
        name: string;
        avatarPath: string;
        isFollowing:boolean;
    };

    stats?: {
        likes: number;
        comments: number;
        reposts: number;
    };
    _count?: {
        reactions: number;
        comments: number;
        reposts: number;
    };
    isLiked: boolean;
    isFollowing: boolean;
    isRepostByMe: boolean; 
    isRepost?: boolean;
}

const Home = ({ refresh }: HomeProps) => {
    const [createOpenModal, setCreateOpenModal] = useState(false);
    const { user } = useCurrentUser()
    const scrollRef = useRef<HTMLDivElement>(null)
    const [showSnow, setShowSnow] = useState(true)
    const [activeTab, setActiveTab] = useState<'For You' | 'following'>('For You')
    const navigate = useNavigate()
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

    const queryClient = useQueryClient()

    const fetchPosts = async ({ pageParam = 1 }) => {
        const token = Cookies.get('token');
        const endpoint = activeTab === 'following'
            ? `${API_URL}/post/followers-feed?page=${pageParam}&limit=5`
            : `${API_URL}/post/?page=${pageParam}&limit=5`
        
        const response = await fetch(endpoint, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok')
        }
        return response.json()
    };

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
        refetch,
    } = useInfiniteQuery({
        queryKey: ['posts', 'feed', activeTab],
        queryFn: fetchPosts,
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            if (lastPage.meta && lastPage.meta.page < lastPage.meta.lastPage) {
                return lastPage.meta.page + 1;
            }
            return undefined
        }
    })

    useEffect(() => {
        if (refresh > 1) {
            refetch()
            if (scrollRef.current) {
                scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
            }
        }
    }, [refresh, refetch]);


    const handleScroll = () => {
        if (!scrollRef.current) return

        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
        if (scrollTop > 150 && showSnow) {
            setShowSnow(false)
        } else if (scrollTop <= 150 && !showSnow) {
            setShowSnow(true)
        }
        if (scrollTop + clientHeight >= scrollHeight - 100 && hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
        }
    }

    const handleFollowUpdate = (updatedUserId: string, newStatus: boolean) => {
        queryClient.setQueriesData({ queryKey: ['posts', 'feed'] }, (oldData: any) => {
            if (!oldData) return oldData

            return {
                ...oldData,
                pages: oldData.pages.map((page: any) => ({
                    ...page,
                    data: page.data.map((post: PostData) => {
                        if (post.autor.id === updatedUserId) {
                            return { ...post, isFollowing: newStatus }
                        }
                        return post
                    })
                }))
            }
        })
    }
    
    const allPosts = data?.pages.flatMap((page) => page.data) || []

    return (
        <div className="bg-black h-screen w-full overflow-hidden flex flex-col text-white font-sans">
            <div className={`duration-700 transition-opacity easy-in-out sticky top-0 z-0 ${showSnow ? 'opacity-100' : 'opacity-0'}`}>
                <SnowFall />
            </div>
            <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <div className="shrink-0 h-[50px] flex items-center justify-center pt-6 z-50 bg-transparent">
                <div className="flex gap-8 font-bold text-[15px]">
                    <button onClick={() => setActiveTab('For You')}
                        className={`font-semibold pb-3 px-4 transform-all relative
                    ${activeTab === 'For You'
                                ? 'text-white '
                                : 'text-[#616161] hover:text-gray-300'
                            }`}
                    >
                        Для вас
                        {activeTab === 'For You' && (
                            <div className="absolute bottom-[3px] left-0 w-full h-[1.4px] bg-white"></div>
                        )}
                    </button>
                    <button onClick={() => setActiveTab('following')}
                        className={`font-semibold pb-3 px-4 transform-all relative
                    ${activeTab === 'following'
                                ? 'text-white'
                                : 'text-[#616161] hover:text-gray-300'
                            }`}
                    >
                        Відстежується
                        {activeTab === 'following' && (
                            <div className="absolute bottom-[3px] left-0 w-full h-[1.2px] bg-white"></div>
                        )}
                    </button>
                </div>
            </div>
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="mx-auto max-w-2xl overflow-y-auto scrollbar-hide bg-[#181818] rounded-t-3xl border-x border-t border-b-0 border-[#333] w-full flex-1 relative">

                <div className="relative w-full mx-auto py-6 flex flex-col">


                    <div className="flex items-center justify-between h-14 py-2 px-4 mb-2">
                        <div className="h-full flex w-full items-center">
                            <div onClick={() => user?.id && navigate(`/profile/${user?.id}`)} className="w-11 h-11 mr-4">
                                <Avatar src={user?.avatar} className="rounded-full" alt="person" />
                            </div>
                            <input
                                type="text"
                                placeholder="Що нового?"
                                className="bg-transparent outline-none text-white w-full cursor-pointer"
                                onClick={() => setCreateOpenModal(true)}
                                readOnly
                            />
                        </div>
                        <button
                            className="border border-[#333] rounded-xl px-5 py-1.5 font-bold text-white "
                            onClick={() => setCreateOpenModal(true)}
                        >
                            Опублікувати
                        </button>
                    </div>

                    <hr className="w-full border-b-[0.33px] border-neutral-800 mb-0" />


                    <div className="flex-1">
                        {status === 'pending' && (
                            <div className="text-center py-8 text-gray-500">Завантаження...</div>
                        )}
                        {status === 'error' && (
                            <div className="text-center py-8 text-gray-500">Помилка завантаження стрічки</div>
                        )}
                        {status === 'success' && allPosts.map((post: PostData) => (
                            <Post
                                key={post.id}
                                id={post.id}
                                title={post.title}
                                description={post.description}
                                image={post.image}
                                autor={post.autor}
                                createdAt={post.createdAt}
                                isRepost={post.isRepost}
                                stats={{
                                    likes: post.stats?.likes ?? post._count?.reactions ?? 0,
                                    dislike: 0,
                                    comments: post.stats?.comments ?? post._count?.comments ?? 0,
                                    reposts: post.stats?.reposts ?? post._count?.reposts ?? 0 
                                }}
                                isLiked={post.isLiked}
                                isRepostByMe={post.isRepostByMe} 
                                repostCount={post.stats?.reposts ?? post._count?.reposts ?? 0}
                                isFollowing={post.autor.isFollowing}
                                onFollowChange={(id, status) => handleFollowUpdate(id, status)}
                                onUserClick={(clickedUserId) => {
                                    if (user?.id === clickedUserId || post.isFollowing) {
                                        navigate(`/profile/${clickedUserId}`)
                                    } else {
                                        setSelectedUserId(clickedUserId)
                                    }
                                }
                                }

                            />
                        ))}
                        {isFetchingNextPage && (
                            <div className="text-center py-4 text-gray-500">Завантаження нових постів...</div>
                        )}
                        {hasNextPage && allPosts.length > 0 && (
                            <div className="text-center py-10 text-[#616161] flex flex-col items-center gap-2">
                                Це всі пости на сьогодні.
                            </div>
                        )}
                        {status === 'success' && allPosts.length === 0 && (
                            <div className="text-center py-10 text-gray-500">Стрічка порожня</div>
                        )}
                    </div>
                </div>

                {createOpenModal && (
                    <ThreadsModal
                        variant="default"
                        onClose={() => setCreateOpenModal(false)}
                        onPostCreated={() => {
                            queryClient.invalidateQueries({ queryKey: ['posts', 'feed'] })
                            if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                    />
                )}

                {selectedUserId && (
                    <UserProfileModal
                        userId={selectedUserId}
                        onClose={() => setSelectedUserId(null)}
                        onFollowStatus={handleFollowUpdate}
                    />
                )}
            </div>
        </div>


    )
}

export default Home