import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, Req, Request, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { PostService } from './post.service';
import { postDto } from './Dto/PostDto';
import {reactionDto} from './Dto/reactionDto'
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { paginationDto } from './Dto/paginationDto';
import { CommentService } from 'src/comment/comment.service';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService,
    private readonly commentService:CommentService
  ) {}
  
  @UseGuards(AuthGuard('jwt'))
  @Get()
  getAllPosts(@Query() query:paginationDto, @Request()req){
    const userId=req.user.userId
    return this.postService.getAllPosts(query,userId)
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  CreatePost(@Body() dto:postDto,@Request() req,@UploadedFile() file:Express.Multer.File ){
    const userId=req.user.userId
    return this.postService.createPost(dto,userId,file)
  }
  
  @UseGuards(AuthGuard('jwt'))
  @Delete(":id")
  delete(@Param("id") id:string,@Request() req){
    const currentUserId=req.user.userId
    return this.postService.deletePost(id,currentUserId)
  }
  @UseGuards(AuthGuard('jwt'))
  @Get("followers-feed")
  getAllPostsOfFollowers(@Request() req,@Query() query:paginationDto){
    const userId=req.user.userId
    return this.postService.showAllPostsMySubscribers(userId,query)
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my-posts')
  getAllmyPosts(@Request() req){
     const userId=req.user.userId
     return this.postService.getAllAutorsPosts(userId,userId)
  }
  @UseGuards(AuthGuard('jwt'))
  @Patch(":id")
  updatePost(@Param("id") postId:string ,@Body() dto:postDto,@Request() req){
    const userId=req.user.userId
    return this.postService.update(postId,dto,userId)
  }
  
  @UseGuards(AuthGuard('jwt'))
  @Post(":id/reaction")
  reaction(@Param('id')postId:string,@Body() dto:reactionDto,@Request() req){
    const userId=req.user.userId
    return this.postService.reaction(userId,postId,dto.isLiked)
  }
  // @UseGuards(AuthGuard('jwt'))
  // @Get(":id")
  // getPostsById(@Param("id") id:string,@Req() req){
  //   const userId=req.user.userId
  //   return this.postService.getPostById(id,userId)
  // }

  @UseGuards(AuthGuard('jwt'))
  @Get('user/:id')
  getAllAutorsPosts(@Param('id') id:string,@Req() req){
    const userId=req.user.userId
    return this.postService.getAllAutorsPosts(id,userId)
  }
  
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async getById(@Param('id') id: string,@Req() req) {
    const userId=req.user.userId
    try {
      const post = await this.postService.getPostById(id, userId);
       if (post) {
      return post;
    }
    } catch (e) {
      
    }
    const comment = await this.commentService.getCommentWithContext(id, userId);

    if (comment) {
      
      return { ...comment, type: 'comment' }; 
    }
    throw new NotFoundException('Post or Comment not found');
  }

 
  @Get(':id/view')
  async getView(@Param('id') id:string){
    return this.postService.incrementViews(id)
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/activity')
  async getActivity(@Param('id') id:string,@Req() req){
    const userId=req.user.userId
    return this.postService.getActivity(id,userId)
  }
  @UseGuards(AuthGuard('jwt'))
  @Post(':id/repost')
  async reposts(@Param('id') postId:string,@Req() req){
    const userId=req.user.userId
    return this.postService.toggleReposts(userId,postId)
  }
  
  @UseGuards(AuthGuard('jwt'))
  @Get(':id/reposts')
  async getUsersReposts(@Param('id') userId:string,@Req() req){
    const currentUserId=req.user.userId
    return this.postService.getUsersReposts(userId,currentUserId)
  }
}