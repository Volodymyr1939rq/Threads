import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { postDto } from './Dto/PostDto';
import { FileUploadService } from 'src/file-upload/file-upload.service';
import { paginationDto } from './Dto/paginationDto';
import { title } from 'process';

@Injectable()
export class PostService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly fileuploadService: FileUploadService
    ) { }

    async createPost(dto: postDto, userId: string, file?: Express.Multer.File) {
        let imagePath: string | null = null;
        if (file) {
            const uploadImage = await this.fileuploadService.uploadFile(file, "posts");
            imagePath = uploadImage.publicUrl;
        }
        try {
            const { autorId, ...postData } = dto as any;
            return await this.databaseService.post.create({
                data: {
                    ...postData,
                    autorId: userId,
                    image: imagePath
                }
            });
        } catch (error) {
            throw error;
        }
    }

    async getAllPosts(query: paginationDto, currentUserId: string) {
        try {
            const page = query.page || 1;
            const limit = query.limit || 10;
            const skip = (page - 1) * limit;

            const searchTerm = query.search;
            const whereConditional: any = {};

            if (searchTerm) {
                whereConditional.OR = [
                    { title: { contains: searchTerm, mode: 'insensitive' } },
                    { description: { contains: searchTerm, mode: 'insensitive' } }
                ];
            }

            const [posts, total] = await Promise.all([
                this.databaseService.post.findMany({
                    skip: skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                    where: whereConditional,
                    include: {
                        autor: { select: { id: true, name: true, avatarPath: true } },
                        _count: { select: { reactions: { where: { isLiked: true } }, comments: true } },
                        reactions: {
                            where: {
                                userId: currentUserId,
                                isLiked: true
                            },
                            select: { id: true }
                        }
                    }
                }),
                this.databaseService.post.count({ where: whereConditional })
            ]);
            const followedIds = new Set<string>()
            if (currentUserId) {
                const follows = await this.databaseService.follows.findMany({
                    where: { followerId: currentUserId },
                    select: { followingId: true }
                })
                follows.forEach(f => followedIds.add(f.followingId))
            }
            const postWithStatus = posts.map(post => {
                return {
                    ...post,
                    isLiked: post.reactions.length > 0,
                    reactions: undefined,
                    isFollowing: followedIds.has(post.autor.id)
                }
            })

            return {
                data: postWithStatus,
                meta: {
                    total,
                    page,
                    lastPage: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error(error)
            throw new NotFoundException('Internal server error');
        }
    }


    async getPostById(id: string, userId: string) {
    const [post, postStats] = await Promise.all([
        this.databaseService.post.findUnique({
            where: { id },
            include: {
                autor: { select: { id: true, name: true, email: true, avatarPath: true, } },
                reactions: {
                    where: { userId: userId, isLiked: true },
                    select: { id: true }
                },
                _count: {
                    select: { reactions: true, comments: true }
                },
                comments: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        autor: { select: { id: true, name: true, avatarPath: true } },
                        reactions: { where: { userId: userId, isLiked: true }, select: { id: true } },
                        _count: { select: { reactions: true, children: true } },
                    }
                }
            }
        }),
        this.databaseService.reactions.groupBy({
            by: ["isLiked"],
            where: { postId: id },
            _count: { isLiked: true }
        })
    ]);

    if (!post) {
        throw new NotFoundException(`Post with id ${id} not found`);
    }

    let followedIds = new Set<string>();
    if (userId) {
        const follows = await this.databaseService.follows.findMany({
            where: { followerId: userId },
            select: { followingId: true }
        });
        follows.forEach(f => followedIds.add(f.followingId));
    }

    const isFollowingMainAuthor = followedIds.has(post.autor.id);

    const likedPost = postStats.find((s) => s.isLiked === true)?._count.isLiked || 0;
    const dislikePost = postStats.find((s) => s.isLiked === false)?._count.isLiked || 0;
    const mainPostCommentsCount = post._count?.comments || 0;

    const processedComments = post.comments.map(comment => {
        const repliesCount = comment._count?.children || 0;
        const isFollowingCommentAuthor = followedIds.has(comment.autor.id); 

        return {
            ...comment,
            parentId: comment.parentId,
            isLiked: comment.reactions.length > 0,
            reactions: undefined,
            repliesCount: repliesCount,
            isFollowing: isFollowingCommentAuthor, 
            autor: {
                ...comment.autor,
                isFollowing: isFollowingCommentAuthor 
            },
            stats: {
                likes: comment._count?.reactions || 0,
                dislike: 0,
                comments: repliesCount
            },
            _count: comment._count,
            children: [] as any[]
        };
    });

    const commentTree = this.buildCommentTree(processedComments);

    return {
        ...post,
        isLiked: post.reactions.length > 0,
        isFollowing: isFollowingMainAuthor, 
        autor: {
            ...post.autor,
            isFollowing: isFollowingMainAuthor
        },
        reactions: undefined,
        repliesCount: mainPostCommentsCount,
        stats: {
            likes: likedPost,
            dislike: dislikePost,
            comments: mainPostCommentsCount
        },
        comments: commentTree,
    };
}
    private buildCommentTree(comments: any[]) {
        const commentMap = {};
        const rootComments: any[] = [];
       
        comments.forEach((comment) => {
            commentMap[comment.id] = comment;
        });

        comments.forEach((comment) => {
            if (comment.parentId) {
               
                const parent = commentMap[comment.parentId];
                if (parent) {
                    parent.children.push(comment);
                } else {
                  
                    console.warn(`Orphan comment found: ${comment.id}`);
                }
            } else {
              
                rootComments.push(comment);
            }
        });

        return rootComments;
    }

    async deletePost(id: string, userId: string) {
        const post = await this.databaseService.post.findUnique({ where: { id } });

        if (!post) throw new NotFoundException("Post not found");
        if (userId !== post.autorId) throw new ForbiddenException("You are not the author of this post");

        await this.databaseService.post.delete({ where: { id } });

        return {
            statusCode: 200,
            message: "Post has been deleted successfully",
            deletedId: id
        };
    }

    async showAllPostsMySubscribers(currentUserId: string, query: paginationDto) {
        try {
            const page = query.page || 1;
            const limit = query.limit || 10;
            const skip = (page - 1) * limit;

            const follows = await this.databaseService.follows.findMany({
                where: {
                    followerId: currentUserId
                },
                select: {
                    followingId: true
                }
            })
            const autorIds = follows.map(f => f.followingId)
            autorIds.push(currentUserId)

            const whereConditional = {
                autorId: {
                    in: autorIds
                }
            }
            const [posts, total] = await Promise.all([
                this.databaseService.post.findMany({
                    skip: skip,
                    take: limit,
                    where: whereConditional,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        autor: {
                            select: { id: true, name: true, avatarPath: true }
                        },
                        _count: {
                            select: { reactions: { where: { isLiked: true } }, comments: true }
                        },
                        reactions: {
                            where: {
                                userId: currentUserId,
                                isLiked: true
                            },
                            select: { id: true }
                        }
                    }
                }),
                this.databaseService.post.count({ where: whereConditional })
            ]);
            const followedIdsSet = new Set(follows.map(f => f.followingId))
            const reactionsWithLikeStatus = posts.map(post => {
                return {
                    ...post,
                    isLiked: post.reactions.length > 0,
                    isFollowing: followedIdsSet.has(post.autor.id)
                }
            })

            return {
                data: reactionsWithLikeStatus,
                meta: {
                    total,
                    page,
                    lastPage: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error(error)
            throw new NotFoundException("Feed fetch  failed");
        }
    }

    async update(postId: string, dto: postDto, userId: string) {
        const post = await this.databaseService.post.findUnique({ where: { id: postId } });

        if (!post) throw new NotFoundException(`This post with id ${postId} not found`);
        if (post.autorId !== userId) throw new ForbiddenException("You are not allowed to edit this post");

        return await this.databaseService.post.update({
            where: { id: postId },
            data: dto,
        });
    }

    async reaction(userId: string, postId: string, isLiked: boolean) {

        const findUser = await this.databaseService.user.findUnique({ where: { id: userId } });
        if (!findUser) throw new NotFoundException("User not found");

        const findPost = await this.databaseService.post.findUnique({ where: { id: postId } });
        if (!findPost) throw new NotFoundException(`Post with id:${postId} not found`);


        const existingReaction = await this.databaseService.reactions.findUnique({
            where: {
                userId_postId: {
                    userId: userId,
                    postId: postId
                }
            }
        });

        if (existingReaction) {
            await this.databaseService.reactions.delete({
                where: { id: existingReaction.id }
            });

            await this.databaseService.notifications.deleteMany({
                where: {
                    type: 'LIKES',
                    creatorId: userId,
                    postId: postId
                }
            });

            return { message: 'reaction removed', status: 'deleted' };
        }

        else {
            const isOwner = findPost.autorId === userId;
            if (!isOwner) {
                await this.databaseService.$transaction([

                    this.databaseService.reactions.create({
                        data: {
                            userId,
                            postId,
                            isLiked: true
                        }
                    }),

                    this.databaseService.notifications.create({
                        data: {
                            type: 'LIKES',
                            userId: findPost.autorId,
                            creatorId: userId,
                            postId: postId
                        }
                    })
                ]);
            } else {

                await this.databaseService.reactions.create({
                    data: { userId, postId, isLiked: true }
                });
            }

            return { message: 'reaction created', status: 'created' };
        }
    }

    async getAllAutorsPosts(targetUserId: string, currentUserId: string) {
        try {
            const posts = await this.databaseService.post.findMany({
                where: { autorId: targetUserId },
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    autor: {
                        select: { id: true, name: true, email: true, avatarPath: true }
                    },
                    originalPost:{
                        include:{
                            autor:{
                                select:{id:true,name:true,avatarPath:true},
                            },
                            _count:{select:{reactions:true,comments:true,reposts:true}
                        },
                        reactions:{where:{userId:currentUserId,isLiked:true},select:{id:true}},
                        reposts:{where:{autorId:currentUserId},select:{id:true}}
                    }
                    },
                    _count:{select:{reactions:true,comments:true,reposts:true}},
                    reactions: {
                        where: { userId: currentUserId, isLiked: true },
                        select: { id: true }
                    }

                }
            })
            let isFollowingAutor = false;
            if (currentUserId && currentUserId !== targetUserId) {
                const follow = await this.databaseService.follows.findFirst({
                    where: { followerId: currentUserId, followingId: targetUserId }
                })
                isFollowingAutor = !!follow
            }
            return posts.map(post => {
                const isRepost=!!post.originalPost
                const contentPost=(post.originalPost || post) as any;

                return {
                    post:post.id,
                    createdAt:post.createdAt,
                    title:contentPost?.title,
                    image:contentPost?.image,
                    autor:{
                        ...post.autor,
                        isFollowing:isFollowingAutor
                    },
                    originalPost:isRepost ? {
                        id:contentPost?.id,
                        title:contentPost?.title,
                        image:contentPost?.image,
                        createdAt:contentPost?.createdAt,
                        autor:contentPost?.autor,
                        stats:{
                            likes:contentPost?._count.reactions,
                            comments:contentPost?._count.comments,
                            reposts:contentPost?._count.reposts
                        },
                        isLiked:contentPost.reactions.length>0,
                        isRepost:contentPost?.reposts?.length>0
                    }:null,
                    isLiked:contentPost.reactions.length>0,
                    isReposted:contentPost.reposts.length>0,
                    stats:{
                        likes:contentPost._count.reactions,
                        comments:contentPost._count.comments,
                        reposts:contentPost._count.repost
                    },
                    reactions:undefined,
                    _count:undefined,
                }
            })
        } catch(error) {
            console.error(error)
            throw new NotFoundException('posts not found')
        }
    }

    async incrementViews(id: string) {
        try {
            return await this.databaseService.post.update({
                where: { id },
                data: { views: { increment: 1 } }
            })
        } catch {
            try {
                return await this.databaseService.comment.update({
                    where: { id },
                    data: { views: { increment: 1 } }
                })
            } catch (e) {
                return null;
            }
        }
    }
    async getActivity(id: string, currentUserId: string) {
        const post = await this.databaseService.post.findUnique({
            where: { id },
            include: {
                reactions: {
                    include: { user: true },
                    orderBy: { createdAt: 'desc' }
                },
                _count: { select: { reactions: true } }
            }
        })
        if (post) {
            const userIdToCheck = post.reactions.map(r => r.userId)
            const myFollow = await this.databaseService.follows.findMany({
                where: {
                    followerId: currentUserId,
                    followingId: { in: userIdToCheck }
                },
                select: { followingId: true }
            });
            const followingSet = new Set(myFollow.map(f => f.followingId))
            return {
                stats: {
                    views: post.views,
                    likes: post._count.reactions,
                    reposts: 0
                },
                users: post.reactions.map(r => ({
                    user: {
                        ...r.user,
                        isFollowing: followingSet.has(r.userId)
                    },
                    type: 'like',
                    createdAt: r.createdAt
                }))
            }
        }
        const comment = await this.databaseService.comment.findUnique({
            where: { id },
            include: {
                reactions: {
                    include: { user: true },
                    orderBy: { createdAt: 'desc' }
                },
                _count: { select: { reactions: true } }
            }
        })
        if (comment) {
            const userIdToCheck = comment.reactions.map(r => r.userId)
            const myComments = await this.databaseService.follows.findMany({
                where: {
                    followerId: currentUserId,
                    followingId: { in: userIdToCheck }
                },
                select: { followingId: true }
            })
            const CommentSet = new Set(myComments.map(c => c.followingId))
            return {
                stats: {
                    views: comment.views,
                    likes: comment._count.reactions,
                    reposts: 0
                },
                users: comment.reactions.map(r => ({
                    user: {
                        ...r.user,
                        isFollowing: CommentSet.has(r.userId)
                    },
                    type: 'like',
                    createdAt: r.createdAt
                }))
            }
        }
        return null;
    }

    async toggleReposts(userId:string,postId:string){
        const existRepost=await this.databaseService.post.findFirst({
            where:{
                autorId:userId,
                originalPostId:postId
            }
        })
        if(existRepost){
            await this.databaseService.post.delete({
                where:{
                  id:existRepost.id
                }
            })
            return {existRepost:false}
        }else{
            await this.databaseService.post.create({
                data:{
                    title:null,
                    image:null,
                    autorId:userId,
                    originalPostId:postId
                }
            })
            return {existRepost:true}
        }
    }
}