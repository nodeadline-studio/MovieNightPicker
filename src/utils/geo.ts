// List of European country codes
const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'IS', 'LI',
  'NO', 'CH'
];

export async function isEuropeanUser(): Promise<boolean> {
  try {
    // Use ipapi.co's free API instead (no key required)
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    // Check if the request was successful
    if (data.error) {
      console.warn('Location detection failed:', data.reason);
      return true; // Default to EU if detection fails (safer for GDPR)
    }
    
    return EU_COUNTRIES.includes(data.country_code);
  } catch (error) {
    console.warn('Failed to detect location, defaulting to EU:', error);
    return true; // Default to EU on error (safer for GDPR)
  }
}