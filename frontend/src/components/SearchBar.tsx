import { FaSearch } from "react-icons/fa"


const SearchBar =() =>{
    return (
        <div className="relative flex border boreder-[#FCFAFC] rounded-xl w-[70%] h-[30px]">
            <div className="absolute top-1.5 right-4">

            <FaSearch />
            </div>
        </div>
    )
}

export default SearchBar