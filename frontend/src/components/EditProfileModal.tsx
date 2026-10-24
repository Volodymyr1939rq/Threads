import { useEffect, useRef, useState } from "react";
import { FiLock } from "react-icons/fi";
import EditBioModal from "./CreateBioModal";
import Cookies from "js-cookie";
import { useCurrentUser } from "../context/UserContext";
import AvatarMenu from "./AvatarMenu";
import Avatar from "./Avatar";
import { HiUserAdd } from "react-icons/hi";

interface openEditModal{
isOpen:boolean;
onClose:()=>void;

};

const EditProfilModal=({isOpen,onClose}:openEditModal)=>{
    const [isBioModal,setBioModal]=useState(false)
    const [bio,setBio]=useState('')
    const [name,setName]=useState('')
    const [avatar,setAvatar]=useState<File|null>(null)
    const [preview,setPreview]=useState<string | null>(null)
    const [loading,setLoading]=useState(false)
    const [showInstagram,setShowInstagram]=useState(true)
    const fileInputref=useRef<HTMLInputElement>(null)
    const {user,refreshUser}=useCurrentUser()
    const [isAvatarMenuOpen,setIsAvatarMenuOpen]=useState(false)
    const [deleteAvatar,setDeleteAvatar]=useState(false)
    const API_URL=import.meta.env.VITE_API_URL

    useEffect(()=>{
        if(isOpen && user) {
            setName(user.name || "")
            setBio(user.bio || "")
            setPreview(
                user.avatar ||null
            )
            setAvatar(null)
            setDeleteAvatar(false)
        }
    },[user,isOpen])

    useEffect(()=>{
        if(!isOpen)
            setBioModal(false);
             setIsAvatarMenuOpen(false)
    },[isOpen])


   const handleFile=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0]
    if(file){
        setAvatar(file)
        setPreview(URL.createObjectURL(file))
        setDeleteAvatar(false)
        setIsAvatarMenuOpen(false)

    }
   }
   const handleUploadFile=async ()=>{
    fileInputref.current?.click()
    setIsAvatarMenuOpen(false)
   }
   const handleDeleteAvatar=async ()=>{
    setAvatar(null)
    setPreview(null)
    setDeleteAvatar(true)
    setIsAvatarMenuOpen(false)
   }
   const handleSave = async () => {
        console.log("Починаємо збереження...");
        setLoading(true);
        const token = Cookies.get('token');

        try {
      
            const textRes = await fetch(`${API_URL}/user/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, bio })
            });

           
            if (!textRes.ok) {
                const errorData = await textRes.json().catch(() => ({}));
                console.error("Помилка сервера:", errorData);
                return; 
            }

             if(deleteAvatar){
                await fetch(`${API_URL}/user/avatarfile`,{
                    method:'DELETE',
                    headers:{'Authorization':`Bearer ${token}`}
                })
            } else  if (avatar) {
                const formData = new FormData();
                formData.append('file', avatar);
                
                const avatarRes = await fetch(`${API_URL}/user/avatar`, {
                    method: "POST",
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });


                if (!avatarRes.ok) {
                   throw new Error('помилка завантаження аватарки')
                }
            }
            await refreshUser();
            onClose(); 

        } catch (error) {
            console.error("Критична помилка при збереженні:", error);
        } finally {
            setLoading(false);
        }
    }
   if(isBioModal){
        return (

      <EditBioModal
       isOpen={isBioModal} 
       onClose={()=>{setBioModal(false);onClose()}} 
       initialBio={bio} 
       onSave={(newBio)=>{setBio(newBio);setBioModal(false)}}>
       </EditBioModal>
        )
      }
    return (
      <div onClick={onClose} className="fixed inset-0 z-100
       flex items-center justify-center bg-black/60 px-4">

      <div onClick={(e)=>e.stopPropagation()} className="bg-[#181818] w-full max-w-[630px] rounded-2xl border border-[#333] overflow-hidden flex flex-col ">
        <div className="flex justify-between items-center p-4">
            <div className="flex flex-col gap-1">
            <h2 className=" text-white font-bold text-[14px]">Ім'я</h2>
         <div className="flex items-center  gap-2 text-white">
            <FiLock size={13}></FiLock>
            <input 
            value={name}
            onChange={(e)=>setName(e.target.value)}
            className="bg-transparent text-white w-full outline-none pb-1"
            placeholder="Ваше ім'я">
            </input>
         </div>
         </div>
         <div className=" h-15 w-15 rounded-full overflow-hidden bg-grey-800 border border-[#333]"
         onClick={()=>setIsAvatarMenuOpen(true)}>
            {preview ? (

            <Avatar src={preview} className="w-full h-full"></Avatar> 
            ): (
                <div className="w-full h-full flex items-center justify-center bg-[#1F1F1F] text-white/50 group-hover:text-white/80 border border-[#333] rounded-full transition-colors">
                <HiUserAdd size={26} className="text-white"/>
            </div>
            )}
         </div>
         <input 
         type="file"
         ref={fileInputref}
         onChange={handleFile}
         className="hidden"
         accept="image/*"
         >
         </input>
        </div>
        <hr className="w-[520px] ml-4 border border-b-[0.33px] border-neutral-800 mb-0"></hr>
        <div onClick={()=>setBioModal(true)} className="flex justify-between items-center p-4  border-[#333] cursor-pointer">
            <div className="flex flex-col gap-1">
                <h2 className="text-white font-bold text-[14px]">Біографія</h2>
                <p className={`text-[15px] ${bio ? 'text-white' : 'text-white/70'}`}>{bio || "+ Написати біографію"}</p>
            </div>
        </div>
         <hr className="w-[590px] ml-4 border border-b-[0.33px] border-neutral-800 mb-0 "></hr>
        <div className="flex justify-between items-center p-4 border-[#333]">
            <div className="flex flex-col gap-1">
                <h2 className="text-white font-bold text-[14px]">Зацікавлення</h2>
                <p className="text-white text-[15px]">Додати зацікавлення</p>
            </div>
        </div>
        <hr className="w-[595px] ml-4 border border-b-[0.33px] border-neutral-800 mb-0 "></hr>
          <div className="flex justify-between items-center p-4 border-[#333]">
            <div className="flex flex-col gap-1">
                <h2 className="text-white font-bold text-[14px]">Посилання</h2>
            </div>
        </div>
        <hr className="w-[595px] ml-4 border border-b-[0.33px] border-neutral-800 mb-0 "></hr>
        <div className="flex justify-between items-center p-4  border-[#333]">
            <div className="flex flex-col gap-1">
                <h2 className="text-white font-bold text-[14px]">Подкаст</h2>
                <p className="text-white text-[15px]">+ Посилання на подкаст</p>
            </div>
        </div>
         <hr className="w-[595px] ml-4 border border-b-[0.33px] border-neutral-800 mb-0"></hr>
        <div className="flex justify-between items-center p-4  border-[#333]">
            <div className="flex flex-col gap-1">
                <h2 className="text-white font-bold text-[14px]">Показувати значок Інстаграм</h2>
            </div>
            <button onClick={()=>setShowInstagram(!showInstagram)} className={`relative w-[50px] h-[30px] rounded-full transition-colors duration-200 ease-in-out border ${showInstagram ? 'bg-white border-white':'bg-[#3B3B3B] border-[#3a3a3a]'}`}>
                <div className={`absolute top-[3px] left-[2xp] w-6 h-6 rounded-full shadow-md transform transition-transform duration-200 ${showInstagram ? 'translate-x-[22px] bg-black':'translate-x-0.5 bg-black'}`}></div>
            </button>
        </div>
         <hr className="w-[595px] ml-4 border border-b-[0.33px] border-neutral-800 mb-0 "></hr>
         <div className="flex justify-between items-center p-4 border-b border-[#333]">
            <div className="flex flex-col gap-1">
                <h2 className="text-white font-bold text-[14px]">Конфіденційність профілю</h2>
                <p className="text-white text-[12px]">If you switch to public,anyone can see ypur threads and replies</p>
            </div>
        </div>
        <div className="px-6 pb-6 pt-8 mt-auto ">
            <button onClick={handleSave} disabled={loading} className="w-full bg-white text-black fond-medium rounded-xl py-4 ">
                {loading ? 'Збереження' :'Готово'}
            </button>
        </div>
        {isAvatarMenuOpen && (
            <AvatarMenu 
             onUpload={handleUploadFile} 
             onRemove={handleDeleteAvatar}
             onClose={()=>setIsAvatarMenuOpen(false)}
             hasAvatar={!!preview}>
             </AvatarMenu>
        )}
      </div>
    </div>
    
    )
}

export default EditProfilModal;