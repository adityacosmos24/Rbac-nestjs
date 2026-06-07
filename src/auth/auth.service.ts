import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService, private jwtService: JwtService) { }

    async register(dto: RegisterDto) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) throw new ConflictException('Email already in use');

        const hashed = await bcrypt.hash(dto.password, 10);

        const defaultRole = await this.prisma.role.findUnique({ where: { name: 'user' } });

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashed,
                firstName: dto.firstName,
                lastName: dto.lastName,
                ...(defaultRole && {
                    userRoles: { create: { roleId: defaultRole.id } },
                }),
            },
        });

        const { password, ...result } = user;
        return result;
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

        const valid = await bcrypt.compare(dto.password, user.password);
        if (!valid) throw new UnauthorizedException('Invalid credentials');

        const payload = { sub: user.id, email: user.email };
        return {
            access_token: this.jwtService.sign(payload),
            user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
        };
    }

    async getProfile(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                userRoles: {
                    include: {
                        role: {
                            include: {
                                rolePermissions: { include: { permission: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!user) throw new NotFoundException('User not found');  // add this too

        const { password, ...safeUser } = user;   // user is now non-null, TS is happy
        return {
            ...safeUser,
            roles: user.userRoles.map(ur => ur.role.name),
            permissions: user.userRoles.flatMap(ur =>
                ur.role.rolePermissions.map(rp => `${rp.permission.action}:${rp.permission.subject}`)
            ),
        };
    }
}