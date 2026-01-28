import { Download } from "lucide-react"
import { useEffect, useState } from "react"
import { IoArrowBack} from "react-icons/io5" 
interface EditBioModalProps{
    isOpen: boolean,
    onClose: () => void
    initialBio: string,
    onSave: (newBio: string) => void
}

const EditBioModal = ({ isOpen, onClose, initialBio, onSave }: EditBioModalProps) => {
    const [bioText, setBioText] = useState('')
    const MAX_SYMBOLS=100;
    useEffect(() => {
        setBioText(initialBio)
    }, [initialBio, isOpen])

    if (!isOpen) return null;

    const handleDone = () => {
        onSave(bioText)
    }

    return (
        <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
            <div 
                className="bg-[#101010] w-full max-w-[600px] rounded-xl border border-[#333] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
             
                <div className="grid grid-cols-3 items-center p-4 border-b border-[#333]">
                    <button onClick={onClose} className="text-white hover:text-gray-300 justify-self-start cursor-pointer">
                        <IoArrowBack size={24} />
                    </button>
                    <h2 className="text-white text-[16px] font-bold justify-self-center">Редагування біографії</h2>
                    <button 
                        onClick={handleDone} 
                        className="text-white text-[16px] font-bold justify-self-end cursor-pointer hover:opacity-80 transition"
                    >
                        Готово
                    </button>
                </div>

                <div className="px-5 py-4 flex flex-col grow">
                    <textarea 
                        className="w-full h-24 bg-transparent text-white text-[16px] outline-none resize-none placeholder:text-neutral-500"
                        placeholder="Написати біографію..."
                        maxLength={MAX_SYMBOLS}
                        rows={3}
                        value={bioText}
                        onChange={(e) => setBioText(e.target.value)}
                        autoFocus
                    />
                    
                  
                    <p className="text-center text-[#808080] text-[13px] mt-auto pt-4">
                        Ваша біографія доступна публічно.
                    </p>
                </div>

              
                <div className="border-t border-[#333]">
                    <button 
                        className="w-full py-4 flex items-center justify-center gap-2 text-white font-bold text-[14px] "
                    >
                        <Download size={20} />
                        Імпортувати біографію з Instagram
                    </button>
                </div>
            </div>
        </div>     
    )
}

export default EditBioModal;