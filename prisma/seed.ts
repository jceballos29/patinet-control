import { PrismaClient, GlobalRoleName } from './generated'
import * as bcrypt from 'bcrypt'
import * as dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create global roles
  console.log('Creating global roles...')

  const superAdminRole = await prisma.globalRole.upsert({
    where: { name: GlobalRoleName.SUPER_ADMIN },
    update: {},
    create: {
      name: GlobalRoleName.SUPER_ADMIN,
    }
  });

  const adminRole = await prisma.globalRole.upsert({
    where: { name: GlobalRoleName.ADMIN },
    update: {},
    create: {
      name: GlobalRoleName.ADMIN,
    }
  });

  const employeeRole = await prisma.globalRole.upsert({
    where: { name: GlobalRoleName.EMPLOYEE },
    update: {},
    create: {
      name: GlobalRoleName.EMPLOYEE,
    }
  });
  console.log('Global roles created/updated:', { superAdminRole, adminRole, employeeRole });

  // Create basic permission
  console.log('Creating basic permissions...')
  const permissionsData = [
    // Global permissions
    { name: 'MANAGE_GLOBAL_USERS', description: 'Allows management of all users on the platform.' },
    { name: 'CREATE_OFFICE', description: 'Allows creation of new offices.' },
    { name: 'VIEW_GLOBAL_REPORTS', description: 'Allows viewing of aggregated reports across all offices.' },

    // Office permissions
    { name: 'MANAGE_OFFICE_SETTINGS', description: 'Allows configuration of office general settings (e.g., name, address, hours).' },
    { name: 'MANAGE_OFFICE_USERS', description: 'Allows adding/removing users from the office and assigning JobPositions.' },
    { name: 'MANAGE_JOB_POSITIONS', description: 'Allows creation, editing, and deletion of job positions within an office.' },
    { name: 'ASSIGN_JOB_POSITION_PERMISSIONS', description: 'Allows assigning permissions to job positions within an office.' },
    { name: 'CREATE_PATIENT', description: 'Allows creation of new patient records.' },
    { name: 'VIEW_PATIENT_RECORDS', description: 'Allows viewing of patient profiles and history.' },
    { name: 'EDIT_PATIENT_RECORDS', description: 'Allows editing of patient profiles and history.' },
    { name: 'SCHEDULE_SESSION', description: 'Allows scheduling new sessions for patients.' },
    { name: 'CANCEL_SESSION', description: 'Allows canceling scheduled sessions.' },
    { name: 'VIEW_AGENDA', description: 'Allows viewing the office agenda/calendar.' },
    { name: 'UPDATE_SESSION_STATUS', description: 'Allows updating the status of a session (e.g., confirmed, completed).' },
    { name: 'VIEW_OFFICE_REPORTS', description: 'Allows viewing reports specific to an office.' },
  ]

  const permissions = [];
  for (const permData of permissionsData) {
    const permission = await prisma.permission.upsert({
      where: { name: permData.name },
      update: {},
      create: permData,
    });
    permissions.push(permission);
  }
  console.log('Permissions created/updated:', permissions.map(p => p.name));

  // Create default super admin user
  console.log('Creating default super admin user...')
  
  const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@example.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'password123'; // ¡NUNCA USES ESTO EN PRODUCCIÓN!

  if (!process.env.SUPER_ADMIN_EMAIL || !process.env.SUPER_ADMIN_PASSWORD) {
    console.warn('ADVERTENCIA: Las variables de entorno SUPER_ADMIN_EMAIL o SUPER_ADMIN_PASSWORD no están definidas.');
    console.warn('Se utilizarán credenciales por defecto para el SUPER_ADMIN.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const superAdminUser = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      firstName: 'Juan',
      lastName: 'Ceballos',
      email,
      password: hashedPassword,
      globalRoleId: superAdminRole.id,
      isActive: true,
    },
  });

  console.log(`Super admin user created/updated: ${superAdminUser.email}`);
  if (!process.env.SUPER_ADMIN_PASSWORD) {
    console.log('WARNING: The default password is "password123".');
    console.log('Please update the super admin password after logging in.');
    } else {
    console.log('The default password is the one defined in the environment variables.');
  }
}

main()
  .catch(e => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });