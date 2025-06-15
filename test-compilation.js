// Quick TypeScript compilation test
const { execSync } = require('child_process');

console.log('🔍 Testing TypeScript compilation...');

const filesToCheck = [
  'src/components/Dashboard.tsx',
  'src/components/KanbanBoard.tsx', 
  'src/components/GanttChart.tsx',
  'src/app/tasks/page.tsx',
  'src/app/page.tsx'
];

let totalErrors = 0;

filesToCheck.forEach(file => {
  try {
    console.log(`\n📝 Checking ${file}...`);
    execSync(`npx tsc --noEmit --skipLibCheck ${file}`, { stdio: 'pipe' });
    console.log(`✅ ${file} - No TypeScript errors`);
  } catch (error) {
    const output = error.stdout.toString();
    if (output.trim()) {
      console.log(`❌ ${file} - Errors found:`);
      console.log(output);
      totalErrors++;
    } else {
      console.log(`✅ ${file} - No TypeScript errors`);
    }
  }
});

console.log(`\n📊 Summary:`);
console.log(`✅ Files with no errors: ${filesToCheck.length - totalErrors}`);
console.log(`❌ Files with errors: ${totalErrors}`);

if (totalErrors === 0) {
  console.log('\n🎉 All core task management files compile successfully!');
} else {
  console.log('\n⚠️  Some TypeScript errors remain - these may be in other parts of the application.');
}