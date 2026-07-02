import {
  Controller, Get, Post, Patch, Delete, Body, Param,
  Query, UseGuards, UploadedFile, UseInterceptors, HttpCode, HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { UploadsService } from '../uploads/uploads.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Roles, Public } from '../../common/decorators';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly svc: ProductsService,
    private readonly uploads: UploadsService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Search/filter products' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'minPrice', required: false })
  @ApiQuery({ name: 'maxPrice', required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'condition', required: false })
  search(
    @Query('page')     page = 1,
    @Query('limit')    limit = 20,
    @Query('search')   search?: string,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('city')     city?: string,
    @Query('state')    state?: string,
    @Query('condition')condition?: string,
    @Query('featured') featured?: boolean,
  ) {
    return this.svc.search({ search, category, minPrice, maxPrice, city, state, condition, featured }, +page, +limit);
  }

  @Public()
  @Get('featured')
  getFeatured(@Query('limit') limit = 12) {
    return this.svc.getFeatured(+limit);
  }

  @Public()
  @Get(':idOrSlug')
  findOne(@Param('idOrSlug') idOrSlug: string) {
    const isUuid = /^[0-9a-f-]{36}$/.test(idOrSlug);
    return isUuid
      ? this.svc.findById(idOrSlug, true)
      : this.svc.findBySlug(idOrSlug);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create a product listing (sellers only)' })
  create(@Body() dto: any, @CurrentUser() user: any) {
    return this.svc.create(dto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth('JWT')
  update(@Param('id') id: string, @Body() dto: any, @CurrentUser() user: any) {
    return this.svc.update(id, dto, user.id, user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth('JWT')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.delete(id, user.id, user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/upload-image')
  @ApiBearerAuth('JWT')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@Param('id') id: string, @UploadedFile() file: any, @CurrentUser() user: any) {
    const product = await this.svc.findById(id);
    if (product.sellerId !== user.id && user.role !== 'admin') throw new Error('Forbidden');
    const result = await this.uploads.uploadImage(file, 'products');
    const images = [...(product.images || []), result.url];
    return this.svc.update(id, { images, thumbnail: product.thumbnail || result.url }, user.id, user.role);
  }

  @UseGuards(JwtAuthGuard)
  @Post('scan-label')
  @ApiBearerAuth('JWT')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async scanLabel(
    @UploadedFile() file: any,
    @Query('category') category: string,
  ) {
    return this.uploads.extractSpecsFromLabel(file, category);
  }

  @UseGuards(JwtAuthGuard)
  @Get('seller/edit-lock/:productId')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Check if a product is locked for editing' })
  getEditLock(@Param('productId') productId: string, @CurrentUser() user: any) {
    return this.svc.getEditLockStatus(productId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('seller/my-products')
  @ApiBearerAuth('JWT')
  getMyProducts(
    @CurrentUser('id') uid: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.svc.getSellerProducts(uid, +page, +limit);
  }

  @UseGuards(JwtAuthGuard)
  @Get('seller/listing-quota')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get current seller listing quota usage' })
  getListingQuota(@CurrentUser() user: any) {
    return this.svc.getListingQuota(user);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id/approve')
  @ApiBearerAuth('JWT')
  approve(@Param('id') id: string) {
    return this.svc.approve(id);
  }
}
