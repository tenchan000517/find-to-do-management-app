// Phase 2: Financial Risk Hook
// 財務リスク自動監視システム用カスタムフック

import { useState, useCallback, useEffect } from 'react';

export interface CustomerData {
  id: string;
  name: string;
  email: string;
  totalRevenue: number;
  monthlyRevenue: number;
  lastPaymentDate: Date;
  contractValue: number;
  customerSince: Date;
  paymentHistory: PaymentRecord[];
  riskScore: number;
  segment: 'A' | 'B' | 'C' | 'D'; // ABC分析
}

export interface PaymentRecord {
  id: string;
  customerId: string;
  amount: number;
  paymentDate: Date;
  dueDate: Date;
  status: 'paid' | 'pending' | 'overdue' | 'failed';
  invoiceNumber: string;
}

export interface LTVAnalysis {
  customerId: string;
  customerName: string;
  currentLTV: number;
  predictedLTV: number;
  averageOrderValue: number;
  purchaseFrequency: number;
  customerLifespan: number;
  profitMargin: number;
  segment: 'A' | 'B' | 'C' | 'D';
}

export interface RiskAlert {
  id: string;
  type: 'payment_delay' | 'revenue_decline' | 'customer_churn' | 'cash_flow' | 'contract_expiry';
  severity: 'low' | 'medium' | 'high' | 'critical';
  customerId?: string;
  title: string;
  description: string;
  suggestedActions: string[];
  createdAt: Date;
  resolved: boolean;
  impact: number; // 財務インパクト（金額）
}

export interface RevenuePrediction {
  period: string;
  predictedRevenue: number;
  confidenceInterval: {
    low: number;
    high: number;
  };
  factors: {
    seasonality: number;
    trend: number;
    customerBehavior: number;
    marketConditions: number;
  };
}

export interface FinancialMetrics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  customerChurnRate: number;
  customerAcquisitionCost: number;
  paymentDelayRate: number;
  cashFlowHealth: number;
  revenueGrowthRate: number;
}

export interface FinancialRiskFilters {
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  customerSegment?: 'A' | 'B' | 'C' | 'D';
  alertType?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export const useFinancialRisk = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [ltvAnalysis, setLtvAnalysis] = useState<LTVAnalysis[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [revenuePredictions, setRevenuePredictions] = useState<RevenuePrediction[]>([]);
  const [financialMetrics, setFinancialMetrics] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // フィルター状態
  const [filters, setFilters] = useState<FinancialRiskFilters>({});

  // 顧客データの取得
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/financial-risk/customers');
      if (!response.ok) throw new Error('顧客データの取得に失敗しました');
      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, []);

  // LTV分析データの取得
  const fetchLTVAnalysis = useCallback(async () => {
    try {
      const response = await fetch('/api/ltv-analysis');
      if (!response.ok) throw new Error('LTV分析データの取得に失敗しました');
      const data = await response.json();
      setLtvAnalysis(data.analysis || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  }, []);

  // リスクアラートの取得
  const fetchRiskAlerts = useCallback(async () => {
    try {
      const response = await fetch('/api/financial-risk/alerts');
      if (!response.ok) throw new Error('リスクアラートの取得に失敗しました');
      const data = await response.json();
      setRiskAlerts(data.alerts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  }, []);

  // 収益予測の取得
  const fetchRevenuePredictions = useCallback(async () => {
    try {
      const response = await fetch('/api/revenue-prediction');
      if (!response.ok) throw new Error('収益予測データの取得に失敗しました');
      const data = await response.json();
      setRevenuePredictions(data.predictions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  }, []);

  // 財務メトリクスの取得
  const fetchFinancialMetrics = useCallback(async () => {
    try {
      const response = await fetch('/api/financial-risk/metrics');
      if (!response.ok) throw new Error('財務メトリクスの取得に失敗しました');
      const data = await response.json();
      setFinancialMetrics(data.metrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  }, []);

  // 全データの取得
  const fetchAllData = useCallback(async () => {
    await Promise.all([
      fetchCustomers(),
      fetchLTVAnalysis(),
      fetchRiskAlerts(),
      fetchRevenuePredictions(),
      fetchFinancialMetrics()
    ]);
  }, [fetchCustomers, fetchLTVAnalysis, fetchRiskAlerts, fetchRevenuePredictions, fetchFinancialMetrics]);

  // リスクアラートの解決
  const resolveAlert = useCallback(async (alertId: string) => {
    try {
      const response = await fetch(`/api/financial-risk/alerts/${alertId}/resolve`, {
        method: 'PATCH'
      });
      if (!response.ok) throw new Error('アラートの解決に失敗しました');
      
      setRiskAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId ? { ...alert, resolved: true } : alert
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  }, []);

  // 手動でリスク分析を実行
  const runRiskAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/financial-risk/analyze', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('リスク分析の実行に失敗しました');
      
      // 分析完了後、データを再取得
      await fetchAllData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [fetchAllData]);

  // フィルターの更新
  const updateFilters = useCallback((newFilters: Partial<FinancialRiskFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // フィルターのリセット
  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  // フィルター済みアラートの計算
  const filteredAlerts = riskAlerts.filter(alert => {
    if (filters.riskLevel && alert.severity !== filters.riskLevel) return false;
    if (filters.alertType && alert.type !== filters.alertType) return false;
    if (filters.dateRange) {
      const alertDate = new Date(alert.createdAt);
      if (alertDate < filters.dateRange.start || alertDate > filters.dateRange.end) return false;
    }
    return true;
  });

  // フィルター済み顧客の計算
  const filteredCustomers = customers.filter(customer => {
    if (filters.customerSegment && customer.segment !== filters.customerSegment) return false;
    if (filters.riskLevel) {
      const riskLevel = customer.riskScore >= 80 ? 'critical' 
                      : customer.riskScore >= 60 ? 'high'
                      : customer.riskScore >= 40 ? 'medium' : 'low';
      if (riskLevel !== filters.riskLevel) return false;
    }
    return true;
  });

  // 初期データ取得
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    // データ
    customers: filteredCustomers,
    allCustomers: customers,
    ltvAnalysis,
    riskAlerts: filteredAlerts,
    allRiskAlerts: riskAlerts,
    revenuePredictions,
    financialMetrics,
    
    // 状態
    loading,
    error,
    filters,
    
    // アクション
    fetchAllData,
    fetchCustomers,
    fetchLTVAnalysis,
    fetchRiskAlerts,
    fetchRevenuePredictions,
    fetchFinancialMetrics,
    resolveAlert,
    runRiskAnalysis,
    updateFilters,
    resetFilters,
    
    // 計算された値
    totalCustomers: customers.length,
    highRiskCustomers: customers.filter(c => c.riskScore >= 60).length,
    unresolvedAlerts: riskAlerts.filter(a => !a.resolved).length,
    criticalAlerts: riskAlerts.filter(a => a.severity === 'critical' && !a.resolved).length
  };
};