const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCalendarUsers() {
  try {
    // calendar_eventsの担当者分布を確認
    const calendarEvents = await prisma.calendar_events.findMany({
      select: {
        id: true,
        title: true,
        userId: true,
        users: {
          select: {
            name: true
          }
        }
      }
    });
    
    console.log('Calendar Events担当者分布:');
    console.log('========================');
    
    // ユーザーごとにカウント
    const userCounts = {};
    calendarEvents.forEach(event => {
      const userName = event.users?.name || 'Unknown';
      userCounts[userName] = (userCounts[userName] || 0) + 1;
    });
    
    Object.entries(userCounts).forEach(([user, count]) => {
      console.log(`${user}: ${count}件`);
    });
    
    console.log(`\n合計: ${calendarEvents.length}件`);
    
    // タスクの担当者分布も確認
    const tasks = await prisma.tasks.findMany({
      where: {
        dueDate: { not: null }
      },
      select: {
        id: true,
        title: true,
        userId: true,
        users: {
          select: {
            name: true
          }
        }
      }
    });
    
    console.log('\nTasks（期限あり）担当者分布:');
    console.log('===========================');
    
    const taskUserCounts = {};
    tasks.forEach(task => {
      const userName = task.users?.name || 'Unknown';
      taskUserCounts[userName] = (taskUserCounts[userName] || 0) + 1;
    });
    
    Object.entries(taskUserCounts).forEach(([user, count]) => {
      console.log(`${user}: ${count}件`);
    });
    
    console.log(`\n合計: ${tasks.length}件`);
    
    // アポイントメントの関連calendar_eventsも確認
    const appointments = await prisma.appointments.findMany({
      include: {
        calendar_events: {
          select: {
            userId: true,
            users: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });
    
    console.log('\nAppointments関連のCalendar Events担当者分布:');
    console.log('==========================================');
    
    const appoUserCounts = {};
    appointments.forEach(appo => {
      appo.calendar_events.forEach(ce => {
        const userName = ce.users?.name || 'Unknown';
        appoUserCounts[userName] = (appoUserCounts[userName] || 0) + 1;
      });
    });
    
    Object.entries(appoUserCounts).forEach(([user, count]) => {
      console.log(`${user}: ${count}件`);
    });
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCalendarUsers();