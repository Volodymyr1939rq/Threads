import { 
    IoSearchOutline, IoSearch,
    IoHeartOutline, IoHeart,   
    IoPersonOutline, IoPerson  
} from "react-icons/io5";
import { HiBars2 } from "react-icons/hi2";
import { GoHome, GoHomeFill } from "react-icons/go"; 
import { FiPlus } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { SiThreads } from "react-icons/si";

interface HeaderProps {
    onOpenCreate?: () => void;
    onOpenFab?:()=>void;
}
  
const Header = ({ onOpenCreate,onOpenFab }: HeaderProps) => {
    const navigate = useNavigate()
    const { pathname } = useLocation()

   
    const isHomeActive = pathname === '/'
    const isSearchActive = pathname === '/search'
    const isActivityActive = pathname === '/activity'
    const isProfileActive = pathname.includes('/profile') 
    const token=Cookies.get('token')
    const isAuthenticated=Boolean(token && token!==undefined)
    if(pathname==='/login'){
        return null
    }
    const handleOpenProfile = () => {
        const token = Cookies.get('token')
        if (!token) {
            navigate('/login')
            return
        }
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const userId = payload.sub || payload.id

            if (userId) {
                navigate(`/profile/${userId}`)
            }
        } catch (e) {
            console.error('tokens error', e);
            navigate('/login')
        }
    }

    return (
        <div className="fixed z-50 left-0 top-0 h-screen w-20 flex flex-col py-10 pt-4 gap-8 pl-4  bg-black">
            <div onClick={() => navigate('/')} className="mb-2 cursor-pointer hover:scale-105 transition active:scale-95 pl-2">
                <SiThreads size={32} color="white" />
            </div>
            
            <div className="flex flex-col gap-3 items-center pr-4 mt-20">
                
              
                <div onClick={() => navigate('/')} className="w-16 h-14 flex items-center justify-center group p-2 rounded-2xl transition-colors duration-300 hover:bg-[#181818] cursor-pointer">
                    {isHomeActive ? (
                        <GoHomeFill size={28} color="white" /> 
                    ) : (
                        <GoHome size={28} color="#616161" className="group-hover:text-white transition-colors"/> 
                    )}
                </div>

               
                <div onClick={() => navigate('/search')} className="w-16 h-14 flex items-center justify-center group p-2 rounded-2xl  duration-300 hover:bg-[#181818] transition cursor-pointer">
                    {isSearchActive ? (
                        <IoSearch size={28} color="white" />
                    ) : (
                        <IoSearchOutline size={28} color="#616161" className="group-hover:text-white transition-colors" />
                    )}
                </div>

              
                <button onClick={onOpenCreate} className="w-16 h-14 bg-[#181818] rounded-2xl flex items-center justify-center transition-colors cursor-pointer hover:bg-[#252525]">
                    <FiPlus size={28} strokeWidth={3} className="text-[#616161] transition-colors duration-200 hover:text-white"/>
                </button>

               
                <div 
                onClick={()=>navigate('/activity')}
                className="w-16 h-14 flex items-center justify-center group p-2 rounded-2xl transition-colors duration-300 hover:bg-[#181818] cursor-pointer">
                    {isActivityActive ? (
                        <IoHeart size={28} color="white" />
                    ) : (
                        <IoHeartOutline size={28} color="#616161" className="group-hover:text-white transition-colors" />
                    )}
                </div>

             
                <button onClick={handleOpenProfile} className="w-16 h-14 flex items-center justify-center group p-2 rounded-2xl transition-colors duration-300 hover:bg-[#181818] cursor-pointer">
                    {isProfileActive ? (
                        <IoPerson size={28} color="white" />
                    ) : (
                        <IoPersonOutline size={28} color="#616161" className="group-hover:text-white transition-colors" />
                    )}
                </button>

            </div>

            <div className="flex flex-col items-center pr-4 pt-18">
                <HiBars2 size={28} className="text-[#616161] transition-colors duration-300 hover:text-white cursor-pointer"/>
            </div>
            {isAuthenticated && (

            <div onClick={onOpenFab} className="fixed bottom-6 right-7 w-21 h-17 rounded-2xl bg-[#181818] border border-neutral-700 flex items-center justify-center active:scale-95 transition hover:scale-110">
                <FiPlus size={28} strokeWidth={3} className="text-white"/>
            </div>
            )}
        </div>
    )
}

export default Header