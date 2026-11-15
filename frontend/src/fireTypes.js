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

const locationCache = new Map();

// Regional center coordinates for Indian States & Union Territories
const INDIAN_STATES = [
  { state: 'Punjab', lat: 31.1471, lon: 75.3412 },
  { state: 'Haryana', lat: 29.0588, lon: 76.0856 },
  { state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462 },
  { state: 'Madhya Pradesh', lat: 22.9734, lon: 78.6569 },
  { state: 'Rajasthan', lat: 27.0238, lon: 74.2179 },
  { state: 'Maharashtra', lat: 19.7515, lon: 75.7139 },
  { state: 'Gujarat', lat: 22.2587, lon: 71.1924 },
  { state: 'Chhattisgarh', lat: 21.2787, lon: 81.8661 },
  { state: 'Odisha', lat: 20.9517, lon: 85.0985 },
  { state: 'Andhra Pradesh', lat: 15.9129, lon: 79.7400 },
  { state: 'Telangana', lat: 18.1124, lon: 79.0193 },
  { state: 'Karnataka', lat: 15.3173, lon: 75.7139 },
  { state: 'Tamil Nadu', lat: 11.1271, lon: 78.6569 },
  { state: 'Kerala', lat: 10.8505, lon: 76.2711 },
  { state: 'Bihar', lat: 25.0961, lon: 85.3131 },
  { state: 'West Bengal', lat: 22.9868, lon: 87.8550 },
  { state: 'Jharkhand', lat: 23.6102, lon: 85.2799 },
  { state: 'Assam', lat: 26.2006, lon: 92.9376 },
  { state: 'Arunachal Pradesh', lat: 28.2180, lon: 94.7278 },
  { state: 'Meghalaya', lat: 25.4670, lon: 91.3662 },
  { state: 'Manipur', lat: 24.6637, lon: 93.9063 },
  { state: 'Mizoram', lat: 23.1645, lon: 92.9376 },
  { state: 'Nagaland', lat: 26.1584, lon: 94.5624 },
  { state: 'Tripura', lat: 23.9408, lon: 91.9882 },
  { state: 'Himachal Pradesh', lat: 31.1048, lon: 77.1734 },
  { state: 'Uttarakhand', lat: 30.0668, lon: 79.0193 },
  { state: 'Jammu & Kashmir', lat: 33.7782, lon: 76.5762 },
  { state: 'Goa', lat: 15.2993, lon: 74.1240 },
  { state: 'Delhi', lat: 28.7041, lon: 77.1025 },
  { state: 'Ladakh', lat: 34.1526, lon: 77.5771 }
];

export function estimateIndianLocation(lat, lon) {
  let nearest = INDIAN_STATES[0];
  let minDist = Infinity;
  for (const s of INDIAN_STATES) {
    const d = Math.hypot(lat - s.lat, lon - s.lon);
    if (d < minDist) {
      minDist = d;
      nearest = s;
    }
  }

  return {
    district: `${nearest.state} Rural`,
    state: nearest.state,
    country: 'India',
    formatted: `${nearest.state}, India`
  };
}

export async function fetchLocation(lat, lon) {
  if (lat == null || lon == null) return null;
  const key = `${Number(lat).toFixed(3)},${Number(lon).toFixed(3)}`;
  if (locationCache.has(key)) {
    return locationCache.get(key);
  }

  // 1. Try BigDataCloud free client reverse geocoding API
  try {
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    if (res.ok) {
      const data = await res.json();
      let district = '';
      if (data.localityInfo && Array.isArray(data.localityInfo.administrative)) {
        const distObj = data.localityInfo.administrative.find(a => 
          (a.adminLevel === 5 || (a.description && a.description.toLowerCase().includes('district')) || (a.name && a.name.toLowerCase().includes('district')))
        );
        if (distObj) {
          district = distObj.name.replace(/\s+district$/i, '');
        } else if (data.locality) {
          district = data.locality;
        } else if (data.city) {
          district = data.city;
        }
      }
      const state = data.principalSubdivision || '';
      const country = data.countryName || 'India';

      if (state || district) {
        const result = {
          district: district || 'Rural Sector',
          state: state || 'India Region',
          country: country || 'India',
          formatted: [district, state, country].filter(Boolean).join(', ')
        };
        locationCache.set(key, result);
        return result;
      }
    }
  } catch (err) {
    // continue to next provider
  }

  // 2. Try OpenStreetMap Nominatim
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`);
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const district = addr.state_district || addr.county || addr.district || addr.city || '';
      const state = addr.state || '';
      const country = addr.country || 'India';

      if (state || district) {
        const result = {
          district: district.replace(/\s+district$/i, '') || 'Rural Sector',
          state: state || 'India Region',
          country: country || 'India',
          formatted: [district, state, country].filter(Boolean).join(', ')
        };
        locationCache.set(key, result);
        return result;
      }
    }
  } catch (err) {
    // continue to fallback
  }

  // 3. Fallback to regional centroid estimation
  const fallback = estimateIndianLocation(lat, lon);
  locationCache.set(key, fallback);
  return fallback;
}
