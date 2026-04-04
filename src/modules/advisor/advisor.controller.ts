import { Controller, Post, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdvisorService } from './advisor.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, Public } from '../../common/decorators';

@ApiTags('Advisor')
@Controller('advisor')
export class AdvisorController {
  constructor(private readonly svc: AdvisorService) {}

  @Public()
  @Post('calculate')
  @ApiOperation({ summary: 'Calculate 3 solar system recommendations (Claude AI)' })
  calculate(@Body() body: any, @CurrentUser() user?: any) {
    return this.svc.calculate(body.appliances, body.preferences, user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Get('sessions')
  getSessions(@CurrentUser('id') uid: string) {
    return this.svc.getUserSessions(uid);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Get('sessions/:id')
  getSession(@Param('id') id: string) {
    return this.svc.getSession(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @Patch('sessions/:id/select')
  saveSelection(@Param('id') id: string, @Body('recommendationId') recId: string) {
    return this.svc.saveSelection(id, recId);
  }
}
