import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

import { RawMaterialsService } from './raw-materials.service';
import { ReceiveStockDto } from './dto/receive-stock.dto';
import { UpdateRawMaterialDto } from './dto/update-raw-material.dto';
import type { JwtPayload } from '../auth/jwt.strategy';

@Controller('raw-materials')
@UseGuards(AuthGuard('jwt'))
export class RawMaterialsController {
  constructor(private readonly materials: RawMaterialsService) {}

  /** Anyone authenticated can read inventory (manager/owner UI + forecast). */
  @Get()
  list() {
    return this.materials.list();
  }

  /** Manager / owner can record incoming deliveries. */
  @Post(':id/receive')
  receive(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: ReceiveStockDto,
  ) {
    const me = req.user as JwtPayload;
    if (me.role !== 'owner' && me.role !== 'manager') {
      throw new ForbiddenException('Only manager / owner can receive stock');
    }
    return this.materials.receive(id, dto.units);
  }

  /** Manager + owner — edit name, Urdu name, reorder threshold. */
  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateRawMaterialDto,
  ) {
    const me = req.user as JwtPayload;
    if (me.role !== 'owner' && me.role !== 'manager') {
      throw new ForbiddenException('Only manager / owner can edit raw materials');
    }
    return this.materials.update(id, dto);
  }
}
