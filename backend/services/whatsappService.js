import twilio from 'twilio';

const getRecipients = () => {
  const rawRecipients = process.env.WHATSAPP_ALERT_RECIPIENTS || '';
  return rawRecipients
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => (value.startsWith('whatsapp:') ? value : `whatsapp:${value}`));
};

export const isWhatsAppEnabled = () => {
  return getWhatsAppConfigStatus().enabled;
};

export const getWhatsAppConfigStatus = () => {
  const recipients = getRecipients();

  const checks = {
    TWILIO_ACCOUNT_SID: Boolean(process.env.TWILIO_ACCOUNT_SID),
    TWILIO_AUTH_TOKEN: Boolean(process.env.TWILIO_AUTH_TOKEN),
    TWILIO_WHATSAPP_FROM: Boolean(process.env.TWILIO_WHATSAPP_FROM),
    WHATSAPP_ALERT_RECIPIENTS: recipients.length > 0,
  };

  const missing = Object.entries(checks)
    .filter(([, configured]) => !configured)
    .map(([key]) => key);

  return {
    enabled: missing.length === 0,
    missing,
    recipientsCount: recipients.length,
  };
};

const getSeverityBadge = (severity) => {
  const value = String(severity || 'MEDIUM').toUpperCase();

  if (value === 'CRITICAL') return `🔴🔴🔴 ${value}`;
  if (value === 'HIGH') return `🔴 ${value}`;
  if (value === 'MEDIUM') return `🟡 ${value}`;
  if (value === 'LOW') return `🟢 ${value}`;

  return `🟡 ${value}`;
};

const getIncidentTypeLabel = (incident) => {
  const normalizedType = String(incident?.type || '').trim().toLowerCase();
  const customType = String(incident?.customType || '').trim();

  if (normalizedType === 'other' && customType) {
    return customType.toUpperCase();
  }

  return normalizedType ? normalizedType.toUpperCase() : 'N/A';
};

const getSafetyInstructions = (incidentType) => {
  const type = String(incidentType || '').toLowerCase();

  const primaryInstructionByType = {
    fire: 'Use stairs, not elevators, and keep low if smoke is present',
    flood: 'Move to higher ground immediately and avoid flowing water',
    accident: 'Keep distance from vehicles/debris and avoid crowding the area',
    earthquake: 'Drop, cover, and hold on until shaking stops',
    hazard: 'Avoid contact with unknown substances and do not inhale fumes',
  };

  return [
    `• ${primaryInstructionByType[type] || 'Stay calm and move to a safe area'}`,
    '• Follow local authority instructions',
    '• Avoid the affected zone',
    '• Call 112 for emergencies',
  ];
};

const formatReportedTime = (incident) => {
  const timestamp = incident?.reportedAt || incident?.createdAt || Date.now();
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return formatter
    .format(date)
    .replace(',', ',')
    .replace('AM', 'am')
    .replace('PM', 'pm');
};

const buildIncidentMessage = (incident) => {
  const title = incident?.title || 'Emergency incident reported';
  const type = getIncidentTypeLabel(incident);
  const address = incident?.location?.address || 'Address unavailable';
  const reportedAt = formatReportedTime(incident);
  const severity = getSeverityBadge(incident?.severity);
  const instructions = getSafetyInstructions(incident?.type);

  return [
    '🚨 *EMERGENCY ALERT* 🚨',
    '━━━━━━━━━━━━━━━━━━━━━',
    '',
    `🆘 *${title}*`,
    '',
    `📌 *Type:* ${type}`,
    `📍 *Location:* ${address}`,
    `⏰ *Reported:* ${reportedAt}`,
    `🔺 *Severity:* ${severity}`,
    '',
    '━━━━━━━━━━━━━━━━━━━━━',
    '🛡️ *Safety Instructions:*',
    ...instructions,
    '',
    '_This alert has been verified by an authorized official._',
  ].join('\n');
};

export const sendIncidentWhatsAppAlert = async (incident, reason = 'incident') => {
  if (!isWhatsAppEnabled()) {
    return {
      enabled: false,
      initiated: false,
      sentCount: 0,
      failedCount: 0,
      recipients: [],
      message: 'Twilio WhatsApp not configured',
    };
  }

  const recipients = getRecipients();
  const body = buildIncidentMessage(incident, reason);

  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const results = await Promise.allSettled(
      recipients.map((to) =>
        client.messages.create({
          from: process.env.TWILIO_WHATSAPP_FROM,
          to,
          body,
        })
      )
    );

    const sentCount = results.filter((result) => result.status === 'fulfilled').length;
    const failedCount = results.length - sentCount;

    return {
      enabled: true,
      initiated: true,
      sentCount,
      failedCount,
      recipients,
      reason,
    };
  } catch (error) {
    return {
      enabled: true,
      initiated: false,
      sentCount: 0,
      failedCount: recipients.length,
      recipients,
      reason,
      error: error.message,
    };
  }
};

export default {
  getWhatsAppConfigStatus,
  isWhatsAppEnabled,
  sendIncidentWhatsAppAlert,
};