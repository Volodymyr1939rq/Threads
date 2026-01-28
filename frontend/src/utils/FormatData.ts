export const formatCount=(count:number | string | undefined):string=>{
    if(!count) return '0'

    const num=typeof count==='string' ? parseInt(count):count

    if(isNaN(num)) return '0'

    if(num>1000000){
        return (num/1000000).toFixed(1).replace(/\.0$/,'') + 'M'
    }
    if(num>1000){
        return (num/1000).toFixed(1).replace(/\.0$/,'') + 'K'
    }
    return num.toString()
}