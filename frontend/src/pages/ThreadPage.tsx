import { useNavigate, useParams } from "react-router-dom";
import { useCurrentUser } from "../context/UserContext";
import { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { IoArrowBack, IoChevronForward } from "react-icons/io5";
import Post from "../components/Post";
import Avatar from "../components/Avatar";
import CommentTree from "../components/CommentTree";
import DropDownMenu from "../components/DropDawnMenu";
import { useReplyModal } from "../context/ReplyModalContext";
import ActivityModal from "../components/ActivityModal";
import { formatCount } from "../utils/FormatData";

const API_URL = 'http://localhost:3000';

const ThreadPage = () => {
    const { id } = useParams();
    const { user } = useCurrentUser();
    const navigate = useNavigate();

    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'popular' | 'newest'>('popular')
    const [isActivityOpenModal,setIsActivityOpenModal]=useState(false)
    const {openReplyModal}=useReplyModal()
   const sortedCommnets = useMemo(() => {
      
        const rawlist = post?.comments || post?.children || [];
        if (rawlist.length === 0) return [];

        
        const rootOnly = rawlist.filter((c: any) =>{
            if (post.type === 'comment') return true;
            return !c.parentId
        } );
        const comments = [...rootOnly];

        if (sortBy === 'popular') {
            return comments.sort((a, b) => (b.stats?.likes || 0) - (a.stats?.likes || 0));
        } else {
            return comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
    }, [post?.comments,post?.children, sortBy]); 

    const fetchPost = async () => {
        try {
            const token = Cookies.get('token');
            const res = await fetch(`${API_URL}/post/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                
               
                setPost(null); 
                setTimeout(() => {
                    setPost(data);
                }, 10);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
 
    useEffect(()=>{
        if(id){
            setLoading(true)
            fetch(`${API_URL}/post/${id}/view`).catch(err=>console.error(err))
            fetchPost()
        }
    },[id])
    
    const ancestors=useMemo(()=>{
        if(!post){
            return []
        }
        const list=[]
        let current=post.parent
        while(current){
            list.unshift({
                ...current,
                type:'comment'
            })
            current=current.parent
        }
        if(post.post){
            list.unshift({
                ...post.post,
                   type:'post'
            })
        }
        return list
    },[post])
    
    const hasComments=sortedCommnets && sortedCommnets.length>0
    if (loading) return <div className="flex justify-center items-center bg-black h-screen text-white">Завантаження...</div>;
    if (!post) return <div className="flex flex-col justify-center bg-black h-screen text-white items-center">Пост не знайдено</div>;
    return (
        <div className="flex flex-col bg-black text-white h-screen w-full overflow-hidden relative font-sans">
            <div className="shrink-0 h-14 z-50 bg-black/80 backdrop-blur-md">
                <div className="max-w-2xl mx-auto px-4 h-full flex items-center justify-between relative">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-[#1f1f1f] rounded-full transition z-10">
                        <IoArrowBack size={19} />
                    </button>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                        <span className="text-white text-[16px] font-bold leading-tight">Ланцюжок</span>
                        <span className="text-[12px] text-neutral-500 mt-0.5 fade-in">
                            {formatCount(post.views)} переглядів
                        </span>
                    </div>
                </div>
            </div>

            <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <div className="mx-auto max-w-2xl overflow-y-auto scrollbar-hide bg-[#181818] w-full flex-1 pb-24 rounded-t-3xl border-x border-t border-b-0 border-[#333]">
                <div className="bg-[#181818] min-h-full sm:rounded-t-3xl relative">

                    <div className="flex flex-col relative z-10 ml-2 mt-2 ">
                        {ancestors.map((ancestor)=>(
                            <div key={ancestor.id} className="relative z-0">
                                <Post
                                id={ancestor.id}
                                rootPostId={ancestor.postId  || post?.postId || post?.id}
                                title={ancestor.title || ancestor.content}
                                description={ancestor.description}
                                image={ancestor.image}
                                autor={ancestor.autor}
                                createdAt={ancestor.createdAt}
                                isRepostByMe={ancestor.isRepostByMe}
                                repliesCount={ancestor.repliesCount}
                                replyName={ancestor.replyName}
                               stats={{
                likes: ancestor.likesCount || ancestor.stats?.likes || ancestor._count?.reactions || 0,
                dislike: 0,
                reposts:ancestor.stats?.reposts || ancestor._count?.reposts || 0,
                comments: ancestor.repliesCount || ancestor.stats?.comments || ancestor._count?.comments || 0
                
            }}
                                isLiked={ancestor.isLiked}
                                isFollowing={ancestor.isFollowing}
                                type={ancestor.type==='post' ? 'post' :'comment'}
                                hasThreadLine={true}
                                hasBorder={false}
                                onClick={()=>{navigate(`/post/${ancestor.id}`);
                                window.scrollTo(0,0)}}></Post>
                            </div>
                        ))}
                        <div className="relative z-10">
                        <Post
                            id={post.id}
                            title={post.title || post.content}
                            description={post.description}
                            image={post.image}
                            autor={post.autor}
                            createdAt={post.createdAt}
                            type={post.type}
                            repliesCount={post.repliesCount}
                            isRepostByMe={post.isRepostByMe}
                            replyName={post.replyName}
                            repostCount={post.repostCount}
                            stats={{
                                likes:post.likesCount || post.stats?.likes || post._count?.reactions || 0,
                                dislike: 0,
                                comments:post.repliesCount|| post.stats?.comments || post._count?.comments || 0,
                                reposts:post.stats?.reposts || post._count?.reposts || 0,
                            }}
                            isLiked={post.isLiked}
                            isFollowing={post.isFollowing}
                            isMainPost={true}
                        />
                        </div>
                    </div>

             
                    <div>
                        <div className={`mx-4 sm:mx-6 py-3 flex items-center bg-[#181818] border-t border-[#333] min-h-12 transition-all
            ${hasComments ? 'justify-between' : 'justify-end'} 
        `}>
          
            {hasComments && (
                <div className="animate-in fade-in duration-200">
                    <DropDownMenu
                        currentSort={sortBy}
                        onSortChange={setSortBy} 
                    />
                </div>
            )}

                            <button 
                            onClick={()=>setIsActivityOpenModal(true)}
                            className="flex items-center gap-1 text-[#616161] text-[15px] font-medium hover:text-neutral-500 transition">
                                <span>Переглянути дії</span>
                                <IoChevronForward className="text-lg" />
                            </button>
                        </div>

                       
                        {hasComments && (
                             <div className="w-full border-b border-[#333]"></div>
                        )}
                    </div>
                   
                    <div className="flex flex-col">
                        {sortedCommnets.length > 0 ? (
                            sortedCommnets.map((comment: any) => (
                                <div key={comment.id} >
                                    <CommentTree
                                     key={comment.id}
                                     comment={comment}
                                    rootPostId={post?.postId || post?.id } />
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center text-[#616161] text-sm">
                                Ще немає відповідей.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-2xl fixed bottom-0 left-1/2 -translate-x-1/2 w-full z-50 bg-[#101010] border-t border-x border-[#333]">
                <div className="rounded-3xl bg-[#1e1e1e] mx-4 my-3 cursor-pointer"
                    onClick={() => openReplyModal(post,fetchPost)}>
                    <div className="px-4 py-3 flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full overflow-hidden shrink-0">
                            <Avatar src={user?.avatar || null} alt={user?.name} />
                        </div>
                        <div className="flex-1 text-[#616161] text-[15px]">
                            Відповідь користувачу {post.autor.name}...
                        </div>
                    </div>
                </div>
            </div>
            <ActivityModal
            onClose={()=>setIsActivityOpenModal(false)}
            isOpen={isActivityOpenModal}
            post={post}
            />

        </div>
    )
}

export default ThreadPage;