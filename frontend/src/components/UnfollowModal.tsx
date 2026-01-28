import Avatar from "./Avatar";

interface unFollowModal{
    isOpen:boolean;
    onClose:()=>void;
    onConfirm:()=>void;
    name:string;
    avatarPath:string | null;
}


const UnfollowModal=({isOpen,onClose,onConfirm,name,avatarPath}:unFollowModal)=>{
    if(!isOpen) return null;
    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-4">
            <div
            onClick={(e)=>e.stopPropagation()} 
            className="w-full bg-[#181818] max-w-[300px] rounded-2xl overflow-hidden border border-[#333] flex flex-col items-center animate-in fade-in zoom-in duration-200">
                 <div className="pb-6 p-8 flex flex-col items-center w-full">
                    <div className="w-16 h-16 rounded-full overflow-hidden mb-4 border border-[#333]">
                        <Avatar src={avatarPath} alt={name}></Avatar>
                    </div>
                    <h3 className="text-white text-[15px] font-bold text-center leading-snug">
                        Не стежити за {name}?
                    </h3>
                 </div>
                 <div className="w-full grid grid-cols-2 border-t border-[#333] h-[50px]">
                    <button 
                    onClick={onClose}
                    className="text-white font-normal text-[15px] hover:bg-[#222] transition-colors border-r border-[#333] active:bg-[#1a1a1a]">
                        Скасувати
                    </button>
                    <button 
                     onClick={onConfirm}
                     className="text-[#ff3040] font-bold text-[15px] hover:bg-[#222] transition-colors active:bg-[#1a1a1a]">
                          Не стежити
                    </button>
                 </div>
            </div>
        </div>
    )
}

export default UnfollowModal;