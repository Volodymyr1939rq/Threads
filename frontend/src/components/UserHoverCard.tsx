import { useState, useRef } from "react";
import UserProfileModal from "./UserProfileModal";
import { createPortal } from "react-dom";

interface UserHoverCardProps {
    userId: string;
    children: React.ReactNode;
    className?: string;
}

const UserHoverCard = ({ userId, children, className }: UserHoverCardProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const hoverTimeout = useRef<any>(null);
    const [coords,setCoords]=useState({top:0,left:0})
    const handleMouseEnter=(e:React.MouseEvent)=>{
        if(hoverTimeout.current) clearTimeout(hoverTimeout.current)
        const rect=(e.currentTarget as HTMLElement).getBoundingClientRect()
        setCoords({
            top:rect.bottom,
            left:rect.left
        })
        hoverTimeout.current=setTimeout(()=>{
            setIsHovered(true)
        },500)
    }

    const handleMouseLeave=()=>{
        if(hoverTimeout.current) clearTimeout(hoverTimeout.current)

        hoverTimeout.current=setTimeout(()=>{
            setIsHovered(false) 
        },300)
    }

    return (
        <div 
            className={`relative inline-block ${className || ''}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
           
            {children}

          
            {isHovered &&  createPortal (
                <div className="fixed z-9999 pt-2"
                style={{top:coords.top,left:coords.left}}
                onMouseEnter={()=>{ if(hoverTimeout.current) clearTimeout(hoverTimeout.current) }}
                onMouseLeave={handleMouseLeave}>
                   
                       
                        <UserProfileModal 
                            userId={userId} 
                            onClose={() => setIsHovered(false)}
                            isHover={true} 
                            onFollowStatus={() => {}} 
                        />
                    </div>,
                document.body
            )}
        </div>
    );
};

export default UserHoverCard;