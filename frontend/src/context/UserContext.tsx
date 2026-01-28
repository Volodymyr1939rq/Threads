
import Cookies from 'js-cookie';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
const API_URL='http://localhost:3000'

interface User {
    id:string;
    name:string;
    avatar:string | null;
    bio?:string;
    _count?:{
        followedBy:number,
        following:number
    }
}

interface UserContextType {
    user:User | null;
    refreshUser:()=>void;
}

const UserContext=createContext<UserContextType | undefined>(undefined)

export const UserProvider=({children}:{children:ReactNode})=>{
    const [user,setUser]=useState<User | null>(null)

    const fetchUser= async ()=>{
        const token=Cookies.get('token')
        if(!token) return 
         try {
             const res=await fetch(`${API_URL}/user/userprofile?t=${Date.now()}`,{
                method:"GET",
                headers:{'Authorization':`Bearer ${token}`}
             })
             if(res.ok){
                const data=await res.json()
                setUser({
                    ...data,
                    avatar:data.avatarPath ? `${data.avatarPath}?t=${new Date().getTime()}` :
                    null
                })
             }
         } catch (error) {
            console.error('Помилка при завантаженні користувача',error)
         }
    }
    useEffect(()=>{
        fetchUser()
    },[])

    return (
        <UserContext.Provider value={{user,refreshUser:fetchUser}}>
             {children}
        </UserContext.Provider>
    )
}

export const useCurrentUser=()=>{
    const context=useContext(UserContext)
    if(!context){
        throw new Error("useCurrentUser must be used within a UserProvider")
    }
    return context
}