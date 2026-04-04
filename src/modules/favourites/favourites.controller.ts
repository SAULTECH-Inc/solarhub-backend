import {
  Controller, Get, Post, Delete, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FavouritesService } from './favourites.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';

@ApiTags('Favourites')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('favourites')
export class FavouritesController {
  constructor(private readonly svc: FavouritesService) {}

  @Get()
  @ApiOperation({ summary: 'Get user saved products' })
  getAll(
    @CurrentUser('id') uid: string,
    @Query('page') p = 1,
    @Query('limit') l = 20,
  ) {
    return this.svc.getUserFavourites(uid, +p, +l);
  }

  @Get('ids')
  @ApiOperation({ summary: 'Get all favourite product IDs (for UI state)' })
  getIds(@CurrentUser('id') uid: string) {
    return this.svc.getUserFavouriteIds(uid);
  }

  @Post(':productId')
  @ApiOperation({ summary: 'Toggle a product favourite (add or remove)' })
  toggle(@CurrentUser('id') uid: string, @Param('productId') pid: string) {
    return this.svc.toggle(uid, pid);
  }

  @Get(':productId/check')
  check(@CurrentUser('id') uid: string, @Param('productId') pid: string) {
    return this.svc.isFavourited(uid, pid).then(is => ({ isFavourited: is }));
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all favourites' })
  clearAll(@CurrentUser('id') uid: string) {
    return this.svc.clearAll(uid);
  }
}
