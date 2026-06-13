/**
 * src/modules/users/users.controller.ts
 * Endpoint admin pengelolaan staf (thin: validasi + delegasi ke service).
 */
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

/** Kelola user (khusus ADMIN; default-deny via RolesGuard global). */
@ApiTags('Admin · Users')
@ApiBearerAuth()
@Controller('admin/users')
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.users.list(query.page, query.perPage);
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.getById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.users.update(id, dto);
  }

  /** Tetapkan password spesifik untuk user terpilih. */
  @Patch(':id/password')
  setPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetPasswordDto,
  ) {
    return this.users.setPassword(id, dto.password);
  }

  /** Reset password user ke nilai acak; balikan plaintext sekali tampil. */
  @Post(':id/password/reset')
  resetPassword(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.resetPassword(id);
  }
}
