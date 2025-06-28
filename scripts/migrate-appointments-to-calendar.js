#!/usr/bin/env node

// 既存アポイントメントデータをcalendar_eventsに移行するスクリプト

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// 簡易日付解析関数（datetime-parser.tsの基本機能を移植）
function parseDateTime(text) {
  if (!text) return null;

  const normalizedText = text
    .replace(/：/g, ':')
    .replace(/[０-９]/g, function(s) {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    })
    .replace(/あした|アシタ/g, '明日')
    .replace(/きょう|キョウ/g, '今日')
    .replace(/あさって|アサッテ/g, '明後日')
    .replace(/しあさって|シアサッテ/g, '明々後日')
    .replace(/明明後日/g, '明々後日')
    .trim();

  const today = new Date();
  const jstOffset = 9 * 60;
  const utc = today.getTime() + (today.getTimezoneOffset() * 60000);
  const jstDate = new Date(utc + (jstOffset * 60000));

  // 明日
  if (/明日/.test(normalizedText)) {
    const tomorrow = new Date(jstDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const timeMatch = normalizedText.match(/(\d{1,2})(?:時|:(\d{2}))?/);
    const time = timeMatch 
      ? `${timeMatch[1].padStart(2, '0')}:${(timeMatch[2] || '00').padStart(2, '0')}`
      : '00:00';
    
    return {
      date: tomorrow.toISOString().split('T')[0],
      time: time,
      confidence: 0.85
    };
  }

  // 明後日
  if (/明後日/.test(normalizedText)) {
    const dayAfterTomorrow = new Date(jstDate);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    
    const timeMatch = normalizedText.match(/(\d{1,2})(?:時|:(\d{2}))?/);
    const time = timeMatch 
      ? `${timeMatch[1].padStart(2, '0')}:${(timeMatch[2] || '00').padStart(2, '0')}`
      : '00:00';
    
    return {
      date: dayAfterTomorrow.toISOString().split('T')[0],
      time: time,
      confidence: 0.85
    };
  }

  // 明々後日
  if (/明々後日/.test(normalizedText)) {
    const threeDaysLater = new Date(jstDate);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    
    const timeMatch = normalizedText.match(/(\d{1,2})(?:時|:(\d{2}))?/);
    const time = timeMatch 
      ? `${timeMatch[1].padStart(2, '0')}:${(timeMatch[2] || '00').padStart(2, '0')}`
      : '00:00';
    
    return {
      date: threeDaysLater.toISOString().split('T')[0],
      time: time,
      confidence: 0.85
    };
  }

  // 今日
  if (/今日/.test(normalizedText)) {
    const timeMatch = normalizedText.match(/(\d{1,2})(?:時|:(\d{2}))?/);
    const time = timeMatch 
      ? `${timeMatch[1].padStart(2, '0')}:${(timeMatch[2] || '00').padStart(2, '0')}`
      : '00:00';
    
    return {
      date: jstDate.toISOString().split('T')[0],
      time: time,
      confidence: 0.85
    };
  }

  // スラッシュ区切り (例: 6/21)
  const slashMatch = normalizedText.match(/(\d{1,2})\/(\d{1,2})/);
  if (slashMatch) {
    const month = parseInt(slashMatch[1]);
    const day = parseInt(slashMatch[2]);
    const currentYear = jstDate.getFullYear();
    const targetDate = new Date(currentYear, month - 1, day);
    
    if (targetDate < jstDate) {
      targetDate.setFullYear(currentYear + 1);
    }
    
    const timeMatch = normalizedText.match(/(\d{1,2})(?:時|:(\d{2}))?/);
    const time = timeMatch 
      ? `${timeMatch[1].padStart(2, '0')}:${(timeMatch[2] || '00').padStart(2, '0')}`
      : '00:00';
    
    return {
      date: targetDate.toISOString().split('T')[0],
      time: time,
      confidence: 0.8
    };
  }

  return null;
}

async function migrateAppointmentsToCalendar() {
  const result = {
    totalAppointments: 0,
    successfulMigrations: 0,
    skippedDuplicates: 0,
    failedMigrations: 0,
    errors: []
  };

  try {
    console.log('🔄 既存アポイントメントデータの移行を開始...');

    // calendar_eventsが未作成のアポイントメントを取得
    const appointments = await prisma.appointments.findMany({
      where: {
        calendar_events: {
          none: {}
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    result.totalAppointments = appointments.length;
    console.log(`📊 移行対象アポイントメント: ${result.totalAppointments}件`);

    if (result.totalAppointments === 0) {
      console.log('✅ 移行対象のアポイントメントはありません');
      return result;
    }

    for (const appointment of appointments) {
      try {
        console.log(`\n📝 アポイントメント処理中: ${appointment.id}`);
        console.log(`   会社: ${appointment.companyName}`);
        console.log(`   メモ: ${appointment.notes}`);

        // notesフィールドから日付情報を解析
        let appointmentDate = undefined;
        let appointmentTime = undefined;

        if (appointment.notes) {
          const parsed = parseDateTime(appointment.notes);
          
          if (parsed && parsed.confidence >= 0.5) {
            appointmentDate = parsed.date;
            appointmentTime = parsed.time;
            console.log(`   📅 日付解析成功: ${appointmentDate} ${appointmentTime} (confidence: ${parsed.confidence})`);
          } else {
            console.log(`   ⚠️ 日付解析失敗または信頼度不足`);
          }
        }

        // 日付が解析できた場合のみcalendar_eventsを作成
        if (appointmentDate) {
          const calendarEventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          await prisma.calendar_events.create({
            data: {
              id: calendarEventId,
              title: `🤝 ${appointment.companyName}との打ち合わせ`,
              date: appointmentDate,
              time: appointmentTime || '00:00',
              type: 'MEETING',
              category: 'APPOINTMENT',
              description: appointment.notes || '',
              appointmentId: appointment.id,
              createdBy: appointment.createdBy || appointment.assignedTo || 'user1',
              assignedTo: appointment.assignedTo || appointment.createdBy || 'user1',
            },
          });

          // appointmentsテーブルのlastContactも更新
          await prisma.appointments.update({
            where: { id: appointment.id },
            data: { lastContact: appointmentDate }
          });

          result.successfulMigrations++;
          console.log(`   ✅ calendar_event作成完了: ${calendarEventId}`);
        } else {
          console.log(`   ⏭️ 日付情報なし - スキップ`);
          result.skippedDuplicates++;
        }

        // 処理間隔を設ける
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        result.failedMigrations++;
        result.errors.push({
          appointmentId: appointment.id,
          error: error.message
        });
        console.error(`   ❌ 移行失敗: ${error.message}`);
      }
    }

    // 結果サマリー
    console.log('\n📊 移行結果サマリー:');
    console.log(`   総件数: ${result.totalAppointments}`);
    console.log(`   成功: ${result.successfulMigrations}`);
    console.log(`   スキップ: ${result.skippedDuplicates}`);
    console.log(`   失敗: ${result.failedMigrations}`);

    if (result.errors.length > 0) {
      console.log('\n❌ エラー詳細:');
      result.errors.forEach(err => {
        console.log(`   ${err.appointmentId}: ${err.error}`);
      });
    }

    console.log('\n✅ 移行処理完了');
    return result;

  } catch (error) {
    console.error('❌ 移行処理中にエラーが発生:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 検証用: 移行後の状態確認
async function verifyMigration() {
  try {
    console.log('\n🔍 移行結果の検証...');

    const appointmentsWithEvents = await prisma.appointments.count({
      where: {
        calendar_events: {
          some: {}
        }
      }
    });

    const appointmentsWithoutEvents = await prisma.appointments.count({
      where: {
        calendar_events: {
          none: {}
        }
      }
    });

    const totalCalendarEvents = await prisma.calendar_events.count({
      where: {
        appointmentId: { not: null }
      }
    });

    console.log('📊 移行後の状態:');
    console.log(`   calendar_eventsありのアポイントメント: ${appointmentsWithEvents}件`);
    console.log(`   calendar_eventsなしのアポイントメント: ${appointmentsWithoutEvents}件`);
    console.log(`   アポイントメント由来のcalendar_events: ${totalCalendarEvents}件`);

  } catch (error) {
    console.error('❌ 検証エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// メイン実行
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--verify')) {
    verifyMigration().catch(console.error);
  } else {
    migrateAppointmentsToCalendar().catch(console.error);
  }
}

module.exports = { migrateAppointmentsToCalendar, verifyMigration };