import Post from "./Post";
import { useNavigate } from "react-router-dom";

interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  autor: {
    id: string;
    name: string;
    avatarPath: string;
  };
  repliesCount?: number;
  _count: {
    reactions: number;
    comments?: number;
    children: number;
    reposts?: number;
  };
  children?: CommentData[];
  isLiked?: boolean;
  isRepostByMe?: boolean;
  isFollowing?: boolean;
  likesCount?: number;
  stats?: {
    likes: number;
    comments?: number;
    reposts?: number;
  };
}

interface CommentTreeProps {
  comment: CommentData;
  rootPostId: string;
}

const CommentTree = ({ comment, rootPostId }: CommentTreeProps) => {
  const navigate = useNavigate();
  const hasReplies = Boolean(comment.children && comment.children.length > 0);

  const postStats = {
    likes: comment.likesCount || comment.stats?.likes || comment._count?.reactions || 0,
    dislike: 0,
    comments: comment.repliesCount ?? comment._count?.children ?? comment.children?.length ?? 0,
    reposts: comment.stats?.reposts ?? comment._count?.reposts ?? 0,
  };

  return (
    <div className="flex flex-col">
      <div className="bg-[#181818] relative">
        <Post
          id={comment.id}
          title={comment.content}
          description={null}
          image={null}
          autor={comment.autor}
          createdAt={comment.createdAt}
          isLiked={comment.isLiked || false}
          isFollowing={comment.isFollowing}
          isRepostByMe={comment.isRepostByMe}
          stats={postStats}
          isMainPost={false}
          hasThreadLine={hasReplies}
          hasBorder={!hasReplies}
          type="comment"
          repliesCount={comment.repliesCount}
          rootPostId={rootPostId}
          onClick={() => {
            navigate(`/post/${comment.id}`);
            window.scrollTo(0, 0);
          }}
        />
      </div>

      {/* Усі вкладені відповіді виводяться відразу ланцюжком, як у Threads */}
      {hasReplies && (
        <div className="flex flex-col">
          {comment.children!.map((child: CommentData) => (
            <CommentTree
              key={child.id}
              comment={child}
              rootPostId={rootPostId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentTree;