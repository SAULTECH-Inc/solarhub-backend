"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessage = exports.ChatRoom = exports.ChatRoomStatus = exports.MessageRole = exports.ChatRoomType = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
var ChatRoomType;
(function (ChatRoomType) {
    ChatRoomType["AI_SUPPORT"] = "ai_support";
    ChatRoomType["HUMAN_SUPPORT"] = "human_support";
    ChatRoomType["BUYER_SELLER"] = "buyer_seller";
})(ChatRoomType || (exports.ChatRoomType = ChatRoomType = {}));
var MessageRole;
(function (MessageRole) {
    MessageRole["USER"] = "user";
    MessageRole["ASSISTANT"] = "assistant";
    MessageRole["SYSTEM"] = "system";
    MessageRole["HUMAN_AGENT"] = "human_agent";
})(MessageRole || (exports.MessageRole = MessageRole = {}));
var ChatRoomStatus;
(function (ChatRoomStatus) {
    ChatRoomStatus["OPEN"] = "open";
    ChatRoomStatus["ACTIVE"] = "active";
    ChatRoomStatus["RESOLVED"] = "resolved";
    ChatRoomStatus["CLOSED"] = "closed";
})(ChatRoomStatus || (exports.ChatRoomStatus = ChatRoomStatus = {}));
let ChatRoom = class ChatRoom {
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, userId: { required: true, type: () => String }, agentId: { required: true, type: () => String }, productId: { required: true, type: () => String }, orderId: { required: true, type: () => String }, type: { required: true, enum: require("./chat.entity").ChatRoomType }, status: { required: true, enum: require("./chat.entity").ChatRoomStatus }, subject: { required: true, type: () => String }, messageCount: { required: true, type: () => Number }, lastMessageAt: { required: true, type: () => Date }, resolvedAt: { required: true, type: () => Date }, user: { required: true, type: () => require("../users/user.entity").User }, agent: { required: true, type: () => require("../users/user.entity").User }, createdAt: { required: true, type: () => Date } };
    }
};
exports.ChatRoom = ChatRoom;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ChatRoom.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], ChatRoom.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ChatRoom.prototype, "agentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ChatRoom.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ChatRoom.prototype, "orderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ChatRoomType, default: ChatRoomType.AI_SUPPORT }),
    __metadata("design:type", String)
], ChatRoom.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ChatRoomStatus, default: ChatRoomStatus.OPEN }),
    __metadata("design:type", String)
], ChatRoom.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 200 }),
    __metadata("design:type", String)
], ChatRoom.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], ChatRoom.prototype, "messageCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], ChatRoom.prototype, "lastMessageAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], ChatRoom.prototype, "resolvedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], ChatRoom.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'agentId' }),
    __metadata("design:type", user_entity_1.User)
], ChatRoom.prototype, "agent", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ChatRoom.prototype, "createdAt", void 0);
exports.ChatRoom = ChatRoom = __decorate([
    (0, typeorm_1.Entity)('chat_rooms'),
    (0, typeorm_1.Index)(['status'])
], ChatRoom);
let ChatMessage = class ChatMessage {
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, roomId: { required: true, type: () => String }, senderId: { required: true, type: () => String }, role: { required: true, enum: require("./chat.entity").MessageRole }, content: { required: true, type: () => String }, metadata: { required: true, type: () => Object }, isRead: { required: true, type: () => Boolean }, readAt: { required: true, type: () => Date }, createdAt: { required: true, type: () => Date } };
    }
};
exports.ChatMessage = ChatMessage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ChatMessage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], ChatMessage.prototype, "roomId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ChatMessage.prototype, "senderId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: MessageRole }),
    __metadata("design:type", String)
], ChatMessage.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], ChatMessage.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ChatMessage.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ChatMessage.prototype, "isRead", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], ChatMessage.prototype, "readAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ChatMessage.prototype, "createdAt", void 0);
exports.ChatMessage = ChatMessage = __decorate([
    (0, typeorm_1.Entity)('chat_messages')
], ChatMessage);
//# sourceMappingURL=chat.entity.js.map