// ウエイト・リソースベース自動スケジューリング - ユーザーリソースプロファイル型定義
// 学生・社会人・フリーランス等のリソース制約・生活パターンを完全考慮したスケジューリング基盤

export interface UserResourceProfile {
  id: string;
  userId: string;
  
  // 基本属性
  userType: 'student' | 'employee' | 'freelancer' | 'entrepreneur' | 'parent' | 'retiree';
  commitmentRatio: number; // 0.1-1.0 (利用可能時間の割合)
  
  // 容量設定 - ウエイトベース管理の核心
  dailyCapacity: {
    lightTaskSlots: number;    // 軽いタスク可能数/日 (1-10個)
    heavyTaskSlots: number;    // 重いタスク可能数/日 (0-3個)
    totalWeightLimit: number;  // 1日の総ウエイト上限 (5-20)
    continuousWorkHours: number; // 連続作業可能時間 (1-8時間)
  };
  
  // 時間制約 - 従来の時間指定ではなく制約条件として活用
  timeConstraints: {
    unavailableHours: string[];     // 利用不可時間帯 ["09:00-17:00"]
    preferredWorkHours: string[];   // 推奨作業時間帯 ["19:00-22:00"]
    maxWorkingHours: number;        // 1日最大作業時間
  };
  
  // 作業パターン - 個人の生産性パターン考慮
  workingPattern: {
    productiveHours: string[];      // 生産性高い時間帯 ["09:00-11:00"]
    focusCapacity: 'low' | 'medium' | 'high';  // 集中力レベル
    multitaskingAbility: number;   // マルチタスク能力 0.0-1.0
  };
  
  // 個人制約 - 現実的な生活パターンとの統合
  personalConstraints: {
    schoolSchedule?: string[];      // 学生専用: 授業時間
    workingHours?: string[];        // 社会人専用: 勤務時間  
    familyTime?: string[];          // 家族持ち専用: 家族時間
    personalCommitments?: string[]; // その他個人的約束
  };
  
  // 設定・プリファレンス
  preferences: {
    earlyStart: boolean;            // 早朝作業可能
    lateWork: boolean;              // 夜間作業可能
    weekendWork: boolean;           // 週末作業可能
    breakFrequency: 'low' | 'medium' | 'high'; // 休憩頻度
  };
  
  createdAt: string;
  updatedAt: string;
}

// ユーザータイプ別プリセット - 現実的な制約・容量設定
export const USER_TYPE_PRESETS: Record<UserResourceProfile['userType'], Omit<UserResourceProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>> = {
  // 学生: 授業・バイトがあり限定的な時間、軽作業中心
  student: {
    userType: 'student',
    commitmentRatio: 0.3,
    dailyCapacity: {
      lightTaskSlots: 3,        // 宿題・レポート等
      heavyTaskSlots: 1,        // 大きなプロジェクト
      totalWeightLimit: 8,      // 軽めの負荷
      continuousWorkHours: 3    // 集中力考慮
    },
    timeConstraints: {
      unavailableHours: ["09:00-16:00"], // 授業時間
      preferredWorkHours: ["19:00-22:00"], // 夜時間
      maxWorkingHours: 4
    },
    workingPattern: {
      productiveHours: ["20:00-22:00"],
      focusCapacity: 'medium',
      multitaskingAbility: 0.6
    },
    personalConstraints: {},
    preferences: {
      earlyStart: false,
      lateWork: true,
      weekendWork: true,
      breakFrequency: 'high'
    }
  },
  
  // 社会人: 勤務時間固定、夜・週末の限られた時間
  employee: {
    userType: 'employee',
    commitmentRatio: 0.6,
    dailyCapacity: {
      lightTaskSlots: 4,        // 平日夜の作業
      heavyTaskSlots: 2,        // 週末の大作業
      totalWeightLimit: 12,     // 中程度の負荷
      continuousWorkHours: 4    // 仕事後の疲労考慮
    },
    timeConstraints: {
      unavailableHours: ["09:00-18:00"], // 勤務時間
      preferredWorkHours: ["19:00-21:00"], // 夜時間
      maxWorkingHours: 3
    },
    workingPattern: {
      productiveHours: ["07:00-08:00", "19:00-20:00"],
      focusCapacity: 'medium',
      multitaskingAbility: 0.7
    },
    personalConstraints: {},
    preferences: {
      earlyStart: true,
      lateWork: false,
      weekendWork: true,
      breakFrequency: 'medium'
    }
  },
  
  // フリーランス: 自由度高い、重作業も可能
  freelancer: {
    userType: 'freelancer',
    commitmentRatio: 0.8,
    dailyCapacity: {
      lightTaskSlots: 6,        // 高い作業量
      heavyTaskSlots: 3,        // 複数の重作業
      totalWeightLimit: 18,     // 高負荷対応
      continuousWorkHours: 6    // 長時間集中可能
    },
    timeConstraints: {
      unavailableHours: [],     // 制約なし
      preferredWorkHours: ["09:00-18:00"], // 通常業務時間
      maxWorkingHours: 8
    },
    workingPattern: {
      productiveHours: ["09:00-12:00", "14:00-17:00"],
      focusCapacity: 'high',
      multitaskingAbility: 0.8
    },
    personalConstraints: {},
    preferences: {
      earlyStart: true,
      lateWork: true,
      weekendWork: false, // 週末は休息
      breakFrequency: 'low'
    }
  },
  
  // 起業家: 高負荷、柔軟性、長時間作業可能
  entrepreneur: {
    userType: 'entrepreneur',
    commitmentRatio: 0.9,
    dailyCapacity: {
      lightTaskSlots: 8,        // 多数の軽作業
      heavyTaskSlots: 3,        // 重要な戦略作業
      totalWeightLimit: 20,     // 最高負荷
      continuousWorkHours: 8    // 最長作業時間
    },
    timeConstraints: {
      unavailableHours: [],
      preferredWorkHours: ["06:00-22:00"], // 長時間
      maxWorkingHours: 12
    },
    workingPattern: {
      productiveHours: ["06:00-09:00", "14:00-18:00"],
      focusCapacity: 'high',
      multitaskingAbility: 0.9
    },
    personalConstraints: {},
    preferences: {
      earlyStart: true,
      lateWork: true,
      weekendWork: true,
      breakFrequency: 'low'
    }
  },
  
  // 親: 子供の時間考慮、制約多い
  parent: {
    userType: 'parent',
    commitmentRatio: 0.4,
    dailyCapacity: {
      lightTaskSlots: 3,
      heavyTaskSlots: 1,
      totalWeightLimit: 10,
      continuousWorkHours: 2    // 中断が多い
    },
    timeConstraints: {
      unavailableHours: ["07:00-09:00", "15:00-19:00"], // 子供の時間
      preferredWorkHours: ["21:00-23:00"], // 子供就寝後
      maxWorkingHours: 3
    },
    workingPattern: {
      productiveHours: ["21:00-23:00"],
      focusCapacity: 'low', // 疲労考慮
      multitaskingAbility: 0.9 // 親は高いマルチタスク能力
    },
    personalConstraints: {},
    preferences: {
      earlyStart: false,
      lateWork: true,
      weekendWork: false, // 家族時間優先
      breakFrequency: 'high'
    }
  },
  
  // 退職者: 時間余裕あり、軽作業中心
  retiree: {
    userType: 'retiree',
    commitmentRatio: 0.5,
    dailyCapacity: {
      lightTaskSlots: 4,
      heavyTaskSlots: 1,
      totalWeightLimit: 8,
      continuousWorkHours: 3
    },
    timeConstraints: {
      unavailableHours: [],
      preferredWorkHours: ["09:00-12:00", "14:00-16:00"],
      maxWorkingHours: 5
    },
    workingPattern: {
      productiveHours: ["09:00-11:00", "14:00-15:00"],
      focusCapacity: 'medium',
      multitaskingAbility: 0.5
    },
    personalConstraints: {},
    preferences: {
      earlyStart: true,
      lateWork: false,
      weekendWork: false,
      breakFrequency: 'high'
    }
  }
};

// バリデーション関数
export function validateUserResourceProfile(profile: Partial<UserResourceProfile>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // 必須フィールドチェック
  if (!profile.userType) {
    errors.push('ユーザータイプは必須です');
  }
  
  // commitmentRatio チェック
  if (profile.commitmentRatio !== undefined) {
    if (profile.commitmentRatio < 0.1 || profile.commitmentRatio > 1.0) {
      errors.push('利用可能時間割合は0.1-1.0の範囲で設定してください');
    }
  }
  
  // dailyCapacity チェック
  if (profile.dailyCapacity) {
    const { lightTaskSlots, heavyTaskSlots, totalWeightLimit, continuousWorkHours } = profile.dailyCapacity;
    
    if (lightTaskSlots !== undefined && (lightTaskSlots < 1 || lightTaskSlots > 10)) {
      errors.push('軽いタスク数は1-10の範囲で設定してください');
    }
    
    if (heavyTaskSlots !== undefined && (heavyTaskSlots < 0 || heavyTaskSlots > 5)) {
      errors.push('重いタスク数は0-5の範囲で設定してください');
    }
    
    if (totalWeightLimit !== undefined && (totalWeightLimit < 5 || totalWeightLimit > 25)) {
      errors.push('総ウエイト上限は5-25の範囲で設定してください');
    }
    
    if (continuousWorkHours !== undefined && (continuousWorkHours < 1 || continuousWorkHours > 12)) {
      errors.push('連続作業時間は1-12時間の範囲で設定してください');
    }
  }
  
  // timeConstraints チェック
  if (profile.timeConstraints) {
    const { maxWorkingHours } = profile.timeConstraints;
    
    if (maxWorkingHours !== undefined && (maxWorkingHours < 1 || maxWorkingHours > 16)) {
      errors.push('最大作業時間は1-16時間の範囲で設定してください');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// プリセット適用関数
export function applyUserTypePreset(
  userType: UserResourceProfile['userType'],
  customOverrides?: Partial<UserResourceProfile>
): Partial<UserResourceProfile> {
  const preset = USER_TYPE_PRESETS[userType];
  if (!preset) {
    throw new Error(`Unknown user type: ${userType}`);
  }
  
  return {
    ...preset,
    userType,
    ...customOverrides,
    // 深いマージが必要なオブジェクト
    dailyCapacity: {
      ...preset.dailyCapacity,
      ...customOverrides?.dailyCapacity
    },
    timeConstraints: {
      ...preset.timeConstraints,
      ...customOverrides?.timeConstraints
    },
    workingPattern: {
      ...preset.workingPattern,
      ...customOverrides?.workingPattern
    },
    personalConstraints: {
      ...preset.personalConstraints,
      ...customOverrides?.personalConstraints
    },
    preferences: {
      ...preset.preferences,
      ...customOverrides?.preferences
    }
  };
}

// ユーザープロファイル作成ヘルパー
export function createUserResourceProfile(
  userId: string,
  userType: UserResourceProfile['userType'],
  customSettings?: Partial<UserResourceProfile>
): UserResourceProfile {
  const baseProfile = applyUserTypePreset(userType, customSettings);
  const now = new Date().toISOString();
  
  return {
    id: `profile_${userId}_${Date.now()}`,
    userId,
    userType,
    commitmentRatio: baseProfile.commitmentRatio!,
    dailyCapacity: baseProfile.dailyCapacity!,
    timeConstraints: baseProfile.timeConstraints!,
    workingPattern: baseProfile.workingPattern!,
    personalConstraints: baseProfile.personalConstraints || {},
    preferences: baseProfile.preferences!,
    createdAt: now,
    updatedAt: now,
    ...customSettings
  };
}

// 利用状況計算ヘルパー
export function calculateResourceUtilization(
  profile: UserResourceProfile,
  currentWeight: number,
  currentTaskCount: { light: number; heavy: number }
): {
  weightUtilization: number;    // 0-1
  lightTaskUtilization: number; // 0-1
  heavyTaskUtilization: number; // 0-1
  overloadRisk: 'low' | 'medium' | 'high';
  recommendations: string[];
} {
  const weightUtil = currentWeight / profile.dailyCapacity.totalWeightLimit;
  const lightUtil = currentTaskCount.light / profile.dailyCapacity.lightTaskSlots;
  const heavyUtil = currentTaskCount.heavy / profile.dailyCapacity.heavyTaskSlots;
  
  let overloadRisk: 'low' | 'medium' | 'high' = 'low';
  const recommendations: string[] = [];
  
  if (weightUtil > 0.9 || lightUtil > 0.9 || heavyUtil > 0.9) {
    overloadRisk = 'high';
    recommendations.push('容量限界に近づいています。新しいタスクの追加は控えることをお勧めします。');
  } else if (weightUtil > 0.7 || lightUtil > 0.7 || heavyUtil > 0.7) {
    overloadRisk = 'medium';
    recommendations.push('やや負荷が高めです。重要でないタスクは後回しにすることを検討してください。');
  }
  
  if (heavyUtil > lightUtil + 0.3) {
    recommendations.push('重いタスクの割合が高いです。軽いタスクでバランスを取ることをお勧めします。');
  }
  
  return {
    weightUtilization: weightUtil,
    lightTaskUtilization: lightUtil,
    heavyTaskUtilization: heavyUtil,
    overloadRisk,
    recommendations
  };
}