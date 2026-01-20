import type { DiagnosticResult, DiagnosticTest } from '@/types/support';

// Diagnostic tests that the autonomous agent performs
const diagnosticTests: DiagnosticTest[] = [
  {
    id: 'diag-001',
    name: 'Device Profiling',
    description: 'Identifying device type, OS version, and network capabilities',
    duration: 2000,
    order: 1,
  },
  {
    id: 'diag-002',
    name: 'Network Configuration Check',
    description: 'Analyzing IP configuration, DNS settings, and gateway connectivity',
    duration: 3000,
    order: 2,
  },
  {
    id: 'diag-003',
    name: 'Connection Quality Test',
    description: 'Measuring latency, packet loss, and bandwidth to ISP servers',
    duration: 4000,
    order: 3,
  },
  {
    id: 'diag-004',
    name: 'Service Status Verification',
    description: 'Checking ISP service status and any known outages in your area',
    duration: 2500,
    order: 4,
  },
  {
    id: 'diag-005',
    name: 'Router Health Analysis',
    description: 'Evaluating router performance, channel congestion, and firmware status',
    duration: 3500,
    order: 5,
  },
  {
    id: 'diag-006',
    name: 'Automated Fix Attempt',
    description: 'Applying safe automated fixes to resolve detected issues',
    duration: 5000,
    order: 6,
  },
];

// Simulated diagnostic outcomes
const possibleOutcomes: Record<string, { status: DiagnosticResult['status']; details: string; canAutoFix?: boolean }[]> = {
  'Device Profiling': [
    { status: 'passed', details: 'Device: Windows 11 Pro, Network adapter: Intel Wi-Fi 6 AX201' },
    { status: 'passed', details: 'Device: macOS Sonoma 14.2, Network adapter: Apple BCM4389' },
    { status: 'warning', details: 'Device drivers may be outdated. Current version: 22.120.1', canAutoFix: true },
  ],
  'Network Configuration Check': [
    { status: 'passed', details: 'IP: 192.168.1.105, Gateway: 192.168.1.1, DNS: 8.8.8.8, 8.8.4.4' },
    { status: 'failed', details: 'DNS resolution failing. Unable to resolve external domains', canAutoFix: true },
    { status: 'warning', details: 'Using ISP default DNS. Switching to Google DNS may improve performance', canAutoFix: true },
  ],
  'Connection Quality Test': [
    { status: 'passed', details: 'Latency: 15ms, Packet Loss: 0%, Download: 285 Mbps, Upload: 42 Mbps' },
    { status: 'warning', details: 'Latency: 85ms (elevated), Packet Loss: 2%, Consider checking for interference' },
    { status: 'failed', details: 'High packet loss detected: 15%. Connection unstable' },
  ],
  'Service Status Verification': [
    { status: 'passed', details: 'All ISP services operational. No outages reported in your area' },
    { status: 'warning', details: 'Scheduled maintenance in your area tonight 2AM-4AM' },
    { status: 'failed', details: 'Service outage detected in your area. Estimated resolution: 2 hours' },
  ],
  'Router Health Analysis': [
    { status: 'passed', details: 'Router healthy. Uptime: 45 days, Memory: 62% used, Firmware: Latest' },
    { status: 'warning', details: 'WiFi channel 6 is congested. Recommend switching to channel 11', canAutoFix: true },
    { status: 'failed', details: 'Router firmware critically outdated. Security update required', canAutoFix: true },
  ],
  'Automated Fix Attempt': [
    { status: 'passed', details: 'Successfully applied network optimizations. Please test your connection' },
    { status: 'warning', details: 'Partial fixes applied. Some issues require manual intervention' },
    { status: 'failed', details: 'Unable to apply automated fixes. Manual intervention required' },
  ],
};

export function getDiagnosticTests(): DiagnosticTest[] {
  return [...diagnosticTests].sort((a, b) => a.order - b.order);
}

export async function runDiagnosticTest(
  test: DiagnosticTest,
  onProgress?: (progress: number) => void
): Promise<DiagnosticResult> {
  const startTime = Date.now();
  const outcomes = possibleOutcomes[test.name] || [{ status: 'passed' as const, details: 'Test completed successfully' }];
  
  // Simulate progress updates
  const progressInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min((elapsed / test.duration) * 100, 95);
    onProgress?.(progress);
  }, 100);

  // Wait for the test duration
  await new Promise(resolve => setTimeout(resolve, test.duration));
  
  clearInterval(progressInterval);
  onProgress?.(100);

  // Pick a random outcome (weighted towards success for demo)
  const randomValue = Math.random();
  let outcomeIndex = 0;
  if (randomValue > 0.85) {
    outcomeIndex = 2; // Failed
  } else if (randomValue > 0.6) {
    outcomeIndex = 1; // Warning
  }
  
  const outcome = outcomes[Math.min(outcomeIndex, outcomes.length - 1)];

  return {
    id: `result-${test.id}-${Date.now()}`,
    testName: test.name,
    status: outcome.status,
    details: outcome.details,
    timestamp: new Date(),
    autoFixAttempted: outcome.canAutoFix && outcome.status !== 'passed',
    autoFixSuccessful: outcome.canAutoFix && Math.random() > 0.3,
  };
}

export async function runFullDiagnostics(
  onTestStart: (test: DiagnosticTest) => void,
  onTestComplete: (result: DiagnosticResult) => void,
  onProgress?: (testId: string, progress: number) => void
): Promise<DiagnosticResult[]> {
  const tests = getDiagnosticTests();
  const results: DiagnosticResult[] = [];

  for (const test of tests) {
    onTestStart(test);
    
    const result = await runDiagnosticTest(test, (progress) => {
      onProgress?.(test.id, progress);
    });
    
    results.push(result);
    onTestComplete(result);

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

export function analyzeResults(results: DiagnosticResult[]): {
  overallStatus: 'resolved' | 'partial' | 'escalate';
  summary: string;
  recommendations: string[];
} {
  const failedTests = results.filter(r => r.status === 'failed');
  const warningTests = results.filter(r => r.status === 'warning');
  const autoFixSuccesses = results.filter(r => r.autoFixSuccessful);

  if (failedTests.length === 0 && autoFixSuccesses.length > 0) {
    return {
      overallStatus: 'resolved',
      summary: 'All issues have been automatically resolved. Your connection should now be working properly.',
      recommendations: [
        'Test your internet connection by visiting a website',
        'Run a speed test to verify performance',
        'Monitor your connection over the next few hours',
      ],
    };
  }

  if (failedTests.length > 0) {
    const hasServiceOutage = failedTests.some(r => r.details.includes('outage'));
    
    if (hasServiceOutage) {
      return {
        overallStatus: 'partial',
        summary: 'A service outage has been detected in your area. Our team is working on it.',
        recommendations: [
          'Wait for the outage to be resolved',
          'Check our status page for updates',
          'You will be notified when service is restored',
        ],
      };
    }

    return {
      overallStatus: 'escalate',
      summary: 'Some issues require manual intervention by our technical team.',
      recommendations: [
        'A support engineer will be assigned to your case',
        'Keep your device accessible for remote assistance',
        'You will receive updates via email and in this chat',
      ],
    };
  }

  if (warningTests.length > 0) {
    return {
      overallStatus: 'partial',
      summary: 'Some minor issues were detected but your connection should be functional.',
      recommendations: warningTests.map(w => `Review: ${w.details}`),
    };
  }

  return {
    overallStatus: 'resolved',
    summary: 'All diagnostic tests passed. Your connection appears to be healthy.',
    recommendations: [
      'Your network is functioning normally',
      'If issues persist, please describe them in more detail',
    ],
  };
}
