
import { IoPersonCircle } from "react-icons/io5";

interface AvatarProps{
    src:string | null | undefined;
    className?:string;
    alt?:string;
}

const Avatar=({src,className="w-full h-full",alt='Avatar'}:AvatarProps)=>{
      
    const hasValidImage=src && src !=="" && src!=='/person.png'

    if(hasValidImage){
        return (
            <img src={src}
            alt={alt}
            className={`${className} object-cover rounded-full`}>
            </img>
        )
    }
    return (
        <div className={`${className} flex items-center justify-center bg-[#A1A1A1]  rounded-full overflow-hidden`}>
            <IoPersonCircle  className="w-full h-full text-[#D9D9D9]  scale-[1.3]"></IoPersonCircle>
        </div>
    )
}

export default Avatar;