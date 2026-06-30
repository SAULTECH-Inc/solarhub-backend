import {
  Controller, Post, Delete, Param, UploadedFile,
  UploadedFiles, UseInterceptors, UseGuards, Query,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsersService } from '../users/users.service';
import { CurrentUser } from '../../common/decorators';

@ApiTags('Uploads')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly svc: UploadsService,
    private readonly users: UsersService,
  ) {}

  @Post('image')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a single image to Cloudinary' })
  @UseInterceptors(FileInterceptor('file'))
  uploadOne(@UploadedFile() file: any, @Query('folder') folder = 'general') {
    return this.svc.uploadImage(file, folder);
  }

  @Post('images')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload multiple images' })
  @UseInterceptors(FilesInterceptor('files', 8))
  uploadMany(@UploadedFiles() files: any[], @Query('folder') folder = 'products') {
    return this.svc.uploadMultiple(files, folder);
  }

  /** Upload single image OR video */
  @Post('media')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a single image or video' })
  @UseInterceptors(FileInterceptor('file'))
  uploadMedia(@UploadedFile() file: any, @Query('folder') folder = 'products') {
    return this.svc.uploadMedia(file, folder);
  }

  /** Upload up to 10 images/videos (mixed) */
  @Post('media-multiple')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload multiple images and/or videos (max 10)' })
  @UseInterceptors(FilesInterceptor('files', 10))
  uploadMediaMultiple(@UploadedFiles() files: any[], @Query('folder') folder = 'products') {
    return this.svc.uploadMultipleMedia(files, folder);
  }

  /** Upload & save avatar — updates user.avatar in DB */
  @Post('avatar')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload profile avatar and save to user record' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: any, @CurrentUser('id') userId: string) {
    const result = await this.svc.uploadAvatar(file, 'avatars');
    await this.users.updateProfile(userId, { avatar: result.url } as any);
    return result;
  }

  @Delete()
  @ApiOperation({ summary: 'Delete image from Cloudinary by publicId query param (supports paths with slashes)' })
  deleteImageByQuery(@Query('publicId') publicId: string) {
    return this.svc.deleteImage(publicId);
  }

  @Delete(':publicId')
  @ApiOperation({ summary: 'Delete image from Cloudinary (single-segment publicId only)' })
  deleteImage(@Param('publicId') publicId: string) {
    return this.svc.deleteImage(publicId);
  }

  @Post('extract-specs')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Extract product specs from label image using AI' })
  @UseInterceptors(FileInterceptor('file'))
  extractSpecs(@UploadedFile() file: any, @Query('category') category: string) {
    return this.svc.extractSpecsFromLabel(file, category);
  }
}
