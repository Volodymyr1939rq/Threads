import { useEffect, useRef, useState } from "react";
import { useCurrentUser } from "../context/UserContext";
import { formatDistanceToNow } from "date-fns";
import { uk } from "date-fns/locale";
import { IoCloseOutline, IoEllipsisHorizontalCircleOutline } from "react-icons/io5";
import Avatar from "./Avatar";
import { AlignLeft, FileText, ImageIcon, MapPin, Smile } from "lucide-react";
import { MdGif } from "react-icons/md";

// ❌ ТУТ НЕ МАЄ БУТИ usePostContext

interface ReplyModalsProps {
    onClose: () => void;
    onSubmit: (chain: string[]) => Promise<void | undefined | null>;
    isOpen: boolean;
    replyingToPost: {
        id: string;
        title: string;
        description?: string | null;
        content?: string | null;
        createdAt: string;
        postId?: string;
        autor: {
            name: string;
            avatarPath?: string;
        }
    } | null
}

const ReplyModal = ({ isOpen, onClose, onSubmit, replyingToPost }: ReplyModalsProps) => {
    const { user } = useCurrentUser()
    
    const [chain, setChain] = useState<string[]>([''])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const textAreaRefs = useRef<(HTMLTextAreaElement | null)[]>([])

    const adJustHeight = (index: number) => {
        const el = textAreaRefs.current[index]
        if (el) {
            el.style.height = 'auto'
            el.style.height = el.scrollHeight + 'px'
        }
    }
    useEffect(() => {
        if (isOpen) {
            chain.forEach((_, i) => adJustHeight(i))
        }
    }, [chain, isOpen])

    if (!isOpen || !replyingToPost) return null;

    const handleChainChange = (index: number, value: string) => {
        const NewChain = [...chain]
        NewChain[index] = value
        setChain(NewChain)
    }
    const addToChain = () => {
        if (chain[chain.length - 1].trim() === '') return
        setChain([...chain, ''])
    }
    const removeFromChain = (index: number) => {
        if (chain.length === 1) {
            setChain([''])
            return
        }
        const newChain = chain.filter((_, i) => i !== index)
        setChain(newChain)
    }

    // 👇 ПРОСТИЙ HANDLER БЕЗ ЛОГІКИ
    const handleSubmit = async () => {
        const validChain = chain.filter(t => t.trim().length > 0)
        if (validChain.length === 0) return
        
        setIsSubmitting(true)
        try {
            // Викликаємо функцію з Context. Вона все зробить сама.
            await onSubmit(validChain) 
            
            // Просто чистимо поля
            setChain([''])
            onClose()

        } catch (error) {
            console.error('ReplyModal error:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    let timeAgo = ''
    try {
        timeAgo = formatDistanceToNow(new Date(replyingToPost.createdAt), { locale: uk }).replace('близько', '')
    } catch (e) {
        timeAgo = ''
    }

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="w-full max-w-[650px] bg-[#181818] border border-[#333] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}>
                <div className="relative flex items-center justify-between px-6 py-4 border-b border-[#333] shrink-0">
                    <button
                        onClick={onClose}
                        className="text-white text-[16px] hover:opacity-80 transtion">
                        Скасувати
                    </button>
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <span className="text-white text-[17px] fond-bold">Відповідь</span>
                    </div>
                    <IoEllipsisHorizontalCircleOutline size={25} />
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex gap-3">
                        <div className="flex flex-col items-center shrink-0 w-10">
                            <div className="w-9 h-9 rounded-full overflow-hidden relative z-10 bg-black">
                                <Avatar src={replyingToPost.autor.avatarPath || null} alt={replyingToPost.autor.name} />
                            </div>
                            <div className="w-0.5 bg-[#333] flex-1 my-2 min-h-1 rounded-full"></div>
                        </div>
                        <div className="flex-1 pb-6">
                            <div className="flex items-center gap-1 mb-1">
                                <span className="font-semibold text-white text-[15px]">{replyingToPost.autor.name}</span>
                                <span className="text-[#777] text-[14px] ml-1">{timeAgo}</span>
                            </div>
                            <div className="text-white text-[15px] leading-snug">
                                {replyingToPost.description || replyingToPost.title || replyingToPost.content}
                            </div>
                        </div>
                    </div>
                    {chain.map((indexText, index) => (
                        <div key={index} className="flex gap-3 relative group">
                            <div className="flex flex-col items-center shrink-0 w-10 relative">
                                <div className="w-0.5 bg-[#333] z-1 absolute top-[46px] bottom-2 left-1/2"></div>
                                <div className="w-9 h-9 rounded-full overflow-hidden relative z-10 bg-black">
                                    <Avatar src={user?.avatar} alt={user?.name} />
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col gap-1 pb-2">
                                <div className="flex items-start justify-between">
                                    <span className="font-semibold text-white text-[15px] mt-1">{user?.name}</span>
                                    {chain.length > 1 && (
                                        <button onClick={() => removeFromChain(index)} className="text-[#555] hover:text-white p-1 transition">
                                            <IoCloseOutline size={25} />
                                        </button>
                                    )}
                                </div>
                                <textarea
                                    ref={el => { textAreaRefs.current[index] = el }}
                                    value={indexText}
                                    onChange={(e) => handleChainChange(index, e.target.value)}
                                    placeholder={index === 0 ? `Відповідь користувачу ${replyingToPost.autor.name}...` : "Продовжити думку..."}
                                    className="w-full bg-transparent text-white text-[15px] placeholder-[#777] resize-none outline-none overflow-hidden"
                                    rows={1}
                                    autoFocus={index === chain.length - 1 && chain.length > 1}
                                />
                                {/* Кнопки форматування (залишив як є) */}
                                <div className="flex items-center gap-4 text-[#777]">
                                    <button className='hover:text-white transition'><AlignLeft size={18} /></button>
                                    <button className="hover:text-white transition"><FileText size={18} /></button>
                                    <button className="hover:text-white transition"><MapPin size={18} /></button>
                                    <button className="hover:text-white transition"><Smile size={18} /></button>
                                    <button className="hover:text-white transition"><ImageIcon size={18} /></button>
                                    <button className="hover:text-white transition border rounded border-[#777]"><MdGif size={18} className='hover:text-white transition border-white' /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="flex gap-3 relative cursor-pointer group m2-2 opacity-60 hover:opacity-100 transition"
                        onClick={addToChain}>
                        <div className="flex flex-col items-center shrink-0 relative w-10">
                            <div className="w-5 h-5 rounded-full overflow-hidden relative bg-black mt-1 z-10">
                                <Avatar src={user?.avatar || null} alt={user?.name} />
                            </div>
                        </div>
                        <div className="flex-1 pt-1">
                            <div className="text-[#616161] text-[15px]">
                                Додати в ланцюжок
                            </div>
                        </div>
                    </div>

                </div>
                <div className="px-6 py-4 flex items-center justify-between shrink-0">
                    <button className="text-[#777] text-[15px] hover:text-white transition">
                        Параметри відповідей
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={chain[0].trim() === '' || isSubmitting}
                        className={`px-4 py-1.5 rounded-xl font-semibold text-[15px] border border-[#333]
                         ${chain[0].trim() !== '' && !isSubmitting
                                ? ' text-white'
                                : 'bg-transparent text-[#4d4d4d] border-[#333] cursor-not-allowed'}`}>
                        {isSubmitting ? ' ' : 'Опублікувати'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ReplyModal;