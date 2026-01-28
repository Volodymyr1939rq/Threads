import { Body, Controller, Delete, Get, NotFoundException, Param, Post, Req, Request, UseGuards } from '@nestjs/common';
import { CommentService } from './comment.service';
import { commentDto } from './Dto/commentDto';
import { AuthGuard } from '@nestjs/passport';
import { reactionCommentDto } from './Dto/ReactionCommnetDto';
import { PostService } from 'src/post/post.service';
import { OptionalJwtAuthGuard } from 'src/auth/optional-jwt-auth.guard';

@Controller('comment')
export class CommentController {
  constructor(private readonly commentService: CommentService,
    private readonly postService:PostService
  ) {}

@UseGuards(AuthGuard('jwt'))
  @Post()
  async createComment(@Body() dto: commentDto, @Request() req) {
  
    const userId = req.user?.userId || req.user?.id;
   

    if (!userId) {
        throw new Error("User ID missing");
    }

    try {
        const result = await this.commentService.createComment(dto, userId);
        return result;
    } catch (e) {
        throw e;
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  delete(@Param('id') commentId:string,@Request() req){
    const userId=req.user.userId
    return this.commentService.deleteComment(commentId,userId)
  }

  @UseGuards(AuthGuard('jwt'))
  @Post(':id/reaction')
  likeCommnet(@Param("id") commentId:string,@Body() dto:reactionCommentDto, @Request() req){
    const userId=req.user.userId
    return this.commentService.commentReactions(userId,dto.isLiked,commentId)
  }
  
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  getAllComents(@Param("id") postId:string,@Req() req){
    const userId=req.user?.userId
   return this.commentService.getCommentById(postId,userId)
  }
  @UseGuards(OptionalJwtAuthGuard)
  @Get('post/:id')
  async getPostPage(@Param('id') id:string,@Req() req ){
    const userId = req.user?.userId
    const post = await this.postService.getPostById(id, userId); 
  
  if (post) {
      return { ...post, type: 'post' };
  }

  const commentAsPost = await this.commentService.getCommentWithContext(id, userId);

  if (!commentAsPost) {
      throw new NotFoundException('Post or Comment not found');
  }

  return { ...commentAsPost, type: 'comment_as_main' };
  }
}
