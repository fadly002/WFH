import { AttendanceType, PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Karyawan123!', 10);
  const adminHash = await bcrypt.hash('Admin123!', 10);

  await prisma.attendance.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      email: 'admin@dexagroup.com',
      passwordHash: adminHash,
      role: Role.ADMIN,
    },
  });

  const employees = [
    {
      email: 'budi.santoso@dexagroup.com',
      name: 'Budi Santoso',
      position: 'Software Engineer',
      phone: '081234567801',
    },
    {
      email: 'siti.rahayu@dexagroup.com',
      name: 'Siti Rahayu',
      position: 'QA Engineer',
      phone: '081234567802',
    },
    {
      email: 'andi.wijaya@dexagroup.com',
      name: 'Andi Wijaya',
      position: 'Product Designer',
      phone: '081234567803',
    },
  ];

  const created = [];
  for (const item of employees) {
    const user = await prisma.user.create({
      data: {
        email: item.email,
        passwordHash,
        role: Role.EMPLOYEE,
        employee: {
          create: {
            name: item.name,
            position: item.position,
            phone: item.phone,
          },
        },
      },
      include: { employee: true },
    });
    created.push(user);
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  for (const user of created) {
    if (!user.employee) continue;

    for (let day = 1; day <= now.getDate(); day += 1) {
      const weekday = new Date(year, month, day).getDay();
      if (weekday === 0 || weekday === 6) continue;

      const masuk = new Date(year, month, day, 8, 5 + (day % 12), 0);
      const pulang = new Date(year, month, day, 17, 10 + (day % 8), 0);

      await prisma.attendance.createMany({
        data: [
          {
            employeeId: user.employee.id,
            type: AttendanceType.MASUK,
            timestamp: masuk,
          },
          {
            employeeId: user.employee.id,
            type: AttendanceType.PULANG,
            timestamp: pulang,
          },
        ],
      });
    }
  }

  console.log('Seed selesai');
  console.log('Admin     : admin@dexagroup.com / Admin123!');
  console.log('Karyawan  : budi.santoso@dexagroup.com / Karyawan123!');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
