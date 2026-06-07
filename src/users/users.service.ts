import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true, email: true, firstName: true, lastName: true,
        isActive: true, createdAt: true,
        userRoles: { include: { role: true } },
      },
    });
    return users.map(u => ({ ...u, roles: u.userRoles.map(ur => ur.role.name) }));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: { include: { rolePermissions: { include: { permission: true } } } },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const { password, ...safe } = user;
    return {
      ...safe,
      roles: user.userRoles.map(ur => ur.role.name),
      permissions: user.userRoles.flatMap(ur =>
        ur.role.rolePermissions.map(rp => `${rp.permission.action}:${rp.permission.subject}`)
      ),
    };
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    const user = await this.prisma.user.update({ where: { id }, data: dto });
    const { password, ...safe } = user;
    return safe;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.delete({ where: { id } });
  }
}