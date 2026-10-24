import { Loader2 } from "lucide-react"

interface LoaderProps{
    size:number,
    className:string,
    fullScreen?:boolean
}

export default function Loader({size=28,className='',fullScreen=false}:LoaderProps){
    if(fullScreen){
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
                <Loader2 size={40} className="animate-spin text-white"/>
            </div>
        )
    }

    return (
       <div className={`flex items-center justify-center p-4 ${className}`}>
          <Loader2 size={size} className="animate-spin text-[#777]"/>
       </div>
    )
}