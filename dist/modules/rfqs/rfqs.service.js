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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RfqsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const rfq_entity_1 = require("./rfq.entity");
const pagination_util_1 = require("../../common/utils/pagination.util");
let RfqsService = class RfqsService {
    constructor(rfqRepo, bidRepo) {
        this.rfqRepo = rfqRepo;
        this.bidRepo = bidRepo;
    }
    async createRfq(userId, dto) {
        const rfq = this.rfqRepo.create({
            ...dto,
            userId,
            status: rfq_entity_1.RfqStatus.OPEN,
        });
        return this.rfqRepo.save(rfq);
    }
    async getMyRfqs(userId, page, limit) {
        const { skip, take } = (0, pagination_util_1.paginationToSkipTake)(page, limit);
        const [data, total] = await this.rfqRepo.findAndCount({
            where: { userId },
            relations: ['bids', 'bids.contractor'],
            order: { createdAt: 'DESC' },
            skip, take,
        });
        return (0, pagination_util_1.paginate)(data, total, page, limit);
    }
    async acceptBid(userId, bidId) {
        const bid = await this.bidRepo.findOne({ where: { id: bidId }, relations: ['rfq'] });
        if (!bid)
            throw new common_1.NotFoundException('Bid not found');
        if (bid.rfq.userId !== userId)
            throw new common_1.ForbiddenException('Not your RFQ');
        if (bid.rfq.status !== rfq_entity_1.RfqStatus.OPEN && bid.rfq.status !== rfq_entity_1.RfqStatus.REVIEWING) {
            throw new common_1.BadRequestException('RFQ is no longer open');
        }
        bid.status = rfq_entity_1.BidStatus.ACCEPTED;
        await this.bidRepo.save(bid);
        await this.bidRepo.update({ rfqId: bid.rfqId, status: rfq_entity_1.BidStatus.PENDING }, { status: rfq_entity_1.BidStatus.REJECTED });
        bid.rfq.status = rfq_entity_1.RfqStatus.AWARDED;
        await this.rfqRepo.save(bid.rfq);
        return bid;
    }
    async getOpenRfqs(state, city, page = 1, limit = 20) {
        const { skip, take } = (0, pagination_util_1.paginationToSkipTake)(page, limit);
        const qb = this.rfqRepo.createQueryBuilder('r')
            .leftJoinAndSelect('r.user', 'u')
            .where('r.status = :status', { status: rfq_entity_1.RfqStatus.OPEN });
        if (state)
            qb.andWhere('r.state ILIKE :state', { state: `%${state}%` });
        if (city)
            qb.andWhere('r.city ILIKE :city', { city: `%${city}%` });
        qb.skip(skip).take(take).orderBy('r.createdAt', 'DESC');
        const [data, total] = await qb.getManyAndCount();
        return (0, pagination_util_1.paginate)(data, total, page, limit);
    }
    async submitBid(contractor, rfqId, dto) {
        if (!contractor.isEngineer && !contractor.isSeller) {
            throw new common_1.ForbiddenException('Only verified professionals can submit bids');
        }
        const rfq = await this.rfqRepo.findOne({ where: { id: rfqId } });
        if (!rfq)
            throw new common_1.NotFoundException('RFQ not found');
        if (rfq.status !== rfq_entity_1.RfqStatus.OPEN)
            throw new common_1.BadRequestException('RFQ is not open for bidding');
        const existing = await this.bidRepo.findOne({ where: { rfqId, contractorId: contractor.id } });
        if (existing)
            throw new common_1.BadRequestException('You have already submitted a quote for this project');
        const bid = this.bidRepo.create({
            ...dto,
            rfqId,
            contractorId: contractor.id,
            status: rfq_entity_1.BidStatus.PENDING,
        });
        await this.bidRepo.save(bid);
        await this.rfqRepo.increment({ id: rfqId }, 'bidCount', 1);
        return bid;
    }
};
exports.RfqsService = RfqsService;
exports.RfqsService = RfqsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(rfq_entity_1.Rfq)),
    __param(1, (0, typeorm_1.InjectRepository)(rfq_entity_1.RfqBid)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], RfqsService);
//# sourceMappingURL=rfqs.service.js.map