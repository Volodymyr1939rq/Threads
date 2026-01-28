
import { useState } from "react";
import Post from "./Post";
import { useNavigate } from "react-router-dom";


interface CommentData {
    id:string;
    content:string;
    createdAt:string;
    autor:{
        id:string;
        name:string;
        avatarPath:string;
        
    };
    repliesCount?:number,
    _count:{
        reactions:number;
        comments?:number;
        children:number
    };
    children?:CommentData[];
    isLiked?:boolean;
    isFollowing?:boolean;
    likesCount?:number;
    stats?:{likes:number}
}
interface CommentTreeProps{
    comment:CommentData,
    rootPostId:string
}

const CommentTree=({comment,rootPostId}:CommentTreeProps)=>{
const [isExpanded, setIsExpanded] = useState(false);
 const navigate=useNavigate()
const hasReplies=comment.children && comment.children.length>0

const postStats={
    likes:comment.likesCount ||comment.stats?.likes || comment._count?.reactions || 0,
    dislike:0,
    comments:comment.repliesCount ?? comment._count?.children ?? comment.children?.length ?? 0
}
return (
    <div className="flex flex-col">
        <div className="bg-[#181818] relative ">
            <Post
            id={comment.id}
            title={comment.content}
            description={null}
            image={null}
            autor={comment.autor}
            createdAt={comment.createdAt}
            isLiked={comment.isLiked || false}
            isFollowing={comment.isFollowing}
            stats={postStats}
            isMainPost={false}
            hasThreadLine={hasReplies && isExpanded}
            type="comment"
            repliesCount={comment.repliesCount}
            rootPostId={rootPostId}
            onClick={()=>{navigate(`/post/${comment.id}`);
            window.scrollTo(0,0)}}></Post>
        </div>
        {hasReplies && (
                <div className="flex flex-col">
                    {!isExpanded ? (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation(); 
                                setIsExpanded(true);
                            }}
                            className="ml-14 py-2 text-[14px] text-[#616161] hover:text-white transition-colors text-left"
                        >
                        </button>
                    ) : (
                        <div className="ml-10 border-l border-[#333]">
                            {comment.children!.map((child: any) => (
                                <CommentTree key={child.id} comment={child} rootPostId={rootPostId} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
)
}
export default CommentTree;