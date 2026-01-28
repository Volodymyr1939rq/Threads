// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { UserProvider } from './context/UserContext.tsx'
import { ReplyModalProvider } from './context/ReplyModalContext.tsx'
import { PostProvider } from './context/PostContext.tsx'
import {QueryClient,QueryClientProvider} from '@tanstack/react-query'
const queryClient=new QueryClient()
createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <BrowserRouter>
          <QueryClientProvider client={queryClient}>
    <UserProvider>
        <PostProvider>
      <ReplyModalProvider>
     <App />
      </ReplyModalProvider>
        </PostProvider>
    </UserProvider>
          </QueryClientProvider>
    </BrowserRouter>
  // </StrictMode>,
)
