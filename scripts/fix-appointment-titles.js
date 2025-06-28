#!/usr/bin/env node

// 既存アポイントメント由来のcalendar_eventsのタイトルを修正するスクリプト

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 日付表現を除去してタイトル生成
function generateCleanTitle(notes) {
  if (!notes) return null;
  
  let cleanTitle = notes
    // より具体的な日付・時刻パターンを除去
    .replace(/(明日|明後日|明々後日|今日|きょう|あした|あさって|しあさって)(の|に)?\s*(\d{1,2}時\d{0,2}分?|\d{1,2}:\d{2})?\s*(に|で|から)?/g, '')
    .replace(/\d{1,2}\/\d{1,2}\s*(に|で|から)?/g, '')
    .replace(/\d{1,2}日後\s*(に|で|から)?/g, '')
    .replace(/(来週|再来週|先週)\s*(の|に)?\s*(火曜日|水曜日|木曜日|金曜日|土曜日|日曜日|月曜日)?\s*(に|で|から)?/g, '')
    .replace(/\d+週間後\s*(に|で|から)?/g, '')
    // 単独の時刻表現
    .replace(/\d{1,2}:\d{2}\s*(に|で|から)?/g, '')
    .replace(/\d{1,2}時\d{0,2}分?\s*(に|で|から)?/g, '')
    // 残った助詞を除去
    .replace(/^\s*(の|に|と|で|から|まで|は)\s*/g, '')
    .replace(/\s*(の|に|と|で|から|まで|は)\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (cleanTitle && cleanTitle.length > 2) {
    return `🤝 ${cleanTitle}`;
  }
  
  return null;
}

async function fixAppointmentTitles() {
  const result = {
    totalEvents: 0,
    fixedTitles: 0,
    skipped: 0,
    errors: []
  };

  try {
    console.log('🔄 アポイントメント由来のカレンダーイベントタイトル修正を開始...');

    // アポイントメント由来のcalendar_eventsを取得
    const events = await prisma.calendar_events.findMany({
      where: {
        appointmentId: { not: null },
        category: 'APPOINTMENT'
      },
      include: {
        appointments: true
      }
    });

    result.totalEvents = events.length;
    console.log(`📊 修正対象イベント: ${result.totalEvents}件`);

    if (result.totalEvents === 0) {
      console.log('✅ 修正対象のイベントはありません');
      return result;
    }

    for (const event of events) {
      try {
        console.log(`\n📝 イベント処理中: ${event.id}`);
        console.log(`   現在のタイトル: ${event.title}`);
        
        if (event.appointments && event.appointments.notes) {
          const notes = event.appointments.notes;
          console.log(`   アポイントメントのメモ: ${notes}`);
          
          const newTitle = generateCleanTitle(notes);
          
          if (newTitle && newTitle !== event.title) {
            await prisma.calendar_events.update({
              where: { id: event.id },
              data: { title: newTitle }
            });
            
            result.fixedTitles++;
            console.log(`   ✅ タイトル修正完了: ${newTitle}`);
          } else {
            result.skipped++;
            console.log(`   ⏭️ 修正不要またはタイトル生成失敗`);
          }
        } else {
          result.skipped++;
          console.log(`   ⏭️ 関連アポイントメントまたはメモなし`);
        }

        // 処理間隔を設ける
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        result.errors.push({
          eventId: event.id,
          error: error.message
        });
        console.error(`   ❌ 修正失敗: ${error.message}`);
      }
    }

    // 結果サマリー
    console.log('\n📊 修正結果サマリー:');
    console.log(`   総件数: ${result.totalEvents}`);
    console.log(`   修正: ${result.fixedTitles}`);
    console.log(`   スキップ: ${result.skipped}`);
    console.log(`   失敗: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\n❌ エラー詳細:');
      result.errors.forEach(err => {
        console.log(`   ${err.eventId}: ${err.error}`);
      });
    }

    console.log('\n✅ タイトル修正処理完了');
    return result;

  } catch (error) {
    console.error('❌ 修正処理中にエラーが発生:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// テスト用: タイトル生成ロジックのテスト
function testTitleGeneration() {
  const testCases = [
    '明後日佐藤さんと打ち合わせ',
    '明日田中さんとの商談',
    '今日の15時にABC会社との会議',
    '6/25に山田さんと面談',
    '来週の火曜日にプレゼン',
    '2週間後に契約締結'
  ];

  console.log('🧪 タイトル生成テスト:');
  testCases.forEach(notes => {
    const title = generateCleanTitle(notes);
    console.log(`   "${notes}" → "${title}"`);
  });
}

// メイン実行
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    testTitleGeneration();
  } else {
    fixAppointmentTitles().catch(console.error);
  }
}

module.exports = { fixAppointmentTitles, generateCleanTitle };