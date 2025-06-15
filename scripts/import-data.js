const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function mapCategoryToType(category) {
  switch (category) {
    case '学生':
      return 'STUDENT';
    case '企業':
    case '行政':
    default:
      return 'COMPANY';
  }
}

function mapStatusToEnum(status) {
  switch (status) {
    case '進行中':
      return 'ACTIVE';
    case '完了':
      return 'COMPLETED';
    case '未着手':
      return 'PLANNING';
    default:
      return 'PLANNING';
  }
}

function mapPriorityToEnum(priority) {
  switch (priority) {
    case '高':
      return 'HIGH';
    case '中':
      return 'MEDIUM';
    case '低':
      return 'LOW';
    default:
      return 'MEDIUM';
  }
}

async function importConnections() {
  try {
    const connectionData = JSON.parse(fs.readFileSync(path.join(__dirname, '../connection.json'), 'utf8'));
    
    console.log('Importing connections...');
    
    for (const contact of connectionData.contacts) {
      await prisma.connection.create({
        data: {
          name: contact.name,
          company: contact.company || '',
          position: contact.position || '',
          type: mapCategoryToType(contact.category),
          date: contact.date || new Date().toISOString().split('T')[0],
          location: contact.connection || '',
          description: contact.notes || '',
          conversation: contact.additional_info || '',
          potential: contact.connection || '',
          businessCard: null
        }
      });
    }
    
    console.log(`Successfully imported ${connectionData.contacts.length} connections`);
  } catch (error) {
    console.error('Error importing connections:', error);
  }
}

async function importProjects() {
  try {
    const projectData = JSON.parse(fs.readFileSync(path.join(__dirname, '../projects.json'), 'utf8'));
    
    console.log('Importing projects...');
    
    for (const project of projectData.projects) {
      await prisma.project.create({
        data: {
          name: project.project_name,
          description: project.content || '',
          status: mapStatusToEnum(project.status),
          progress: project.progress_percentage || 0,
          startDate: project.start_date || new Date().toISOString().split('T')[0],
          endDate: project.end_date || null,
          teamMembers: project.assignee ? [project.assignee] : [],
          priority: mapPriorityToEnum(project.priority)
        }
      });
    }
    
    console.log(`Successfully imported ${projectData.projects.length} projects`);
  } catch (error) {
    console.error('Error importing projects:', error);
  }
}

async function main() {
  try {
    console.log('Starting data import...');
    
    await importConnections();
    await importProjects();
    
    console.log('Data import completed successfully!');
  } catch (error) {
    console.error('Error during import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();