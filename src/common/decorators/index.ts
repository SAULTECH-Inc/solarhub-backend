import {
  createParamDecorator, ExecutionContext,
  SetMetadata, applyDecorators, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

// ── Get current user from request ─────────────────────────
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

// ── Roles metadata ────────────────────────────────────────
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// ── Public route (skip JWT guard) ─────────────────────────
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// ── Auth + Roles combo decorator ─────────────────────────
export const Auth = (...roles: string[]) =>
  applyDecorators(
    SetMetadata(ROLES_KEY, roles),
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiBearerAuth('JWT'),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );

// ── Pagination query ──────────────────────────────────────
export const PaginationQuery = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const { query } = ctx.switchToHttp().getRequest();
    return {
      page:   Math.max(1, parseInt(query.page, 10) || 1),
      limit:  Math.min(100, parseInt(query.limit, 10) || 20),
      sortBy: query.sortBy || 'createdAt',
      order:  (query.order || 'DESC').toUpperCase() as 'ASC' | 'DESC',
    };
  },
);

export interface PaginationParams {
  page:   number;
  limit:  number;
  sortBy: string;
  order:  'ASC' | 'DESC';
}
