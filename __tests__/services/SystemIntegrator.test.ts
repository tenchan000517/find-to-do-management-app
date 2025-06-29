import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SystemIntegrator } from '@/services/SystemIntegrator';

jest.mock('@/lib/database/prisma', () => ({
  prisma: {
    user: {
      count: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    studentResource: {
      count: jest.fn(),
    },
    customerLtvAnalysis: {
      count: jest.fn(),
    },
    projectTemplate: {
      count: jest.fn(),
    },
    knowledgeItem: {
      count: jest.fn(),
    },
    project: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    connection: {
      count: jest.fn(),
    },
    appointment: {
      count: jest.fn(),
    },
    salesProcessState: {
      count: jest.fn(),
    },
    contractDetails: {
      count: jest.fn(),
    },
    salesConversionMetrics: {
      count: jest.fn(),
    },
  },
}));

describe('SystemIntegrator', () => {
  let systemIntegrator: SystemIntegrator;

  beforeEach(() => {
    systemIntegrator = new SystemIntegrator();
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = SystemIntegrator.getInstance();
      const instance2 = SystemIntegrator.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('validateSystemIntegration', () => {
    it('should validate all phases successfully', async () => {
      const mockPrisma = jest.requireMock('@/lib/database/prisma').prisma;
      
      mockPrisma.user.count.mockResolvedValue(5);
      mockPrisma.studentResource.count.mockResolvedValue(3);
      mockPrisma.customerLtvAnalysis.count.mockResolvedValue(2);
      mockPrisma.projectTemplate.count.mockResolvedValue(1);
      mockPrisma.knowledgeItem.count.mockResolvedValue(10);
      mockPrisma.project.count.mockResolvedValue(5);
      mockPrisma.project.findMany.mockResolvedValue([{ id: 1 }]);
      mockPrisma.connection.count.mockResolvedValue(8);
      mockPrisma.appointment.count.mockResolvedValue(4);
      mockPrisma.salesProcessState.count.mockResolvedValue(3);
      mockPrisma.contractDetails.count.mockResolvedValue(2);
      mockPrisma.salesConversionMetrics.count.mockResolvedValue(1);
      mockPrisma.user.findFirst.mockResolvedValue({ id: 1 });

      const result = await systemIntegrator.validateSystemIntegration();

      expect(result).toHaveProperty('phase1');
      expect(result).toHaveProperty('phase2');
      expect(result).toHaveProperty('phase3');
      expect(result).toHaveProperty('phase4');
      expect(result).toHaveProperty('overall');
      
      expect(result.phase1.studentResourceManager).toBe(true);
      expect(result.phase2.ltvAnalyzer).toBe(true);
      expect(result.phase3.reachCalculator).toBe(true);
      expect(result.phase4.nlpProcessor).toBe(true);
    });

    it('should handle validation errors gracefully', async () => {
      const mockPrisma = jest.requireMock('@/lib/database/prisma').prisma;
      mockPrisma.user.count.mockRejectedValue(new Error('Database error'));

      const result = await systemIntegrator.validateSystemIntegration();

      expect(result.phase1.studentResourceManager).toBe(false);
    });
  });

  describe('optimizeSystemPerformance', () => {
    it('should optimize system performance and return metrics', async () => {
      const mockPrisma = jest.requireMock('@/lib/database/prisma').prisma;
      mockPrisma.user.findFirst.mockResolvedValue({ id: 1 });

      const result = await systemIntegrator.optimizeSystemPerformance();

      expect(result).toHaveProperty('responseTime');
      expect(result).toHaveProperty('throughput');
      expect(result).toHaveProperty('reliability');
      expect(result).toHaveProperty('scalability');
      
      expect(result.responseTime.api).toBeGreaterThan(0);
      expect(result.reliability.uptime).toBeGreaterThan(0.9);
    });
  });

  describe('implementDataConsistency', () => {
    it('should implement data consistency system', async () => {
      const result = await systemIntegrator.implementDataConsistency();

      expect(result).toHaveProperty('syncRules');
      expect(result).toHaveProperty('consistencyChecks');
      expect(result).toHaveProperty('repairMechanisms');
      
      expect(Array.isArray(result.syncRules)).toBe(true);
      expect(Array.isArray(result.consistencyChecks)).toBe(true);
      expect(Array.isArray(result.repairMechanisms)).toBe(true);
      
      expect(result.syncRules.length).toBeGreaterThan(0);
      expect(result.consistencyChecks.length).toBeGreaterThan(0);
      expect(result.repairMechanisms.length).toBeGreaterThan(0);
    });

    it('should have proper sync rule structure', async () => {
      const result = await systemIntegrator.implementDataConsistency();
      
      const firstSyncRule = result.syncRules[0];
      expect(firstSyncRule).toHaveProperty('source');
      expect(firstSyncRule).toHaveProperty('target');
      expect(firstSyncRule).toHaveProperty('frequency');
      expect(firstSyncRule).toHaveProperty('validation');
    });
  });

  describe('getSystemStatus', () => {
    it('should return comprehensive system status', async () => {
      const mockPrisma = jest.requireMock('@/lib/database/prisma').prisma;
      
      mockPrisma.user.count.mockResolvedValue(5);
      mockPrisma.studentResource.count.mockResolvedValue(3);
      mockPrisma.customerLtvAnalysis.count.mockResolvedValue(2);
      mockPrisma.projectTemplate.count.mockResolvedValue(1);
      mockPrisma.knowledgeItem.count.mockResolvedValue(10);
      mockPrisma.project.count.mockResolvedValue(5);
      mockPrisma.project.findMany.mockResolvedValue([{ id: 1 }]);
      mockPrisma.connection.count.mockResolvedValue(8);
      mockPrisma.appointment.count.mockResolvedValue(4);
      mockPrisma.salesProcessState.count.mockResolvedValue(3);
      mockPrisma.contractDetails.count.mockResolvedValue(2);
      mockPrisma.salesConversionMetrics.count.mockResolvedValue(1);
      mockPrisma.user.findFirst.mockResolvedValue({ id: 1 });

      const result = await systemIntegrator.getSystemStatus();

      expect(result).toHaveProperty('integration');
      expect(result).toHaveProperty('performance');
      expect(result).toHaveProperty('health');
      expect(result).toHaveProperty('lastCheck');
      
      expect(typeof result.health).toBe('number');
      expect(result.health).toBeGreaterThanOrEqual(0);
      expect(result.health).toBeLessThanOrEqual(1);
      expect(result.lastCheck).toBeInstanceOf(Date);
    });
  });

  describe('Performance Metrics', () => {
    it('should measure performance within acceptable ranges', async () => {
      const mockPrisma = jest.requireMock('@/lib/database/prisma').prisma;
      mockPrisma.user.findFirst.mockResolvedValue({ id: 1 });

      const metrics = await systemIntegrator.optimizeSystemPerformance();

      expect(metrics.responseTime.api).toBeLessThan(10000);
      expect(metrics.throughput.concurrent_users).toBeGreaterThan(0);
      expect(metrics.reliability.uptime).toBeGreaterThan(0.9);
      expect(metrics.scalability.user_capacity).toBeGreaterThan(100);
    });
  });

  describe('Data Consistency', () => {
    it('should define comprehensive sync rules', async () => {
      const result = await systemIntegrator.implementDataConsistency();
      
      const mbtiSyncRule = result.syncRules.find(rule => 
        rule.source === 'users.mbti_type'
      );
      
      expect(mbtiSyncRule).toBeDefined();
      expect(mbtiSyncRule?.target).toBe('student_resources.technical_skills');
      expect(mbtiSyncRule?.frequency).toBe('IMMEDIATE');
    });

    it('should include repair mechanisms for common issues', async () => {
      const result = await systemIntegrator.implementDataConsistency();
      
      const mbtiRepair = result.repairMechanisms.find(mechanism =>
        mechanism.issue.includes('MBTI')
      );
      
      expect(mbtiRepair).toBeDefined();
      expect(mbtiRepair?.automated).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const mockPrisma = jest.requireMock('@/lib/database/prisma').prisma;
      mockPrisma.user.findFirst.mockRejectedValue(new Error('Connection failed'));

      await expect(systemIntegrator.getSystemStatus()).rejects.toThrow();
    });

    it('should handle partial system failures gracefully', async () => {
      const mockPrisma = jest.requireMock('@/lib/database/prisma').prisma;
      
      mockPrisma.user.count.mockResolvedValue(5);
      mockPrisma.studentResource.count.mockRejectedValue(new Error('Table not found'));
      mockPrisma.customerLtvAnalysis.count.mockResolvedValue(2);

      const result = await systemIntegrator.validateSystemIntegration();
      
      expect(result.phase1.studentResourceManager).toBe(false);
      expect(result.phase2.ltvAnalyzer).toBe(true);
    });
  });
});