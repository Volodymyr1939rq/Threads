import { ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { commentDto } from './Dto/commentDto';
import { count } from 'console';
@Injectable()
export class CommentService {
    constructor(private readonly databaseService:DatabaseService){}

    async createComment(dto:commentDto,userId:string){
      
      const post = await this.databaseService.post.findUnique({
        where:{
            id:dto.postId
        }
      })
      if(!post){
      
        throw new NotFoundException("Post not found")
      }
     
      if(dto.parentId){
        const parent=await this.databaseService.comment.findUnique({
          where:{
            id:dto.parentId
          }
        })
        if(!parent){
          throw new NotFoundException('parent comment not found')
        }
      }
      return this.databaseService.comment.create({
        data:{
            content:dto.content,
            post:{
             connect:{id:dto.postId}
            },
            autor:{
              connect:{id:userId}
            },
            parent:dto.parentId ? {connect:{id:dto.parentId}}:undefined
        },
        include:{
          autor:true
        }
      })
    }

    async deleteComment(commentId:string,userId:string){
     
      const comment=await this.databaseService.comment.findUnique({
        where:{
          id:commentId
        },
        include:{post:true}
      })
      if(!comment){
        throw new NotFoundException("Comment not found")
      }
      const isAutor=comment.autorId===userId
      const isPostOwner=comment.post.autorId===userId
      if(!isAutor && !isPostOwner){
        throw new ForbiddenException("You are not allowed to delete this comment")
      }
      await this.databaseService.comment.delete({
        where:{
          id:commentId
        }
      })
      return {message:'commnet deleted'};
    }

    async commentReactions(userId:string,isLiked:boolean,commentId:string){
      const findCommnet=await this.databaseService.comment.findUnique({
        where:{
          id:commentId
        }
      })
      if(!findCommnet){
        throw new NotFoundException("Commnet not found")
      }
      const findReaction=await this.databaseService.reactions.findUnique({
        where:{
          userId_commentId:{
            userId:userId,
            commentId:commentId
          }
        }
      })
      if(findReaction){
        if(findReaction.isLiked===isLiked){
          await this.databaseService.reactions.delete({
            where:{
              id:findReaction.id
            }
          })
          return `reaction deleted`
        }
         await this.databaseService.reactions.update({
        where:{
          id:findReaction.id
        },
        data:{isLiked}
      })
      return `reaction updated`
      }
     
      await this.databaseService.reactions.create({
        data:{
          userId,
          commentId,
          isLiked
        }
      })
      return `reaction created`
    }

    async getCommentById(postId:string,userId?:string){
      const post=await this.databaseService.post.findUnique({
        where:{
          id:postId
        }
      })
      if(!post){
        throw new NotFoundException("Post not found")
      }
      const flatCommnets=await this.databaseService.comment.findMany({
        where:{
          postId:postId
        },
        orderBy:{
          createdAt:"desc"
        },
        include:{
          autor:{
            select:{id:true,name:true,avatarPath:true,followedBy:userId ?{
              where:{
                followerId:userId
              },
              select:{
                followerId:true
              }
            }:false
          }
          },
          _count:{select:{reactions:{where:{isLiked:true}},
        children:true}
        },
        reactions:userId ? {
          where:{userId:userId},
          select:{userId:true}
        }:false
        }
      })
      const tree= this.buildCommentTree(flatCommnets)
      const transformedTree=tree.map(comment=>this.transformTreeItem(comment))
      return transformedTree
    }
    private transformTreeItem(item:any):any {
      const isLiked=item.reactions && item.reactions.length>0
      const isFollowing=!!(item.autor?.followedBy && item.autor.followedBy.length>0)

     const autor = item.autor ? {
    id: item.autor.id,
    name: item.autor.name,
    avatarPath: item.autor.avatarPath,
    isFollowing: isFollowing 
  } : null;

      const newItem={
        ...item,
        autor:autor,
        isFollowing:isFollowing,
        isLiked:isLiked,
        likesCount:item._count?.reactions || 0,
        repliesCount:item._count?.children || 0,
        stats: {
        likes: item._count?.reactions || 0,
        comments: item._count?.children || 0,
        dislike: 0
     },
        reactions:undefined,
        _count:undefined
      }
      if (newItem.children && newItem.children.length > 0) {
      newItem.children = newItem.children.map(child => this.transformTreeItem(child));
    }
    return newItem;
    }

    private buildCommentTree(comments:any[]){
      const commentMap={}
      const rootComments:any[]=[]

      comments.forEach((comment)=>{
        comment.children=[] as any[]
        commentMap[comment.id]=comment
      })
      comments.forEach((comment) => {
    if (comment.parentId) {

      const parent = commentMap[comment.parentId];
      if (parent) {
        parent.children.push(comment);
      }
    } else {
      
      rootComments.push(comment);
    }
  });
      return rootComments
    }


  async getCommentWithContext(commentId: string, userId?: string) {
  const authorSelect = { 
    id: true, 
    name: true, 
    avatarPath: true,
    
    followedBy: userId ? { where: { followerId: userId } } : false 
  };

  const comment = await this.databaseService.comment.findUnique({
    where: { id: commentId },
    include: {
      autor: { select: authorSelect },
      _count: { select: { reactions: true, children: true } },
      reactions: userId ? { where: { userId } } : undefined,
      post: {
        include: {
          autor: { select: authorSelect },
          _count: { select: { reactions: true, comments: true } },
          reactions: userId ? { where: { userId } } : undefined,
        }
      },
      children: {
        orderBy: { createdAt: 'desc' },
        include: {
          autor: { 
            select: { 
              id: true, 
              name: true, 
              avatarPath: true,
              
              followedBy: userId ? { where: { followerId: userId },
            select:{followerId:true}} : false 
            } 
          },
          _count: { select: { reactions: true, children: true } },
          reactions: userId ? { where: { userId } } : undefined,
        }
      },
      parent: { 
        include: { 
          autor: { select: authorSelect },
          parent: { include: { autor: { select: authorSelect } } } 
        } 
      }
    }
  });

  if (!comment) return null;

  return this.transformCommentData(comment, userId);
}

private transformCommentData(item: any, currentUserId?: string) {
  if (!item) return null;

  let isFollowing = false;
  if (item.autor?.followedBy && Array.isArray(item.autor.followedBy)) {
    isFollowing = item.autor.followedBy.length > 0;
  }

  const autor = item.autor ? {
    id: item.autor.id,
    name: item.autor.name,
    avatarPath: item.autor.avatarPath,
    isFollowing: isFollowing
  } : null;

  const commentsCount = item._count?.comments ?? item._count?.children ?? 0;

  const newItem = {
    ...item,
    autor: autor,
    isFollowing: isFollowing,
    isLiked: item.reactions && item.reactions.length > 0,
    likesCount: item._count?.reactions || 0,
    repliesCount: commentsCount,
    parentId: item.parentId || null,
    stats: {
      likes: item._count?.reactions || 0,
      comments: commentsCount, 
      dislike: 0
    },
    reactions: undefined,
    _count: undefined
  };

  if (newItem.parent) {
    newItem.parent = this.transformCommentData(newItem.parent, currentUserId);
  }
  if (newItem.children && Array.isArray(newItem.children)) {
    newItem.children = newItem.children.map((child: any) => {
        const transformedChild = this.transformCommentData(child, currentUserId);
        return { ...transformedChild, parentId: newItem.id };
    });
  }
  if (newItem.post) {
    newItem.post = this.transformCommentData(newItem.post, currentUserId);
  }

  return newItem;
}
}

