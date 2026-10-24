import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { DatabaseService } from 'src/database/database.service';
import { StorageService } from 'src/common/storage.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { v4 } from 'uuid';
jest.mock('uuid',()=>({
  v4:()=>'test-uuid-1234'
}))
describe('PostService', () => {
    let service:PostService
    let databaseService:DatabaseService
    let storageService:StorageService

    const mockDataBaseService={
      post:{
        create:jest.fn(),
        delete:jest.fn(),
        findUnique:jest.fn(),
        findMany:jest.fn(),
        count:jest.fn()
      },
      follows:{
        findMany:jest.fn()
      },
      user:{
        findUnique:jest.fn()
      },
      reactions:{
        findUnique:jest.fn(),
        create:jest.fn(),
        delete:jest.fn(),
      },
      notifications:{
        create:jest.fn(),
        deleteMany:jest.fn()
      },
      $transaction:jest.fn()
    }

    const mockStorageService={
      uploadFile:jest.fn()
    }

    beforeEach(async()=>{
      const module:TestingModule=await Test.createTestingModule({
        providers:[
          PostService,
          {
            provide:DatabaseService,
            useValue:mockDataBaseService
          },
          {
            provide:StorageService,
            useValue:mockStorageService
          }
        ]
      }).compile()
      service=module.get<PostService>(PostService)
      databaseService=module.get<DatabaseService>(DatabaseService)
      storageService=module.get<StorageService>(StorageService)

      jest.clearAllMocks()
    });
    it('defined',()=>{
      expect(service).toBeDefined()
    });

    describe('createPost',()=>{
      it("create post without picture",async()=>{
         const dto={title:'testing post',description:'description'}
         const userId='user-123'
         const expectedPost={id:'post-1',...dto,autorId:userId,image:null}

         mockDataBaseService.post.create.mockResolvedValue(expectedPost)

         const result=await service.createPost(dto as any,userId)
         expect(mockStorageService.uploadFile).not.toHaveBeenCalled()
         expect(mockDataBaseService.post.create).toHaveBeenCalledWith({
          data:{
            title:'testing post',
            description:'description',
            autorId:userId,
            image:null
          }
         })
         expect(result).toEqual(expectedPost)
      })
      it("Повинен завантажити картинку в R2 та створити пост із посиланням на фото",async ()=>{
        const dto={title:"Пост з фото"}
        const userId='user-123'
        const mockFile={originalname:'photo.png',buffer:Buffer.from('test')} as Express.Multer.File
        const r2Url='https://pub-r2.cloudflare.com/photo.png'

        mockStorageService.uploadFile.mockResolvedValue([r2Url])
        mockDataBaseService.post.create.mockResolvedValue({
          id:'post-2',
          ...dto,
          autorId:userId,
          image:r2Url
        })
        const result=await service.createPost(dto as any,userId,mockFile)
        expect(mockStorageService.uploadFile).toHaveBeenCalledWith([mockFile])
        expect(mockDataBaseService.post.create).toHaveBeenCalledWith({
          data:{
            title:'Пост з фото',
            autorId:userId,
            image:r2Url
          }
        })
        expect(result.image).toBe(r2Url)
      })
    })
    describe('delete post',()=>{
       it("if user is autor,succesfully delete post",async()=>{
        const postId='post-1'
        const userId='user-123'

        mockDataBaseService.post.findUnique.mockResolvedValue({
          id:postId,
          autorId:userId
        })
        mockDataBaseService.post.delete.mockResolvedValue({
          id:postId
        })
        const result=await service.deletePost(postId,userId)

        expect(mockDataBaseService.post.delete).toHaveBeenCalledWith({where:{id:postId}})
        expect(result).toEqual({
          statusCode:200,
          message:'Post has been deleted successfully',
          deletedId:postId
        })
       })
       it('Повинен викинути NotFoundExeption якщо пост не існує',async()=>{
          mockDataBaseService.post.findUnique.mockResolvedValue(null)
          await expect(service.deletePost('wrong-id','user-123')).rejects.toThrow(NotFoundException)
          expect(mockDataBaseService.post.delete).not.toHaveBeenCalled()
       })
       it('повинен викинути ForbiddenExeption якщо пост захоче видалити інший користувач',async()=>{
        mockDataBaseService.post.findUnique.mockResolvedValue({
          id:'post-123',
          autorId:'owner-1'
        })
        await expect(service.deletePost('post-1','hacker-id')).rejects.toThrow(ForbiddenException)
        expect(mockDataBaseService.post.delete).not.toHaveBeenCalled()
       })
    })
    describe('showAllPostsMySubscribers',()=>{
      it('повинен повертати пустий рядок і не робити запит до БД якщо currentUserId не передано',async()=>{
        const result=await service.showAllPostsMySubscribers('',{page:1,limit:5})
        expect(result).toEqual({
          data:[],
          meta:{total:0,page:1,lastPage:0}
        })
        expect(mockDataBaseService.post.findMany).not.toHaveBeenCalled()
      })
    })
});
