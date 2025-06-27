#!/usr/bin/env ts-node

// 既存アポイントメントデータをcalendar_eventsに移行するスクリプト

import { PrismaClient } from '@prisma/client';
import { DateTimeParser } from '../src/lib/line/datetime-parser';

const prisma = new PrismaClient();
const parser = new DateTimeParser();

interface MigrationResult {
  totalAppointments: number;
  successfulMigrations: number;
  skippedDuplicates: number;
  failedMigrations: number;
  errors: Array<{ appointmentId: string; error: string }>;
}

async function migrateAppointmentsToCalendar(): Promise<MigrationResult> {
  const result: MigrationResult = {
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
          none: {} // calendar_eventsが関連付けられていないもの
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
        let appointmentDate: string | undefined;
        let appointmentTime: string | undefined;

        if (appointment.notes) {
          try {
            const parsed = await parser.parse(appointment.notes);
            
            if (parsed.confidence >= 0.5) {
              appointmentDate = parsed.date;
              appointmentTime = parsed.time;
              console.log(`   📅 日付解析成功: ${appointmentDate} ${appointmentTime} (confidence: ${parsed.confidence})`);
            } else {
              console.log(`   ⚠️ 日付解析信頼度不足: confidence ${parsed.confidence}`);
            }
          } catch (parseError) {
            console.log(`   ❌ 日付解析失敗: ${parseError}`);
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
              description: appointment.notes,
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

        // 処理間隔を設ける（APIレート制限対策）
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        result.failedMigrations++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.errors.push({
          appointmentId: appointment.id,
          error: errorMessage
        });
        console.error(`   ❌ 移行失敗: ${errorMessage}`);
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
async function verifyMigration(): Promise<void> {
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
  const dryRun = args.includes('--dry-run');
  const verify = args.includes('--verify');

  if (verify) {
    verifyMigration().catch(console.error);
  } else if (dryRun) {
    console.log('🧪 DRY RUN モード: 実際の変更は行いません');
    // TODO: DRY RUN実装
  } else {
    migrateAppointmentsToCalendar().catch(console.error);
  }
}

export { migrateAppointmentsToCalendar, verifyMigration };