import { Route, Routes} from "react-router-dom"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Profile from "./pages/ProfilePage"
import Header from "./components/Header"
import { useState } from "react"
import ThreadsModal from "./components/CreateThreadModal"
import Search from "./pages/Search"
import Activity from "./pages/Activity"
import ThreadPage from "./pages/ThreadPage"

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
      <Header onOpenCreate={()=>setIsDefaultModal(true)} onOpenFab={()=>setIsFabOpen(true)}></Header>
      <Routes>
        <Route path="/" element={<Home refresh={refreshTrigger}/>} />
        <Route path="/login" element={<Login/>}/>
        <Route path="/profile/:id" element={<Profile/>}></Route>
        <Route path="/search" element={<Search/>}></Route>
        <Route path="/activity" element={<Activity/>}></Route>
        <Route path="/post/:id" element={<ThreadPage/>}></Route>
      </Routes>
      {isDefaultModal  && (
        <ThreadsModal 
        variant={'default'}
        onClose={()=>setIsDefaultModal(false)} onPostCreated={()=>handleCreatedPost('default')}></ThreadsModal>
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
