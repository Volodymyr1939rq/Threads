import { useEffect, useRef, useState } from "react"
import { IoCheckmark, IoChevronDown } from "react-icons/io5";

interface SortDropDownMenu {
    currentSort: 'popular' | 'newest';
    onSortChange:(sort:'popular'| 'newest')=>void
}
const DropDownMenu=({currentSort,onSortChange}:SortDropDownMenu)=>{
    const [isOpenDropDawnMenu,setIsOpenDropDawnMenu]=useState(false)
    const ref=useRef<HTMLDivElement>(null)
    
    useEffect(()=>{
        const handleClickOutput=(event:any)=>{
         if(ref.current && !ref.current.contains(event.target)){
            setIsOpenDropDawnMenu(false)
         }
         document.addEventListener('mousedown',handleClickOutput)
         return ()=>document.removeEventListener('mousedown',handleClickOutput)
        }
    },[])

    const handleSelect=(sortType:'popular' | 'newest')=>{
       onSortChange(sortType)
       setIsOpenDropDawnMenu(false)
    }
    const itemBaseClasses = "w-full flex justify-between items-center px-4 py-3 text-[15px] rounded-xl transition";
    const activeItemClasses = "text-white font-bold";
    const inactiveItemClasses = "text-[#999] hover:bg-[#333] hover:text-white";
    return (
      <div className="relative inline-block text-left" ref={ref}>
       
            <button 
                onClick={() => setIsOpenDropDawnMenu(!isOpenDropDawnMenu)}
                className="flex items-center gap-1 text-white text-[15px] font-bold transition group leading-none"
            >
                <span>{currentSort === 'popular' ? 'Найпопулярніші' : 'Нещодавні'}</span>
                <IoChevronDown className="text-[#616161] transition-transform duration-200" size={18} />
            </button>

        
            {isOpenDropDawnMenu && (
                
                <div className="absolute top-full mt-2 left-0 w-60 bg-[#262626] rounded-2xl shadow-lg shadow-black/50 overflow-hidden z-50 border border-[#333]/50 p-2 animate-in fade-in zoom-in-95 duration-100 origin-top-left">
                    
                    <button 
                        onClick={() => handleSelect('popular')}
                        className={`${itemBaseClasses} ${currentSort === 'popular' ? activeItemClasses : inactiveItemClasses}`}
                    >
                        <span>Найпопулярніші</span>
                       
                        {currentSort === 'popular' && <IoCheckmark size={22} className="text-white" />}
                    </button>
                  
                    <button 
                        onClick={() => handleSelect('newest')}
                        className={`${itemBaseClasses} ${currentSort === 'newest' ? activeItemClasses : inactiveItemClasses}`}
                    >
                        <span>Нещодавні</span>
                        {currentSort === 'newest' && <IoCheckmark size={22} className="text-white" />}
                    </button>
                </div>
            )}
        </div>
    )
}
export default DropDownMenu;
 

    

    