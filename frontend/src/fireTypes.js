// Shared Fire Classification taxonomy and confidence formatting utilities

export const FIRE_TYPE_INFO = {
  0: {
    code: 0,
    title: 'Presumed vegetation fire',
    desc: 'Standard wildfires, forest fires, or agricultural crop burning.',
    badgeBg: 'rgba(34, 197, 94, 0.12)',
    badgeBorder: 'rgba(34, 197, 94, 0.35)',
    badgeColor: '#4ade80'
  },
  1: {
    code: 1,
    title: 'Active volcano',
    desc: 'Thermal anomalies located at known active volcanic sites.',
    badgeBg: 'rgba(239, 68, 68, 0.12)',
    badgeBorder: 'rgba(239, 68, 68, 0.35)',
    badgeColor: '#f87171'
  },
  2: {
    code: 2,
    title: 'Other static land source',
    desc: 'Persistent industrial heat sources like gas flares, steel mills, or power plants.',
    badgeBg: 'rgba(56, 189, 248, 0.12)',
    badgeBorder: 'rgba(56, 189, 248, 0.35)',
    badgeColor: '#38bdf8'
  },
  3: {
    code: 3,
    title: 'Offshore',
    desc: 'Thermal anomalies detected over water, usually caused by offshore oil and gas platforms.',
    badgeBg: 'rgba(168, 85, 247, 0.12)',
    badgeBorder: 'rgba(168, 85, 247, 0.35)',
    badgeColor: '#c084fc'
  },
  '-1': {
    code: -1,
    title: 'Undetermined',
    desc: 'Undetermined thermal source or unclassified anomaly.',
    badgeBg: 'rgba(148, 163, 184, 0.12)',
    badgeBorder: 'rgba(148, 163, 184, 0.35)',
    badgeColor: '#94a3b8'
  }
};

export function getFireTypeInfo(typeCode) {
  const codeKey = typeCode !== undefined && typeCode !== null ? String(typeCode) : '-1';
  return FIRE_TYPE_INFO[codeKey] || FIRE_TYPE_INFO['-1'];
}

export function formatConfidence(conf, confCat) {
  if (conf === null || conf === undefined) {
    if (!confCat) return { label: 'Undetermined', level: 'unknown', color: '#94a3b8' };
  }
  const strConf = String(conf || '').trim().toLowerCase();
  const strCat = String(confCat || '').trim().toLowerCase();

  // If numeric percentage like "85", "100", "0"
  if (strConf !== '' && !isNaN(Number(strConf))) {
    const num = Number(strConf);
    let level = 'High';
    let color = '#22c55e';
    if (num < 50) {
      level = 'Low';
      color = '#94a3b8';
    } else if (num < 80) {
      level = 'Nominal';
      color = '#facc15';
    }
    return {
      label: `${num}% (${level})`,
      level,
      color
    };
  }

  // If letter like 'h', 'n', 'l'
  const letter = strConf || strCat;
  if (letter === 'h' || letter === 'high') {
    return { label: 'High', level: 'High', color: '#22c55e' };
  }
  if (letter === 'n' || letter === 'nominal') {
    return { label: 'Nominal', level: 'Nominal', color: '#facc15' };
  }
  if (letter === 'l' || letter === 'low') {
    return { label: 'Low', level: 'Low', color: '#94a3b8' };
  }

  return { label: String(conf || confCat || 'Undetermined'), level: 'Undetermined', color: '#94a3b8' };
}
