import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { userDto } from 'src/user/dto/UserDto';
import * as bcrypt from 'bcrypt';
import { Usersearchdto } from './dto/UserSearchDto';
import { StorageService } from 'storage.service';


@Injectable()
export class UserService {
     constructor(private readonly databaseService:DatabaseService,
        private readonly storageService:StorageService
     ){}

     async updateUserProfile(userId:string,dto:{name?:string,bio?:string}){
        if(dto.name){
            const existUser=await this.databaseService.user.findUnique({
                where:{name:dto.name}
            })
            if(existUser && existUser.id !== userId){
                throw new ConflictException('Це імя вже зайняте')
            }
        }
        return await this.databaseService.user.update({
            where:{id:userId},
            data:dto,
            select:{id:true,name:true,bio:true,avatarPath:true}
        })
     }
     async uploadAvatar(userId:string,file:Express.Multer.File){
        let cloudFlareImageUrl:string | null=null
        if(file){
            const uploadedUrl=await this.storageService.uploadFile([file])
            if(uploadedUrl && uploadedUrl.length>0){
                cloudFlareImageUrl=uploadedUrl[0]
            }
        }
        

        const user = await this.databaseService.user.update({
            where:{id:userId},
            data:{avatarPath:cloudFlareImageUrl}
        })
        const {password,hashedRefreshTokens,...result}=user
        return result;
     }
     async createUser(dto:userDto){
         
            const isExistUser = await this.databaseService.user.findUnique({
                where: {
                    email: dto.email
                }
            })
            if(isExistUser){
                throw new ConflictException("User already exist")
            }

            const hashedPassword = await bcrypt.hash(dto.password, 10)

           

            const user= await this.databaseService.user.create({
                data: {
                    ...dto,
                    password: hashedPassword
                }
            }) 
            const {password,...result}=user
            return result;
     } 

     async getUserByEmail(email:string){
        return await this.databaseService.user.findUnique({
            where:{
                email:email
            }
        })
     }

    async getUserById(id:string,currentUserId?:string){
        const user= await this.databaseService.user.findUnique({
            where: {
                id:id
            },
            select:{
                id:true,
                name:true,
                email:true,
                avatarPath:true,
                bio:true,
                _count:{
                    select:{
                        followedBy:true,
                        following:true
                    }
                }
            }
        })
        if(!user){
            throw new NotFoundException('user not found')
        }
        let isFollowing=false
        if(currentUserId){
            const follow=await this.databaseService.follows.findFirst({
                where:{
                    followerId:currentUserId,
                    followingId:id
                }
            })
            isFollowing=Boolean(follow)
        }
        return {
            ...user,
            isFollowing
        }
    }

    async getAllUsers(dto:Usersearchdto,currentUserId:string,){
            try {
                const {page=1,limit=10,search,startDate,endDate}=dto
                const skip=(page-1)*limit
                const whereCondition:any={}
                    

                if(search){
                    whereCondition.OR=[
                        
                       {name:{contains:search,mode:'insensitive'}}, 
                       {email:{contains:search,mode:'insensitive'}} 
                    ];
                }else{
                    whereCondition.id={not:currentUserId}
                }

                if(startDate|| endDate){
                    whereCondition.createdAt={}
                    if(startDate) {
                        whereCondition.createdAt.gte=new Date(startDate)
                    }
                        if(endDate){
                         whereCondition.createdAt.lte=new Date(endDate)
                        } 
                }
                    const [users,totals]=await Promise.all([
                        this.databaseService.user.findMany({
                            skip:skip,
                            take:limit,
                            where:whereCondition,
                            orderBy:{
                                followedBy:{
                                    _count:'desc'
                                }
                            },
                            select:{
                                id:true,
                                name:true,
                                avatarPath:true,
                                bio:true,
                                _count:{
                            select:{followedBy:true}
                        },
                        followedBy:{
                            where:{followerId:currentUserId},
                            select:{followerId:true}
                        }
                            }
                        }),
                        this.databaseService.user.count({where:whereCondition})
                    ])
                    const formattedUsers=users.map(user=>({
                        id:user.id,
                        name:user.name,
                        avatarPath:user.avatarPath,
                        bio:user.bio,
                        _count:user._count,
                        isFollowing:user.followedBy.length>0
                       
                    }))
                    return {
                        data:formattedUsers,
                        meta:{
                            totals,
                            page:Number(page),
                        lastPage:Math.ceil(totals/limit)

                        }
                    }
                
            } catch (error) {
                console.error(error)
                throw new NotFoundException('Internal server error')
            }
        }

        async follow(currentUserId:string,targetUserId:string){

            if(currentUserId===targetUserId){
                throw new ConflictException("you cant subscibe yourself")
            }

            const targetUser=await this.databaseService.user.findUnique({
                where:{
                    id:targetUserId
                }
            })
            if(!targetUser){
                throw new NotFoundException("user not found")
            }
             const currentUser=await this.databaseService.user.findUnique({
                where:{
                    id:currentUserId
                }
            })
            if(!currentUser){
                throw new NotFoundException("user not found")
            }
            const findFollow=await this.databaseService.follows.findUnique({
               where: {
            followerId_followingId: {
                followerId: currentUserId, 
                followingId: targetUserId  
            }
        }
            })
            if(findFollow){
                await this.databaseService.follows.delete({
               where: {
            followerId_followingId: {
                followerId: currentUserId, 
                followingId: targetUserId  
            }
        }
            })
            return `unfollowed`
            }
            
            try {
                 await this.databaseService.$transaction([
                    this.databaseService.follows.create({
                        data:{
                            followerId:currentUserId,
                            followingId:targetUserId
                        }  
                    }),
                    this.databaseService.notifications.create({
                        data:{
                            type:'FOLLOW',
                            userId:targetUserId,
                            creatorId:currentUserId
                        }
                    })

                 ])
                return `followed`
            } catch (error) {
                console.error('Помилка створення підписки',error)
                throw new InternalServerErrorException("Помилка при створенні підписки")
            }

        }

        async getNotifications(userId:string){
            return await this.databaseService.notifications.findMany({
                where:{
                    userId:userId
                },
                orderBy:{
                    createdAt:'desc'
                },
                include:{
                    creator:{
                        select:{
                            id:true,
                            name:true,
                            avatarPath:true,
                            followedBy:{
                                where:{followerId:userId},
                                select:{followerId:true}
                            }
                        }
                    },
                    post:{
                        select:{
                            id:true,
                            title:true,
                            image:true
                        }
                    },
                    comment:{
                        select:{
                            id:true,
                            content:true
                        }
                    }
                }
            })
        }

        async getAllFollowers(userId:string,currentUserId:string){
            try {
                const followers=await this.databaseService.follows.findMany({
                    where:{followingId:userId},
                    include:{follower:true}
                })
                const followersIds=followers.map(f=>f.follower.id)
                const myFollows=await this.databaseService.follows.findMany({
                    where:{followerId:currentUserId,
                        followingId:{in:followersIds}
                    },
                    select:{
                        followingId:true
                    }
                })
                const myFollowsSet=new Set(myFollows.map(f=>f.followingId))
                return followers.map((record)=>{
                    return {
                        id:record.follower.id,
                        name:record.follower.name,
                        avatarPath:record.follower.avatarPath,
                        isFollowing:myFollowsSet.has(record.follower.id)
    
                    }
                })
            } catch (error) {
                console.error(error)
                return []
            }
        }

        async getAllFollwing(userId:string,currentUserId:string){
            try {
                
                const following=await this.databaseService.follows.findMany({
                    where:{
                        followerId:userId
                    },
                    include:{
                        following:true
                    }
                })
                const followingIds=following.map(f=>f.following.id)

                const myFollows=await this.databaseService.follows.findMany({
                    where:{followerId:currentUserId,
                        followingId:{in:followingIds}
                    },
                    select:{followingId:true}
                })
                const FollowsSet=new Set(myFollows.map(f=>f.followingId))

                return following.map((record)=>{
                    return{
                        id:record.following.id,
                        name:record.following.name,
                        avatarPath:record.following.avatarPath,
                        isFollowing:FollowsSet.has(record.following.id)
                    }

            })
            } catch (error) {
                console.error(error)
                return []
            }
           
        }

        async deleteAvatar(userId:string){
            const user=await this.databaseService.user.findUnique({
                where:{id:userId}
            })
            if(!user){
                throw new NotFoundException('User not found')
            }
            if(user.avatarPath){
                await this.storageService.deleteFile(user.avatarPath)
            }
            const updatedUser=await this.databaseService.user.update({
               where:{id:userId},
               data:{
                avatarPath:null
               }
            });
            const {password,hashedRefreshTokens,...result}=updatedUser
        }
    }   

