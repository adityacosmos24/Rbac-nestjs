import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({
      include: {
        rolePermissions: { include: { permission: true } },
        _count: { select: { userRoles: true } },
      },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: { rolePermissions: { include: { permission: true } } },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async create(dto: CreateRoleDto) {
    const existing = await this.prisma.role.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Role name already exists');

    return this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        ...(dto.permissionIds?.length && {
          rolePermissions: {
            create: dto.permissionIds.map(pid => ({ permissionId: pid })),
          },
        }),
      },
      include: { rolePermissions: { include: { permission: true } } },
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    return this.prisma.role.delete({ where: { id } });
  }

  async assignRole(dto: AssignRoleDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');

    const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
    if (!role) throw new NotFoundException('Role not found');

    return this.prisma.userRole.upsert({
      where: { userId_roleId: { userId: dto.userId, roleId: dto.roleId } },
      update: {},
      create: { userId: dto.userId, roleId: dto.roleId },
    });
  }

  async revokeRole(userId: string, roleId: string) {
    return this.prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId } },
    });
  }

  async getAllPermissions() {
    return this.prisma.permission.findMany();
  }
}