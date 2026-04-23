export type SecurityAlertsOutput = { alerts: string };

export async function getSecurityAlerts(): Promise<SecurityAlertsOutput> {
  if (typeof window === 'undefined') {
    try {
      const { getAI } = await import('../genkit');
      const ai = getAI();
      if (ai) {
        const { text } = await ai.generate({ prompt: 'List 3 cybersecurity tips for young social platform users. Be brief.' });
        return { alerts: text };
      }
    } catch {}
  }
  return { alerts: '• Keep your password strong and private\n• Never share personal info with strangers\n• Report suspicious content immediately' };
}
