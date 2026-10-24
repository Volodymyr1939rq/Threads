import { MoreHorizontal, Image as ImageIcon, AlignLeft, FileText, MapPin, Smile, X } from 'lucide-react';
import React, { useState } from 'react';
import Cookies from "js-cookie";
import { useCurrentUser } from '../context/UserContext'; 
import Avatar from './Avatar'; 
const API_URL=import.meta.env.VITE_API_URL
interface threadsModalProps {
    onClose: () => void;
    onPostCreated: () => void;
    variant?: 'default' | 'fab';
}

interface ThreadItem {
    id: number;
    text: string;
    file: File | null;
    preview: string | null;
}

export default function ThreadsModal({ onClose, onPostCreated, variant = 'default' }: threadsModalProps) {
 
    const [threads, setThreads] = useState<ThreadItem[]>([
        { id: Date.now(), text: '', file: null, preview: null }
    ]);
    const [uploading, setUploading] = useState(false);
    
    const { user } = useCurrentUser();

    const handleTextChange = (id: number, value: string) => {
        setThreads(prev => prev.map(item => 
            item.id === id ? { ...item, text: value } : item
        ));
    };

    const handleFileChange = (id: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const previewUrl = URL.createObjectURL(file);
            setThreads(prev => prev.map(item => 
                item.id === id ? { ...item, file: file, preview: previewUrl } : item
            ));
        }
    };

    const removeFile = (id: number) => {
        setThreads(prev => prev.map(item => {
            if (item.id === id) {
                if (item.preview) URL.revokeObjectURL(item.preview);
                return { ...item, file: null, preview: null };
            }
            return item;
        }));
    };

    const addNewThread = () => {
        const lastThread = threads[threads.length - 1];
        if (!lastThread.text && !lastThread.file) return;

        setThreads(prev => [
            ...prev,
            { id: Date.now(), text: '', file: null, preview: null }
        ]);
    };

    const removeThread = (id: number) => {
        if (threads.length === 1) return;
        setThreads(prev => prev.filter(t => t.id !== id));
    };

    const handlePost = async () => {
        if (!threads[0].text && !threads[0].file) return;
        setUploading(true);
        try {
            for (const thread of threads) {
                if (!thread.text && !thread.file) continue;
                const formData = new FormData();
                formData.append('description',thread.text)
                 
                if (thread.file) {
                    formData.append('image', thread.file);
                }
                const response = await fetch(`${API_URL}/post`, {
                    method: 'POST',
                    body: formData,
                    headers: { 'Authorization': `Bearer ${Cookies.get('token')}` }
                });
                if (!response.ok) {
                    throw new Error(`Failed to create post ${thread.id}`);
                }
            }
            onClose();
            if (onPostCreated) {
                onPostCreated();
            }
        } catch (error) {
            console.error('Error posting threads', error);
        } finally {
            setUploading(false);
        }
    };

    const isPostValid = threads.some(t => t.text.length > 0 || t.file !== null);
    const canAddThread = threads[threads.length - 1].text.length > 0 || threads[threads.length - 1].file !== null;
    
    const overlayClasses = variant === 'fab'
    ? 'items-end justify-end p-3 pointer-events-none bg-transparent' 
    : 'items-center justify-center p-4 bg-black/60 pointer-events-auto'

    const containerClasses = variant === 'fab'
     ? 'w-full max-w-[500px] mb-3 mr-4 max-h-[80vh]'
    : 'w-full max-w-[620px] max-h-[90vh]'
    const zIndexClass = variant === 'default' ? 'z-[60]' : 'z-50'
    return (
        <div
            className={`fixed inset-0 ${zIndexClass} flex ${overlayClasses}`}
            
            onClick={variant === 'default' ? onClose : undefined}
        >
            <div
            
                className={`${containerClasses} pointer-events-auto bg-[#181818] text-white rounded-2xl border border-[#333] shadow-2xl overflow-hidden relative flex flex-col`}
                onClick={(e) => e.stopPropagation()}
            >
            
                <div className="flex justify-between items-center p-4 pb-2 relative shrink-0">
                    {variant==='default' ? (
                    <button
                        onClick={onClose}
                        className="text-white text-[16px] hover:opacity-80 transition z-10"
                    >
                        Скасувати
                    </button>
                    ):(
                        <button onClick={onClose} className="text-white hover:opacity-80 transition z-10 p-1">
                            <X size={24} strokeWidth={2.5} />
                        </button>
                    )}

                    <h2 className="font-bold text-[16px] absolute left-1/2 -translate-x-1/2">
                        Новий ланцюжок
                    </h2>

                    <button className="z-10">
                        <MoreHorizontal className="text-white" />
                    </button>
                </div>

                <div className="h-px bg-[#333] w-full mt-2 mb-0 opacity-50 shrink-0"></div>
                
                <div className="overflow-y-auto custom-scrollbar flex-1 pb-4">
                    {threads.map((thread, index) => (
                        <div key={thread.id} className="px-4 pt-4 flex gap-3 relative group">
                            
                            <div className="flex flex-col items-center w-11 shrink-0 relative">
                                 <div className="w-0.5 bg-[#333] absolute top-12 bottom-0.5 left-1/2 -translate-x-1/2 z-1"></div>
                                <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-600 mb-2 z-10 relative border border-[#181818]">
                                    <Avatar src={user?.avatar} alt="avatar" className="w-full h-full object-cover" />
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col pb-0">
                                <div className="flex justify-between">
                                    <span className="font-semibold text-[15px] mb-1">{user?.name}</span>
                                    {index > 0 && (
                                        <button onClick={() => removeThread(thread.id)} className="text-gray-500 hover:text-white">
                                            <X size={14}/>
                                        </button>
                                    )}
                                </div>

                                <textarea
                                    value={thread.text}
                                    onChange={(e) => handleTextChange(thread.id, e.target.value)}
                                    placeholder={index === 0 ? "Що нового?" : "Продовжіть думку..."}
                                    className="w-full bg-transparent text-white placeholder-[#777] resize-none outline-none text-[15px] min-h-10"
                                    rows={1}
                                    style={{ height: 'auto', minHeight: '40px' }}
                                    onInput={(e) => {
                                        const target = e.target as HTMLTextAreaElement;
                                        target.style.height = 'auto';
                                        target.style.height = target.scrollHeight + 'px';
                                    }}
                                />

                                {thread.preview && (
                                    <div className='relative mt-2 mb-2 w-fit'>
                                        <img
                                            src={thread.preview}
                                            alt='Selected'
                                            className='max-h-[300px] rounded-lg object-cover border border-[#333]'
                                        />
                                        <button onClick={() => removeFile(thread.id)}
                                            className='absolute top-2 right-2 bg-black/60 rounded-full p-1 hover:bg-black/80 transition'
                                        >
                                            <X size={16} className="text-white" />
                                        </button>
                                    </div>
                                )}

                                <div className='flex gap-3 text-[#777] mb-1 -mt-1 items-center'>
                                    <input
                                        type="file"
                                        id={`file-${thread.id}`}
                                        onChange={(e) => handleFileChange(thread.id, e)}
                                        accept='image/*'
                                        hidden
                                    />

                                    <button className='hover:text-white transition'><AlignLeft size={18} /></button>
                                    <button className="hover:text-white transition"><FileText size={18} /></button>
                                    <button className="hover:text-white transition"><MapPin size={18} /></button>
                                    <button className="hover:text-white transition"><Smile size={18} /></button>
                                    <label htmlFor={`file-${thread.id}`} className="hover:text-white transition cursor-pointer">
                                        <ImageIcon size={18} />
                                    </label>
                                    <button className="hover:text-white transition border rounded border-[#777] flex items-center justify-center w-5 h-5">
                                        <span className="text-[10px] font-bold">GIF</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="px-4 flex gap-3">
                         <div className="flex flex-col items-center w-11 shrink-0 z-10">
                            <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-600 opacity-50 mt-1.5">
                                <Avatar src={user?.avatar} alt="mini-avatar" className="w-full h-full object-cover" />
                            </div>
                         </div>
                         
                         <div className="flex-1 pt-1">
                             <button 
                                onClick={addNewThread}
                                disabled={!canAddThread}
                                className={`text-[15px] transition-colors text-left -ml-0.5
                                ${canAddThread ? 'text-[#616161] hover:text-[#616161] cursor-pointer' : 'text-[#555] opacity-50 cursor-not-allowed'}`}
                             >
                                Додати в ланцюжок
                             </button>
                         </div>
                    </div>
                </div>

                <div className="flex justify-between items-center px-4 py-4 mt-auto bg-[#181818] z-20">
                    <span className="text-neutral-500 text-[15px] font-semibold cursor-pointer">
                        Параметри відповідей
                    </span>
                    <button
                        onClick={handlePost}
                        className={`px-4 py-1.5 rounded-full font-bold text-[15px] border border-[#333] transition-all
                            ${isPostValid
                                ? 'bg-white text-black'
                                : 'bg-transparent text-[#555] opacity-50 cursor-not-allowed'}
                        `}
                        disabled={!isPostValid || uploading}
                    >
                        {uploading ? "Публікація..." : "Опублікувати"}
                    </button>
                </div>
            </div>
        </div>
    )
}