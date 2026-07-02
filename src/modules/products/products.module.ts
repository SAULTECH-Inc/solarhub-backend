import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { Category } from '../categories/category.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { UploadsModule } from '../uploads/uploads.module';
import { CartItem } from '../cart/cart.entity';
import { OrderItem } from '../orders/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Category, CartItem, OrderItem]), UploadsModule],
  providers: [ProductsService],
  controllers: [ProductsController],
  exports: [ProductsService, TypeOrmModule],
})
export class ProductsModule {}
