
import { useState,useEffect} from "react";

interface Snow{
    id:number;
    left:string;
    opacity:number;
    size:string;
    animationDuration:string;
    animationDelay:string;

}

const SnowFall=()=>{
    const [flakes,setFlakes]=useState<Snow[]>([])
    
    useEffect(()=>{
        const snowFlakesCount=60;
        const random=(min:number,max:number)=>Math.random()*(max-min)+min

        const newFlakes=Array.from({length:snowFlakesCount}).map((_,i)=>{
            return {
                id:i,
                left:`${random(0,100)}%`,
                opacity:random(0.2,0.7),
                size:`${random(20,30)}px`,
                animationDuration:`${random(10,20)}s`,
                animationDelay:`${random(0,2)}s`,
            }
        });
        setFlakes(newFlakes)
        
    },[])
       
    return (
       <div className="absolute top-0 left-0 w-full h-[120px] pointer-events-none z-[50] overflow-hidden leading-none select-none"
            aria-hidden="true"
            style={{
              
                maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
            }}
            >
            {flakes.map((flake)=>(
                <div 
                key={flake.id}
                className="absolute top-[-30px] text-white/80 drop-shadow-sm"
                style={{
                    left:flake.left,
                    fontSize:flake.size,
                    opacity:flake.opacity,
                    animation:`fall-rotate ${flake.animationDuration} linear infinite`,
                    animationDelay:flake.animationDelay
                }}
                >
                    *
                </div>
            ))}
            <style>{`
                @keyframes fall-rotate {
                    0% {
                        transform:translateY(-10vh) translateX(0) rotate(0deg);
                    }
                    100% {
                        transform:translateY(200px) translateX(50px) rotate(180deg);
                    }
                }
                

            `}</style>
        </div>
    )
}

export default SnowFall;