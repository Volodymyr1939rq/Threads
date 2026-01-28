import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';


interface PostState {
  isLiked: boolean;
  likesCount: number;
  commentsCount: number; 
}

interface PostContextType {
  postStates: Record<string, PostState>;
  updatePostState: (id: string, isLiked: boolean, changeCount: number) => void;
  initPostState: (id: string, isLiked: boolean, likesCount: number, commentsCount: number) => void;
  incrementComments: (id: string) => void;
  decrementComments:(id:string)=>void;
}

const PostContext = createContext<PostContextType | undefined>(undefined);

export const PostProvider = ({ children }: { children: ReactNode }) => {
  const [postStates, setPostStates] = useState<Record<string, PostState>>({});

  const updatePostState = useCallback((id: string, isLiked: boolean, changeCount: number) => {
    setPostStates((prev) => {
     
      const current = prev[id] || { isLiked: !isLiked, likesCount: 0, commentsCount: 0 }; 
      return {
        ...prev,
        [id]: {
          ...current,
          isLiked: isLiked,
          likesCount: current.likesCount + changeCount,
        },
      };
    });
  }, []);

  const initPostState = useCallback((id: string, isLiked: boolean, likesCount: number, commentsCount: number) => {
    setPostStates((prev) => {
      if (prev[id]) return prev;
      
      return {
        ...prev,
        [id]: { isLiked, likesCount, commentsCount }
      };
    });
  }, []);
      
  const incrementComments = useCallback((id: string) => {
    setPostStates((prev) => {
      const current = prev[id] || {isLiked:false,likesCount:0,commentsCount:0};
      if (!current) return prev; 
      
      return {
        ...prev,
        [id]: {
          ...current,
         
          commentsCount: current.commentsCount + 1
        }
      }
    })
  }, []);

  const decrementComments=useCallback((id:string)=>{
    setPostStates((prev)=>{
      const current=prev[id]
      if(!current) return prev
      return {
        ...prev,
        [id]:{
          ...current,
          commentsCount:Math.max(0,current.commentsCount-1)
        }
      }
    })
  },[])

  return (
    <PostContext.Provider value={{ postStates, updatePostState, initPostState, incrementComments,decrementComments}}>
      {children}
    </PostContext.Provider>
  );
};


export const usePostContext = () => {
  const context = useContext(PostContext);
  if (!context) throw new Error("usePostContext must be used within a PostProvider");
  return context;
};