import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { Public } from '../../common/decorators';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly svc: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all categories (tree)' })
  findAll() { return this.svc.findAll(); }

  @Public()
  @Get(':slug')
  findBySlug(@Param('slug') slug: string) { return this.svc.findBySlug(slug); }

  @Public()
  @Get(':id/spec-schema')
  getSchema(@Param('id') id: string) { return this.svc.getSpecSchema(id); }
}
