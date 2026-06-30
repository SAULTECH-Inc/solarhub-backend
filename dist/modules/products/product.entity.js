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
exports.Product = exports.PaymentTerm = exports.DeliveryPayer = exports.ProductCondition = exports.ProductStatus = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../users/user.entity");
const category_entity_1 = require("../categories/category.entity");
var ProductStatus;
(function (ProductStatus) {
    ProductStatus["ACTIVE"] = "active";
    ProductStatus["INACTIVE"] = "inactive";
    ProductStatus["PENDING"] = "pending";
    ProductStatus["SOLD_OUT"] = "sold_out";
    ProductStatus["DELETED"] = "deleted";
})(ProductStatus || (exports.ProductStatus = ProductStatus = {}));
var ProductCondition;
(function (ProductCondition) {
    ProductCondition["NEW"] = "new";
    ProductCondition["USED_LIKE_NEW"] = "used_like_new";
    ProductCondition["USED_GOOD"] = "used_good";
    ProductCondition["REFURBISHED"] = "refurbished";
})(ProductCondition || (exports.ProductCondition = ProductCondition = {}));
var DeliveryPayer;
(function (DeliveryPayer) {
    DeliveryPayer["SELLER"] = "seller";
    DeliveryPayer["BUYER"] = "buyer";
    DeliveryPayer["SHARED"] = "shared";
    DeliveryPayer["NEGOTIABLE"] = "negotiable";
})(DeliveryPayer || (exports.DeliveryPayer = DeliveryPayer = {}));
var PaymentTerm;
(function (PaymentTerm) {
    PaymentTerm["ESCROW"] = "escrow";
    PaymentTerm["BEFORE_DELIVERY"] = "before_delivery";
    PaymentTerm["ON_DELIVERY"] = "on_delivery";
    PaymentTerm["AFTER_INSPECTION"] = "after_inspection";
    PaymentTerm["INSTALLMENT"] = "installment";
})(PaymentTerm || (exports.PaymentTerm = PaymentTerm = {}));
let Product = class Product {
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, name: { required: true, type: () => String }, slug: { required: true, type: () => String }, description: { required: true, type: () => String }, price: { required: true, type: () => Number }, currency: { required: true, type: () => String }, prices: { required: true, type: () => ({ NGN: { required: false, type: () => Number }, USD: { required: false, type: () => Number }, CNY: { required: false, type: () => Number }, GHS: { required: false, type: () => Number } }) }, stock: { required: true, type: () => Number }, condition: { required: true, enum: require("./product.entity").ProductCondition }, status: { required: true, enum: require("./product.entity").ProductStatus }, brand: { required: true, type: () => String }, modelNumber: { required: true, type: () => String }, warrantyYears: { required: true, type: () => Number }, sellerCity: { required: true, type: () => String }, sellerState: { required: true, type: () => String }, deliveryDays: { required: true, type: () => Number }, shippingPayer: { required: true, enum: require("./product.entity").DeliveryPayer }, serviceAreas: { required: true, type: () => String }, paymentTerms: { required: true, type: () => [String] }, returnPolicy: { required: true, type: () => String }, images: { required: true, type: () => [String] }, thumbnail: { required: true, type: () => String }, specs: { required: true, type: () => Object }, discounts: { required: true }, views: { required: true, type: () => Number }, salesCount: { required: true, type: () => Number }, averageRating: { required: true, type: () => Number }, reviewCount: { required: true, type: () => Number }, featured: { required: true, type: () => Boolean }, badge: { required: true, type: () => String }, searchVector: { required: true, type: () => Object }, categoryId: { required: true, type: () => String }, sellerId: { required: true, type: () => String }, category: { required: true, type: () => require("../categories/category.entity").Category }, seller: { required: true, type: () => require("../users/user.entity").User }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.Product = Product;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Product.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 300 }),
    __metadata("design:type", String)
], Product.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 320 }),
    __metadata("design:type", String)
], Product.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 2000, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 14, scale: 2 }),
    __metadata("design:type", Number)
], Product.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 3, default: 'NGN' }),
    __metadata("design:type", String)
], Product.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Product.prototype, "prices", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "stock", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ProductCondition, default: ProductCondition.NEW }),
    __metadata("design:type", String)
], Product.prototype, "condition", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ProductStatus, default: ProductStatus.PENDING }),
    __metadata("design:type", String)
], Product.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "brand", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "modelNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Product.prototype, "warrantyYears", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "sellerCity", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "sellerState", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 3 }),
    __metadata("design:type", Number)
], Product.prototype, "deliveryDays", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: DeliveryPayer, default: DeliveryPayer.BUYER }),
    __metadata("design:type", String)
], Product.prototype, "shippingPayer", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "serviceAreas", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], Product.prototype, "paymentTerms", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "returnPolicy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], Product.prototype, "images", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 500 }),
    __metadata("design:type", String)
], Product.prototype, "thumbnail", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Product.prototype, "specs", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Array)
], Product.prototype, "discounts", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "views", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "salesCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 3, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "averageRating", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], Product.prototype, "reviewCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Product.prototype, "featured", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 100 }),
    __metadata("design:type", String)
], Product.prototype, "badge", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tsvector', select: false, nullable: true }),
    __metadata("design:type", Object)
], Product.prototype, "searchVector", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Product.prototype, "sellerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => category_entity_1.Category, { eager: false, nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'categoryId' }),
    __metadata("design:type", category_entity_1.Category)
], Product.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { eager: false, nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'sellerId' }),
    __metadata("design:type", user_entity_1.User)
], Product.prototype, "seller", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Product.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Product.prototype, "updatedAt", void 0);
exports.Product = Product = __decorate([
    (0, typeorm_1.Entity)('products'),
    (0, typeorm_1.Index)(['status', 'categoryId']),
    (0, typeorm_1.Index)(['sellerId'])
], Product);
//# sourceMappingURL=product.entity.js.map