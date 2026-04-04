import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, Public } from '../../common/decorators';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly svc: ReviewsService) {}

  @Public()
  @Get('product/:productId')
  getProductReviews(
    @Param('productId') pid: string,
    @Query('page') p = 1, @Query('limit') l = 20,
  ) {
    return this.svc.getProductReviews(pid, +p, +l);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Post()
  create(@CurrentUser('id') uid: string, @Body() dto: any) {
    return this.svc.create(uid, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Patch(':id/reply')
  reply(@Param('id') id: string, @CurrentUser('id') uid: string, @Body('reply') reply: string) {
    return this.svc.replyToReview(id, uid, reply);
  }

  @Public()
  @Patch(':id/helpful')
  markHelpful(@Param('id') id: string) {
    return this.svc.markHelpful(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.svc.delete(id, user.id, user.role);
  }
}
