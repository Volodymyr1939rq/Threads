export const getShortTime=(dateStr:string)=>{
    try {
        const date=new Date(dateStr)
        const now=new Date()
        const diffInSecconds=Math.floor((now.getTime()-date.getTime())/1000)
        if(diffInSecconds<60) return 'щойно'
        const minutes=Math.floor(diffInSecconds/60)
        if(minutes<60) return `${minutes} хв`

        const hours=Math.floor(minutes/60)
        if(hours<24) return `${hours} год`
        
        const days=Math.floor(hours/24) 
        return `${days} дн`
    } catch (e) {
        return ''
    }
   }