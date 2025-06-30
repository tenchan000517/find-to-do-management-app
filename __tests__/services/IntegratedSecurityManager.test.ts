import { IntegratedSecurityManager, VulnerabilityManager } from '@/services/IntegratedSecurityManager';

describe('IntegratedSecurityManager', () => {
  let securityManager: IntegratedSecurityManager;

  beforeEach(() => {
    securityManager = IntegratedSecurityManager.getInstance();
  });

  afterEach(() => {
    // Clear singleton instances for clean testing
    (IntegratedSecurityManager as any).instance = null;
    (VulnerabilityManager as any).instance = null;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = IntegratedSecurityManager.getInstance();
      const instance2 = IntegratedSecurityManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Suspicious Activity Detection', () => {
    it('should not block normal user operations', async () => {
      const sessionId = 'test-session-123';
      const normalAction = 'task:create';
      const metadata = { title: 'Normal Task', description: 'A regular task' };

      const alert = await securityManager.detectSuspiciousActivity(sessionId, normalAction, metadata);
      
      // Normal operations should not trigger alerts
      expect(alert).toBeNull();
    });

    it('should detect SQL injection attempts', async () => {
      const sessionId = 'test-session-456';
      const maliciousAction = 'task:create';
      const metadata = { 
        title: "'; DROP TABLE users; --",
        description: 'Normal description'
      };

      const alert = await securityManager.detectSuspiciousActivity(sessionId, maliciousAction, metadata);
      
      expect(alert).not.toBeNull();
      expect(alert?.type).toBe('SQL_INJECTION');
      expect(alert?.severity).toBe('CRITICAL');
    });

    it('should detect XSS attack attempts', async () => {
      const sessionId = 'test-session-789';
      const maliciousAction = 'task:update';
      const metadata = { 
        title: 'Normal Title',
        description: '<script>alert("XSS")</script>'
      };

      const alert = await securityManager.detectSuspiciousActivity(sessionId, maliciousAction, metadata);
      
      expect(alert).not.toBeNull();
      expect(alert?.type).toBe('XSS');
      expect(alert?.severity).toBe('HIGH');
    });

    it('should detect excessive request rates', async () => {
      const sessionId = 'test-session-rate-limit';
      const action = 'task:read';
      
      // Simulate rapid requests
      const promises = [];
      for (let i = 0; i < 105; i++) {
        promises.push(securityManager.detectSuspiciousActivity(sessionId, action, {}));
      }
      
      const results = await Promise.all(promises);
      const alerts = results.filter(result => result !== null);
      
      // Should detect rate limiting after 100 requests
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(alert => alert?.type === 'RATE_LIMIT')).toBe(true);
    });

    it('should not detect false positives for legitimate data', async () => {
      const sessionId = 'test-session-legit';
      const action = 'project:update';
      const metadata = {
        name: 'Project Alpha',
        description: 'A legitimate project with normal characters: .,!?',
        budget: 10000,
        team: ['user1@example.com', 'user2@example.com']
      };

      const alert = await securityManager.detectSuspiciousActivity(sessionId, action, metadata);
      
      expect(alert).toBeNull();
    });
  });

  describe('Security Event Logging', () => {
    it('should log security events correctly', async () => {
      const securityEvent = {
        id: 'event-test-001',
        type: 'ACCESS' as const,
        sessionId: 'test-session',
        action: 'user:login',
        resource: '/api/auth/login',
        success: true,
        metadata: { ip: '192.168.1.1' },
        timestamp: new Date()
      };

      await expect(securityManager.logSecurityEvent(securityEvent)).resolves.not.toThrow();
    });
  });

  describe('Security Status Monitoring', () => {
    it('should return security status with all required fields', async () => {
      const status = await securityManager.getSecurityStatus();
      
      expect(status).toHaveProperty('health');
      expect(status).toHaveProperty('activeThreats');
      expect(status).toHaveProperty('alertsCount');
      expect(status).toHaveProperty('lastScan');
      expect(status).toHaveProperty('systemSecurity');
      
      expect(typeof status.health).toBe('number');
      expect(typeof status.activeThreats).toBe('number');
      expect(typeof status.alertsCount).toBe('number');
      expect(['SECURE', 'WARNING', 'CRITICAL']).toContain(status.systemSecurity);
    });

    it('should return healthy status for new instance', async () => {
      const status = await securityManager.getSecurityStatus();
      
      expect(status.health).toBeGreaterThanOrEqual(85);
      expect(status.activeThreats).toBe(0);
      expect(status.systemSecurity).toBe('SECURE');
    });
  });

  describe('Security Metrics', () => {
    it('should return security metrics with proper structure', async () => {
      const metrics = await securityManager.getSecurityMetrics();
      
      expect(metrics).toHaveProperty('threatsBlocked');
      expect(metrics).toHaveProperty('securityScore');
      expect(metrics).toHaveProperty('lastThreatDetected');
      expect(metrics).toHaveProperty('vulnerabilityScanStatus');
      expect(metrics).toHaveProperty('complianceStatus');
      
      expect(typeof metrics.threatsBlocked).toBe('number');
      expect(typeof metrics.securityScore).toBe('number');
      expect(['RUNNING', 'COMPLETED', 'FAILED']).toContain(metrics.vulnerabilityScanStatus);
      expect(typeof metrics.complianceStatus).toBe('number');
    });
  });

  describe('Security Event Statistics', () => {
    it('should return event statistics for specified time period', async () => {
      // Log some test events first
      const testEvents = [
        {
          id: 'event1',
          type: 'LOGIN' as const,
          sessionId: 'session1',
          action: 'user:login',
          resource: '/api/auth',
          success: true,
          metadata: {},
          timestamp: new Date()
        },
        {
          id: 'event2',
          type: 'ACCESS' as const,
          sessionId: 'session2',
          action: 'task:read',
          resource: '/api/tasks',
          success: true,
          metadata: {},
          timestamp: new Date()
        }
      ];

      for (const event of testEvents) {
        await securityManager.logSecurityEvent(event);
      }

      const stats = await securityManager.getSecurityEventStats(24);
      
      expect(stats).toHaveProperty('totalEvents');
      expect(stats).toHaveProperty('eventsByType');
      expect(stats).toHaveProperty('hourlyDistribution');
      
      expect(typeof stats.totalEvents).toBe('number');
      expect(typeof stats.eventsByType).toBe('object');
      expect(Array.isArray(stats.hourlyDistribution)).toBe(true);
    });
  });

  describe('Permission Enhancement', () => {
    it('should enhance permissions without breaking existing functionality', async () => {
      const userRole = 'MEMBER' as const;
      const basePermissions = ['task:read', 'task:create'];
      
      const enhancedPermissions = await securityManager.enhancePermissions(userRole, basePermissions);
      
      expect(enhancedPermissions).toHaveProperty('projectAccess');
      expect(enhancedPermissions).toHaveProperty('dataAccess');
      expect(enhancedPermissions).toHaveProperty('adminFunctions');
      expect(enhancedPermissions).toHaveProperty('securityClearance');
      
      expect(['read', 'write', 'admin']).toContain(enhancedPermissions.projectAccess);
      expect(['basic', 'full', 'restricted']).toContain(enhancedPermissions.dataAccess);
      expect(typeof enhancedPermissions.adminFunctions).toBe('boolean');
      expect(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']).toContain(enhancedPermissions.securityClearance);
    });

    it('should map different user roles to appropriate access levels', async () => {
      const adminPermissions = await securityManager.enhancePermissions('ADMIN', []);
      const memberPermissions = await securityManager.enhancePermissions('MEMBER', []);
      const guestPermissions = await securityManager.enhancePermissions('GUEST', []);
      
      expect(adminPermissions.projectAccess).toBe('admin');
      expect(adminPermissions.dataAccess).toBe('full');
      expect(adminPermissions.adminFunctions).toBe(true);
      expect(adminPermissions.securityClearance).toBe('RESTRICTED');
      
      expect(memberPermissions.projectAccess).toBe('write');
      expect(memberPermissions.dataAccess).toBe('basic');
      expect(memberPermissions.adminFunctions).toBe(false);
      expect(memberPermissions.securityClearance).toBe('INTERNAL');
      
      expect(guestPermissions.projectAccess).toBe('read');
      expect(guestPermissions.dataAccess).toBe('restricted');
      expect(guestPermissions.adminFunctions).toBe(false);
      expect(guestPermissions.securityClearance).toBe('PUBLIC');
    });
  });

  describe('Security Report Generation', () => {
    it('should generate comprehensive security reports', async () => {
      const report = await securityManager.getSecurityReport(7);
      
      expect(report).toHaveProperty('period');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('threats');
      expect(report).toHaveProperty('alerts');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('complianceStatus');
      
      expect(report.period).toHaveProperty('start');
      expect(report.period).toHaveProperty('end');
      expect(report.summary).toHaveProperty('totalEvents');
      expect(report.summary).toHaveProperty('threatsDetected');
      expect(report.summary).toHaveProperty('systemHealth');
      expect(Array.isArray(report.threats)).toBe(true);
      expect(Array.isArray(report.alerts)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });
});

describe('VulnerabilityManager', () => {
  let vulnerabilityManager: VulnerabilityManager;

  beforeEach(() => {
    vulnerabilityManager = VulnerabilityManager.getInstance();
  });

  afterEach(() => {
    (VulnerabilityManager as any).instance = null;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = VulnerabilityManager.getInstance();
      const instance2 = VulnerabilityManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Vulnerability Scanning', () => {
    it('should perform vulnerability scans without errors', async () => {
      await expect(vulnerabilityManager.scanForThreats()).resolves.not.toThrow();
    });

    it('should update security rules without errors', async () => {
      await expect(vulnerabilityManager.updateSecurityRules()).resolves.not.toThrow();
    });
  });

  describe('Security Report Generation', () => {
    it('should generate security reports with proper structure', async () => {
      const report = await vulnerabilityManager.generateSecurityReport();
      
      expect(report).toHaveProperty('period');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('complianceStatus');
      
      expect(report.complianceStatus).toHaveProperty('dataProtection');
      expect(report.complianceStatus).toHaveProperty('accessControl');
      expect(report.complianceStatus).toHaveProperty('auditTrail');
      expect(report.complianceStatus).toHaveProperty('encryptionCompliance');
      
      expect(typeof report.complianceStatus.dataProtection).toBe('boolean');
      expect(typeof report.complianceStatus.accessControl).toBe('boolean');
      expect(typeof report.complianceStatus.auditTrail).toBe('boolean');
      expect(typeof report.complianceStatus.encryptionCompliance).toBe('boolean');
    });
  });
});