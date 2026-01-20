import type { KnowledgeBaseArticle, IntentCategory, TroubleshootingStep } from '@/types/support';

// Simulated Knowledge Base for ISP Support
const knowledgeBase: KnowledgeBaseArticle[] = [
  {
    id: 'kb-001',
    title: 'No Internet Connection',
    category: 'internet_connectivity',
    content: 'Troubleshooting steps for when you have no internet connection.',
    keywords: ['no internet', 'no connection', 'offline', 'disconnected', 'can\'t connect'],
    steps: [
      {
        id: 'step-1',
        title: 'Check Physical Connections',
        description: 'Ensure all cables are securely connected to your router and modem. Check that the power cables are plugged in and the devices are turned on.',
        completed: false,
        order: 1,
      },
      {
        id: 'step-2',
        title: 'Restart Your Router',
        description: 'Unplug your router from power, wait 30 seconds, then plug it back in. Wait 2-3 minutes for it to fully restart.',
        completed: false,
        order: 2,
      },
      {
        id: 'step-3',
        title: 'Check Router Lights',
        description: 'Look at the lights on your router. The "Internet" or "WAN" light should be solid green. If it\'s red or blinking, there may be a service issue.',
        completed: false,
        order: 3,
      },
      {
        id: 'step-4',
        title: 'Restart Your Device',
        description: 'Restart the device you\'re trying to connect with (computer, phone, etc.).',
        completed: false,
        order: 4,
      },
    ],
  },
  {
    id: 'kb-002',
    title: 'Slow Internet Speed',
    category: 'slow_speed',
    content: 'Steps to improve your internet speed.',
    keywords: ['slow', 'speed', 'buffering', 'lag', 'latency', 'loading'],
    steps: [
      {
        id: 'step-1',
        title: 'Run a Speed Test',
        description: 'Visit speedtest.net or fast.com to check your current download and upload speeds. Compare these to your plan\'s advertised speeds.',
        completed: false,
        order: 1,
      },
      {
        id: 'step-2',
        title: 'Check for Bandwidth Usage',
        description: 'Ensure no other devices are using heavy bandwidth (streaming, large downloads). Disconnect unused devices from your network.',
        completed: false,
        order: 2,
      },
      {
        id: 'step-3',
        title: 'Move Closer to Router',
        description: 'If using WiFi, move closer to your router or remove obstacles between you and the router.',
        completed: false,
        order: 3,
      },
      {
        id: 'step-4',
        title: 'Try a Wired Connection',
        description: 'Connect your device directly to the router using an Ethernet cable. This eliminates WiFi interference.',
        completed: false,
        order: 4,
      },
      {
        id: 'step-5',
        title: 'Clear Browser Cache',
        description: 'Clear your browser\'s cache and cookies. This can improve web browsing performance.',
        completed: false,
        order: 5,
      },
    ],
  },
  {
    id: 'kb-003',
    title: 'Router Not Working',
    category: 'router_issues',
    content: 'Troubleshooting your router problems.',
    keywords: ['router', 'wifi', 'wireless', 'not working', 'no signal'],
    steps: [
      {
        id: 'step-1',
        title: 'Check Power Supply',
        description: 'Ensure the router is properly plugged in and the power light is on.',
        completed: false,
        order: 1,
      },
      {
        id: 'step-2',
        title: 'Factory Reset',
        description: 'Locate the reset button on your router (usually a small hole). Press and hold for 10 seconds using a paperclip.',
        completed: false,
        order: 2,
      },
      {
        id: 'step-3',
        title: 'Update Firmware',
        description: 'Access your router\'s admin panel (usually 192.168.1.1) and check for firmware updates.',
        completed: false,
        order: 3,
      },
      {
        id: 'step-4',
        title: 'Check WiFi Settings',
        description: 'Verify your WiFi name (SSID) and password are correct. Try reconnecting with the correct credentials.',
        completed: false,
        order: 4,
      },
    ],
  },
  {
    id: 'kb-004',
    title: 'Device Connection Issues',
    category: 'device_problems',
    content: 'Fixing connection problems on your specific device.',
    keywords: ['device', 'phone', 'computer', 'laptop', 'tablet', 'can\'t connect device'],
    steps: [
      {
        id: 'step-1',
        title: 'Forget and Reconnect',
        description: 'Go to your device\'s WiFi settings, forget the network, and reconnect by entering the password again.',
        completed: false,
        order: 1,
      },
      {
        id: 'step-2',
        title: 'Toggle Airplane Mode',
        description: 'Turn on Airplane Mode, wait 10 seconds, then turn it off. This resets your device\'s network connections.',
        completed: false,
        order: 2,
      },
      {
        id: 'step-3',
        title: 'Update Network Drivers',
        description: 'For computers: Update your network adapter drivers through Device Manager (Windows) or System Preferences (Mac).',
        completed: false,
        order: 3,
      },
      {
        id: 'step-4',
        title: 'Reset Network Settings',
        description: 'Reset your device\'s network settings to default. This will remove saved networks but often fixes connectivity issues.',
        completed: false,
        order: 4,
      },
    ],
  },
];

// Intent classification patterns
const intentPatterns: Record<IntentCategory, RegExp[]> = {
  internet_connectivity: [
    /no (internet|connection|wifi)/i,
    /can'?t connect/i,
    /offline/i,
    /disconnected/i,
    /internet.*(down|not working)/i,
  ],
  slow_speed: [
    /slow/i,
    /speed/i,
    /buffering/i,
    /lag(gy|ging)?/i,
    /loading/i,
    /takes forever/i,
  ],
  router_issues: [
    /router/i,
    /modem/i,
    /wifi.*(not working|down)/i,
    /wireless/i,
    /no signal/i,
  ],
  device_problems: [
    /phone.*(can'?t|won'?t|not)/i,
    /computer.*(can'?t|won'?t|not)/i,
    /laptop.*(can'?t|won'?t|not)/i,
    /device.*(can'?t|won'?t|not)/i,
    /my (phone|laptop|computer|tablet)/i,
  ],
  billing: [
    /bill/i,
    /payment/i,
    /charge/i,
    /invoice/i,
    /subscription/i,
  ],
  general_inquiry: [
    /question/i,
    /help/i,
    /information/i,
    /how (do|can) i/i,
  ],
  unknown: [],
};

export async function classifyIntent(message: string): Promise<{ intent: IntentCategory; confidence: number }> {
  // Simulate NLP processing delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

  let bestMatch: IntentCategory = 'unknown';
  let highestConfidence = 0;

  for (const [intent, patterns] of Object.entries(intentPatterns)) {
    if (intent === 'unknown') continue;

    for (const pattern of patterns) {
      if (pattern.test(message)) {
        const confidence = 0.75 + Math.random() * 0.2;
        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          bestMatch = intent as IntentCategory;
        }
      }
    }
  }

  // If no match found, check for general keywords
  if (bestMatch === 'unknown' && message.length > 10) {
    bestMatch = 'general_inquiry';
    highestConfidence = 0.5;
  }

  return { intent: bestMatch, confidence: highestConfidence };
}

export async function searchKnowledgeBase(intent: IntentCategory): Promise<KnowledgeBaseArticle | null> {
  // Simulate KB search delay
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 300));

  return knowledgeBase.find(article => article.category === intent) || null;
}

export function getOSSpecificInstructions(os: string, step: TroubleshootingStep): string {
  const osInstructions: Record<string, Record<string, string>> = {
    'Update Network Drivers': {
      Windows: 'Open Device Manager → Network Adapters → Right-click your adapter → Update Driver',
      macOS: 'Go to System Preferences → Software Update → Install any available updates',
      Linux: 'Run: sudo apt update && sudo apt upgrade',
    },
    'Reset Network Settings': {
      Windows: 'Settings → Network & Internet → Status → Network Reset',
      macOS: 'System Preferences → Network → Select connection → Click "-" then "+"',
      iOS: 'Settings → General → Transfer or Reset → Reset → Reset Network Settings',
      Android: 'Settings → System → Reset Options → Reset Wi-Fi, mobile & Bluetooth',
    },
    'Clear Browser Cache': {
      Windows: 'Press Ctrl+Shift+Delete in your browser',
      macOS: 'Press Cmd+Shift+Delete in your browser',
    },
  };

  const stepInstructions = osInstructions[step.title];
  if (stepInstructions && stepInstructions[os]) {
    return `${step.description}\n\n📱 **For ${os}:** ${stepInstructions[os]}`;
  }

  return step.description;
}
