"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationQuery = exports.Auth = exports.Public = exports.IS_PUBLIC_KEY = exports.Roles = exports.ROLES_KEY = exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../guards/jwt-auth.guard");
const roles_guard_1 = require("../guards/roles.guard");
exports.CurrentUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
});
exports.ROLES_KEY = 'roles';
const Roles = (...roles) => (0, common_1.SetMetadata)(exports.ROLES_KEY, roles);
exports.Roles = Roles;
exports.IS_PUBLIC_KEY = 'isPublic';
const Public = () => (0, common_1.SetMetadata)(exports.IS_PUBLIC_KEY, true);
exports.Public = Public;
const Auth = (...roles) => (0, common_1.applyDecorators)((0, common_1.SetMetadata)(exports.ROLES_KEY, roles), (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard), (0, swagger_1.ApiBearerAuth)('JWT'), (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Unauthorized' }));
exports.Auth = Auth;
exports.PaginationQuery = (0, common_1.createParamDecorator)((_data, ctx) => {
    const { query } = ctx.switchToHttp().getRequest();
    return {
        page: Math.max(1, parseInt(query.page, 10) || 1),
        limit: Math.min(100, parseInt(query.limit, 10) || 20),
        sortBy: query.sortBy || 'createdAt',
        order: (query.order || 'DESC').toUpperCase(),
    };
});
//# sourceMappingURL=index.js.map