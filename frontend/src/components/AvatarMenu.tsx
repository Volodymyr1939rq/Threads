 interface AvatarMenuProps{
    onUpload:()=>void;
    onClose:()=>void;
    onRemove:()=>void;
    hasAvatar:boolean;
 }
const AvatarMenu=({onUpload,onClose,onRemove,hasAvatar}:AvatarMenuProps)=>{

    
    return(
      <div className="fixed inset-0 z-200  px-4 text-white bg-black/25 animate-in fade-in duration-200" onClick={onClose}>
       <div onClick={(e)=>e.stopPropagation()} className={`
                    ${hasAvatar ? '-ml-2.5': 'ml-25'}
                    absolute top-20 left-1/2 -translate-x-1/2
                    w-full ${hasAvatar ? 'max-w-[620px]' : 'max-w-[400px]'} 
                    bg-[#242424] border border-[#333] rounded-2xl overflow-hidden 
                    flex flex-col p-2 gap-1 
                    transition-all duration-300 ease-in-out
                    shadow-2xl
                `}>
        <button onClick={onUpload} className="w-full text-left px-4 py-3 text-[15px] font-bold hover:bg-[#3B3B3B] rounded-2xl active:bg-[#1a1a1a] transition outline-none">
            Завантажити світлину
        </button>
        <button className="w-full text-left px-4 py-3 text-[15px] font-bold hover:bg-[#3B3B3B] rounded-2xl  active:bg-[#1a1a1a] transition outline-none">
            Імпортувати з Instagram
        </button>
        {hasAvatar && (
        <button onClick={onRemove} className="w-full text-left px-4 py-3 text-[#FF3040] text-[15px] font-bold hover:bg-[#3B3B3B] rounded-2xl active:bg-[#1a1a1a] transition outline-none ">
            Видалити наявну світлину
            </button>
        )}
       </div>
      </div>
    )
}

export default AvatarMenu;