// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// const initialUsers = [
//   {
//     name: "川島",
//     lineUserId: "Ua1ffc5321b117a134dfe6eb8a3827294",
//     color: "#FF5733",
//     email: null
//   },
//   {
//     name: "弓木野", 
//     lineUserId: "Uf1bb3a48bf5974b39540482116dd6d09",
//     color: "#33FF57",
//     email: null
//   },
//   {
//     name: "漆畑",
//     lineUserId: "U869a0f7f41941e953d75f5e5f73d947f", 
//     color: "#F5FF33",
//     email: null
//   },
//   {
//     name: "池本",
//     lineUserId: "U65edb578f123dd915c6519f4b5730266",
//     color: "#FF33F5",
//     email: null
//   },
//   {
//     name: "飯田",
//     lineUserId: "U89f20854525d480262ad4d290b5767d2",
//     color: "#3357FF",
//     email: null
//   }
// ];

// async function seedUsers() {
//   console.log('Seeding users...');
  
//   for (const userData of initialUsers) {
//     const existingUser = await prisma.user.findFirst({
//       where: { name: userData.name }
//     });
    
//     if (!existingUser) {
//       await prisma.user.create({
//         data: userData
//       });
//       console.log(`Created user: ${userData.name}`);
//     } else {
//       console.log(`User already exists: ${userData.name}`);
//     }
//   }
  
//   console.log('User seeding completed');
// }

// seedUsers()
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });