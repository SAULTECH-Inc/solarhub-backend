import { Controller, Post, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
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

  @Public()
  @Post('chat')
  @ApiOperation({ summary: 'SolarBot AI chat (REST fallback when WebSocket unavailable)' })
  chat(@Body() body: { message: string; history?: Array<{ role: 'user' | 'assistant'; content: string }> }) {
    return this.svc.chatWithBot(body.message, body.history);
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

  @Public()
  @Get('sessions/:id/marketplace-items')
  @ApiOperation({ summary: 'Get marketplace products matching a recommendation tier' })
  getMarketplaceItems(
    @Param('id') id: string,
    @Query('tier') tier: string,
    @Query('preference') preference: string,
  ) {
    const pref = (['budget', 'quality', 'balanced'] as const).includes(preference as any)
      ? (preference as 'budget' | 'quality' | 'balanced')
      : 'balanced';
    return this.svc.getMarketplaceItemsForSession(id, tier || 'budget', pref);
  }
}
