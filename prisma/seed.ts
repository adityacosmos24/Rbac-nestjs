import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from 'bcrypt';


const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});


async function main() {
  const permissions = await Promise.all([
    prisma.permission.upsert({
      where: {
        action_subject: {
          action: 'create',
          subject: 'user',
        },
      },
      update: {},
      create: {
        action: 'create',
        subject: 'user',
        description: 'Create users',
      },
    }),

    prisma.permission.upsert({
      where: {
        action_subject: {
          action: 'read',
          subject: 'user',
        },
      },
      update: {},
      create: {
        action: 'read',
        subject: 'user',
        description: 'Read users',
      },
    }),

    prisma.permission.upsert({
      where: {
        action_subject: {
          action: 'update',
          subject: 'user',
        },
      },
      update: {},
      create: {
        action: 'update',
        subject: 'user',
        description: 'Update users',
      },
    }),

    prisma.permission.upsert({
      where: {
        action_subject: {
          action: 'delete',
          subject: 'user',
        },
      },
      update: {},
      create: {
        action: 'delete',
        subject: 'user',
        description: 'Delete users',
      },
    }),

    prisma.permission.upsert({
      where: {
        action_subject: {
          action: 'manage',
          subject: 'role',
        },
      },
      update: {},
      create: {
        action: 'manage',
        subject: 'role',
        description: 'Manage roles',
      },
    }),

    prisma.permission.upsert({
      where: {
        action_subject: {
          action: 'read',
          subject: 'role',
        },
      },
      update: {},
      create: {
        action: 'read',
        subject: 'role',
        description: 'Read roles',
      },
    }),
  ]);

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator with full access',
    },
  });

  const moderatorRole = await prisma.role.upsert({
    where: { name: 'moderator' },
    update: {},
    create: {
      name: 'moderator',
      description: 'Moderator with limited access',
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      description: 'Regular user',
    },
  });

  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }

  const readPermissions = permissions.filter(
    (permission) => permission.action === 'read',
  );

  for (const permission of readPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: moderatorRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: moderatorRole.id,
        permissionId: permission.id,
      },
    });
  }

  const adminPassword = await bcrypt.hash('Admin@123', 10);

  const admin = await prisma.user.upsert({
    where: {
      email: 'admin@example.com',
    },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      firstName: 'Super',
      lastName: 'Admin',
    },
  });

  const moderatorPassword = await bcrypt.hash('Mod@123', 10);

  const moderator = await prisma.user.upsert({
    where: {
      email: 'moderator@example.com',
    },
    update: {},
    create: {
      email: 'moderator@example.com',
      password: moderatorPassword,
      firstName: 'John',
      lastName: 'Moderator',
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: admin.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      roleId: adminRole.id,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: moderator.id,
        roleId: moderatorRole.id,
      },
    },
    update: {},
    create: {
      userId: moderator.id,
      roleId: moderatorRole.id,
    },
  });

  console.log('✅ Seed complete');
  console.log('Admin: admin@example.com / Admin@123');
  console.log('Moderator: moderator@example.com / Mod@123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });