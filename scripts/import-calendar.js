const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function mapTypeToEnum(type) {
  switch (type) {
    case 'オンラインミーティング':
    case '対面':
      return 'MEETING';
    case '企業イベント':
    case '学生イベント':
    case '自社イベント':
    case 'コミュニティイベント':
      return 'EVENT';
    case 'イベント告知日':
      return 'DEADLINE';
    default:
      return 'EVENT';
  }
}

function parseJapaneseDate(dateStr) {
  // Handle date ranges like "2025年6月6日 - 2025年8月16日"
  if (dateStr.includes(' - ')) {
    dateStr = dateStr.split(' - ')[0]; // Take the start date
  }
  
  // Parse Japanese date format "2025年6月6日"
  const match = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (match) {
    const year = match[1];
    const month = match[2].padStart(2, '0');
    const day = match[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Fallback to current date if parsing fails
  return new Date().toISOString().split('T')[0];
}

async function importCalendarEvents() {
  try {
    const calendarData = JSON.parse(fs.readFileSync(path.join(__dirname, '../calender.json'), 'utf8'));
    
    console.log('Importing calendar events...');
    
    for (const event of calendarData.events) {
      const parsedDate = parseJapaneseDate(event.date);
      
      await prisma.calendarEvent.create({
        data: {
          title: event.name,
          date: parsedDate,
          time: '10:00', // Default time since not specified in data
          type: mapTypeToEnum(event.type),
          description: event.organizer ? `主催者: ${event.organizer}` : (event.format || ''),
          location: event.type === '対面' ? 'オフィス' : (event.type === 'オンラインミーティング' ? 'オンライン' : ''),
          participants: event.organizer ? [event.organizer] : []
        }
      });
    }
    
    console.log(`Successfully imported ${calendarData.events.length} calendar events`);
  } catch (error) {
    console.error('Error importing calendar events:', error);
  }
}

async function main() {
  try {
    console.log('Starting calendar data import...');
    
    await importCalendarEvents();
    
    console.log('Calendar data import completed successfully!');
  } catch (error) {
    console.error('Error during import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();