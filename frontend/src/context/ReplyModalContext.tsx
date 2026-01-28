import { createContext, useContext, useRef, useState, type ReactNode } from 'react';
import Cookies from 'js-cookie';
import ReplyModal from '../components/ReplyModal';
import { usePostContext } from "../context/PostContext";

const API_URL = 'http://localhost:3000'; // Перевір, чи тут правильний порт

interface PostData {
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
}

interface ReplyModalContextType {
    openReplyModal: (post: PostData, onSuccess?: () => void) => void;
    closeReplyModal: () => void;
}

const replyModalContext = createContext<ReplyModalContextType | undefined>(undefined)

export const ReplyModalProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [replyingToPost, setReplyingToPost] = useState<PostData | null>(null)
    const onSuccessRef = useRef<(() => void) | null>(null)
    
    // 👇 Беремо функцію для зміни цифр
    const { incrementComments } = usePostContext()

    const openReplyModal = (post: PostData, onSuccess?: () => void) => {
        setReplyingToPost(post)
        if (onSuccess) {
            onSuccessRef.current = onSuccess
        } else {
            onSuccessRef.current = null
        }
        setIsOpen(true)
    }

    const closeReplyModal = () => {
        setIsOpen(false)
        setTimeout(() => {
            setReplyingToPost(null)
            onSuccessRef.current = null
        }, 300)
    }

    const handleSubmit = async (chain: string[]) => {
        if (!replyingToPost) return null
        const token = Cookies.get('token')
        if (!token) return

        // 1. Визначаємо правильні ID
        const rootPostId = replyingToPost.postId || replyingToPost.id
       
        // 🔥 ОПТИМІСТИЧНЕ ОНОВЛЕННЯ (МИТТЄВЕ +1)
        // Робимо це ДО запиту. Тоді ти побачиш +1, навіть якщо сервер тупить.
        incrementComments(rootPostId); 
        if (replyingToPost.postId) {
            incrementComments(replyingToPost.id);
        }

        try {
            let currentParentId: string | undefined = replyingToPost.postId ? replyingToPost.id : undefined
            
            for (const text of chain) {
                if (!text.trim()) continue
                 console.log("🕵️‍♂️ DEBUG ID:", {
            whatIsIt: replyingToPost.postId ? "Це Коментар" : "Це Пост",
            sendingRootId: rootPostId,     // <--- Тут має бути ID Поста
            sendingParentId: replyingToPost.postId ? replyingToPost.id : undefined // <--- Тут ID коментаря
        });
                // 👇 Перевір URL (має бути без /create, якщо ти пофіксив бекенд)
                // Якщо на бекенді @Post('create'), то тут пиши `${API_URL}/comment/create`
                const response = await fetch(`${API_URL}/comment`, {
                    method: 'POST',
                    headers: {
                        'Content-type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        content: text,
                        postId: rootPostId,
                        parentId: currentParentId
                    })
                })

                if (!response.ok) {
                    // Якщо сервер впав, можна (опціонально) зробити decrement, 
                    // але поки не будемо ускладнювати.
                    throw new Error(`Server Error: ${response.status}`)
                }

                const savedComment = await response.json()

                if (savedComment && savedComment.id) {
                    currentParentId = savedComment.id
                }
            }

            if (onSuccessRef.current) {
                onSuccessRef.current()
            }

        } catch (error) {
            console.error("Failed to post reply:", error);
            alert("Помилка при відправці. Перевірте консоль.");
        }
    }

    return (
        <replyModalContext.Provider value={{ openReplyModal, closeReplyModal }}>
            {children}
            <ReplyModal
                isOpen={isOpen}
                onClose={closeReplyModal}
                onSubmit={handleSubmit}
                replyingToPost={replyingToPost}
            />
        </replyModalContext.Provider>
    )
}

export const useReplyModal = () => {
    const context = useContext(replyModalContext)
    if (!context) {
        throw new Error('useReplyModal must be used within a ReplyModalProvider')
    }
    return context
}