import { History, User } from "lucide-react";

interface SearchFilterProps{
  onStartDateClick:()=>void;
  onEndDateClick:()=>void;
}


const SearchFilter=({onStartDateClick,onEndDateClick}:SearchFilterProps)=>{
   

    return (
      <div className="absolute right-0 top-full mt-4 w-[250px] border border-[#333] bg-[#212121] rounded-2xl shadow-xl overflow-hidden z-50 py-2 animate-in fade-in zoom-in duration-200">
        <div
        onClick={onStartDateClick} 
        className="flex items-center justify-between px-4 py-3 mx-2 rounded-xl hover:bg-[#333333] cursor-pointer transition-colors group">
            <span className="font-semibold text-[15px] text-white ml-6">Після дати</span>
            <History size={20} className="text-white group-colors:text-white transition-colors scale-x-[-1]"></History>
        </div>
         <div
         onClick={onEndDateClick}
         className="flex items-center justify-between px-4 py-3 mx-2 rounded-xl hover:bg-[#333333] cursor-pointer transition-colors group">
            <span className="font-semibold text-[15px] text-white ml-6">До дати</span>
            <History size={20} className="text-white group-colors:text-white transition-colors"></History>
        </div>
        <div className="h-px bg-[#333] my-2 w-full"></div>
          <div className="flex items-center justify-between px-4 py-3 mx-2 rounded-xl hover:bg-[#333333] cursor-pointer transition-colors group">
            <span className="font-semibold text-[15px] text-white ml-6">Від профілю...</span>
            <User size={20} className="text-white group-colors:text-white transition-colors"></User>
        </div>
      </div>
    )
}

export default SearchFilter;