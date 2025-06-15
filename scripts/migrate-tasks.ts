// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// // User mapping from existing assignee names to userIds
// const userMapping: Record<string, string> = {};

// // Status mapping from old to new
// const statusMapping = {
//   "NOT_STARTED": "IDEA",
//   "STARTED": "PLAN", 
//   "IN_PROGRESS": "DO",
//   "NEARLY_DONE": "CHECK",
//   "COMPLETED": "COMPLETE"
// } as const;

// // Priority mapping from old to new
// const priorityMapping = {
//   "HIGH": "A",
//   "MEDIUM": "B", 
//   "LOW": "C"
// } as const;

// async function migrateExistingTasks() {
//   console.log('Starting task migration...');
  
//   // First, get all users to build the user mapping
//   const users = await prisma.user.findMany();
//   users.forEach(user => {
//     userMapping[user.name] = user.id;
//   });
  
//   console.log('User mapping:', userMapping);
  
//   // Get all existing tasks
//   const tasks = await prisma.task.findMany();
//   console.log(`Found ${tasks.length} tasks to migrate`);
  
//   let migratedCount = 0;
//   let skippedCount = 0;
  
//   for (const task of tasks) {
//     try {
//       // Check if this task has already been migrated (has userId field)
//       if ('userId' in task && task.userId) {
//         console.log(`Task ${task.id} already migrated, skipping`);
//         skippedCount++;
//         continue;
//       }
      
//       // Find the user ID for the assignee
//       const assigneeName = (task as any).assignee;
//       const userId = userMapping[assigneeName];
      
//       if (!userId) {
//         console.warn(`No user found for assignee: ${assigneeName}. Creating default user or skipping.`);
//         // You might want to create a default user or handle this case differently
//         skippedCount++;
//         continue;
//       }
      
//       // Map the old status to new status
//       const oldStatus = (task as any).status;
//       const newStatus = statusMapping[oldStatus as keyof typeof statusMapping] || 'IDEA';
      
//       // Map the old priority to new priority
//       const oldPriority = (task as any).priority;
//       const newPriority = priorityMapping[oldPriority as keyof typeof priorityMapping] || 'C';
      
//       // Update the task with new fields
//       await prisma.task.update({
//         where: { id: task.id },
//         data: {
//           userId: userId,
//           status: newStatus,
//           priority: newPriority,
//           dueDate: task.dueDate || null, // Make dueDate optional
//           isArchived: false
//         }
//       });
      
//       console.log(`Migrated task: ${task.title} (${assigneeName} -> ${userId})`);
//       migratedCount++;
      
//     } catch (error) {
//       console.error(`Failed to migrate task ${task.id}:`, error);
//       skippedCount++;
//     }
//   }
  
//   console.log(`Migration completed: ${migratedCount} migrated, ${skippedCount} skipped`);
// }

// migrateExistingTasks()
//   .catch((e) => {
//     console.error('Migration failed:', e);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });