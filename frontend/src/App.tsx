import { Route, Routes} from "react-router-dom"
import Header from "./components/Header"
import { lazy, Suspense, useState } from "react"
import ThreadsModal from "./components/CreateThreadModal"
import Loader from "./components/Loader"


const Home=lazy(()=>import("./pages/Home"))
const Login=lazy(()=>import("./pages/Login"))
const Profile=lazy(()=>import("./pages/ProfilePage"))
const Search=lazy(()=>import("./pages/Search"))
const Activity=lazy(()=>import("./pages/Activity"))
const ThreadPage=lazy(()=>import("./pages/ThreadPage"))
function App() {

const [isDefaultModal,setIsDefaultModal]=useState(false)
const [isFabOpen,setIsFabOpen]=useState(false)
const [refreshTrigger,setRefreshtrigger]=useState(0)




const handleCreatedPost=(source:'default' | 'fab')=>{
  if(source==='default') setIsDefaultModal(false)
  if(source==='fab') setIsFabOpen(false)
  setRefreshtrigger(prev=>prev+1)
}
  return (
    <div>
      <Header 
      onOpenCreate={()=>setIsDefaultModal(true)} 
      onOpenFab={()=>setIsFabOpen(true)}/>

      <Suspense fallback={
        <div className="flex items-center justify-center h-[calc(100vh-70px)] w-full bg-black">
          <Loader size={32} className="animate-spin text-white"/>
        </div>
      }
      >
      <Routes>
        <Route path="/" element={<Home refresh={refreshTrigger}/>} />
        <Route path="/login" element={<Login/>}/>
        <Route path="/profile/:id" element={<Profile/>}/>
        <Route path="/search" element={<Search/>}/>
        <Route path="/activity" element={<Activity/>}/>
        <Route path="/post/:id" element={<ThreadPage/>}/>
      </Routes>
      </Suspense>
      {isDefaultModal  && (
        <ThreadsModal 
        variant={'default'}
        onClose={()=>setIsDefaultModal(false)} 
        onPostCreated={()=>handleCreatedPost('default')}/>
      )}
      {isFabOpen && (
        <ThreadsModal 
            variant="fab"
            onClose={() => setIsFabOpen(false)} 
            onPostCreated={() => handleCreatedPost('fab')}
        />
      )}
      
    </div>

    
  )
}

export default App
