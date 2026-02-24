import { useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";

import { 
  IoRepeatOutline, 
  IoTrashOutline, 
  IoChatbubbleEllipsesOutline 
} from "react-icons/io5";

interface RepostMenuProps {
  postId: string;
  isReposted: boolean;
  onClose: () => void; 
  updateState: (newIsReposted: boolean, newCount: number) => void;
  currentCount: number;
  type?:string;
}

const RepostMenu = ({ postId, isReposted, onClose, updateState, currentCount,type='post' }: RepostMenuProps) => {
  const queryClient = useQueryClient();
  const API_URL = "http://localhost:3000";

  const handleRepostAction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose(); 

    const newRepostState = !isReposted;
    const newCount = newRepostState ? currentCount + 1 : currentCount - 1;

    updateState(newRepostState, newCount);

    try {
      const token = Cookies.get("token");
      const endpoint=type==='comment' ? 'comment' : 'post'
      const res = await fetch(`${API_URL}/${endpoint}/${postId}/repost`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to repost");

      setTimeout(async () => {
        await queryClient.invalidateQueries({ queryKey: ["posts"] });
        await queryClient.invalidateQueries({ queryKey: ["reposts"] });
      }, 500);

    } catch (error) {
      console.error("Repost error:", error);
      updateState(!newRepostState, currentCount); 
     
    }
  };

  const handleQuoteAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
 
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 cursor-default"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      <div className="absolute top-8 left-2 w-64 bg-[#212121] border border-[#333] p-2 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div
          onClick={handleRepostAction}
          className={`flex items-center justify-between px-3.5 py-3.5  cursor-pointer rounded-xl transition-colors duration-200
            ${isReposted ? "text-red-500 hover:bg-neutral-800" : "text-white hover:bg-neutral-800"}`}
        >
          <span className="font-semibold text-[15px]">
            {isReposted ? "Видалити" : "Зробити репост"}
          </span>
          {isReposted ? <IoTrashOutline size={20} /> : <IoRepeatOutline size={20} />}
        </div>


        <div
          onClick={handleQuoteAction}
          className="flex items-center justify-between px-3.5 py-3.5 rounded-xl hover:bg-neutral-800 cursor-pointer transition-colors duration-200 text-white"
        >
          <span className="font-semibold text-[15px]">Цитата</span>
          <IoChatbubbleEllipsesOutline size={20} />
        </div>
      </div>
    </>
  );
};

export default RepostMenu;