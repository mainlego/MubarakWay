/**
 * Test script for prayer times calculation
 * Tests coordinates from St. Petersburg (59.9009, 30.2922)
 */

const { Coordinates, CalculationMethod, PrayerTimes, HighLatitudeRule, Madhab } = require('adhan');

// Test coordinates from screenshot: St. Petersburg
const latitude = 59.9009;
const longitude = 30.2922;

console.log('🕌 Testing Prayer Times Calculation');
console.log('📍 Location: St. Petersburg');
console.log(`📌 Coordinates: ${latitude}, ${longitude}`);
console.log('');

// Create coordinates
const coordinates = new Coordinates(latitude, longitude);

// Get calculation params
const params = CalculationMethod.MuslimWorldLeague();

// For high latitudes (St. Petersburg is 59.9°), use special rule
if (Math.abs(latitude) > 48) {
  params.highLatitudeRule = HighLatitudeRule.MiddleOfTheNight;
  console.log('✅ High Latitude Rule: MiddleOfTheNight (latitude > 48°)');
}

// Set madhab
params.madhab = Madhab.Shafi;
console.log('✅ Madhab: Shafi');
console.log('✅ Calculation Method: MuslimWorldLeague');
console.log('');

// Calculate prayer times for today
const date = new Date();
const prayerTimes = new PrayerTimes(coordinates, date, params);

console.log('⏰ Prayer Times for Today (' + date.toLocaleDateString('ru-RU') + '):');
console.log('');

// Format times in Moscow timezone
const timezone = 'Europe/Moscow';

function formatTime(date) {
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
    hour12: false
  });
}

console.log('🌅 Фаджр (Fajr):   ', formatTime(prayerTimes.fajr));
console.log('🌄 Восход (Sunrise):', formatTime(prayerTimes.sunrise));
console.log('☀️  Зухр (Dhuhr):   ', formatTime(prayerTimes.dhuhr));
console.log('🌤️  Аср (Asr):      ', formatTime(prayerTimes.asr));
console.log('🌆 Магриб (Maghrib):', formatTime(prayerTimes.maghrib));
console.log('🌙 Иша (Isha):     ', formatTime(prayerTimes.isha));
console.log('');

// Compare with screenshot values
console.log('📸 Expected values from screenshot:');
console.log('🌅 Фаджр: 05:12');
console.log('🌄 Восход: 07:31');
console.log('☀️  Зухр: 12:46');
console.log('🌤️  Аср: 15:13');
console.log('🌆 Магриб: 17:59');
console.log('🌙 Иша: 20:08');
console.log('');

// Check next prayer
const now = new Date();
const prayers = [
  { name: 'Фаджр', time: prayerTimes.fajr, key: 'fajr' },
  { name: 'Восход', time: prayerTimes.sunrise, key: 'sunrise', skipNotification: true },
  { name: 'Зухр', time: prayerTimes.dhuhr, key: 'dhuhr' },
  { name: 'Аср', time: prayerTimes.asr, key: 'asr' },
  { name: 'Магриб', time: prayerTimes.maghrib, key: 'maghrib' },
  { name: 'Иша', time: prayerTimes.isha, key: 'isha' }
];

let nextPrayer = null;
for (let i = 0; i < prayers.length; i++) {
  if (now < prayers[i].time) {
    nextPrayer = prayers[i];
    break;
  }
}

if (nextPrayer) {
  const timeUntil = nextPrayer.time - now;
  const hoursUntil = Math.floor(timeUntil / (1000 * 60 * 60));
  const minutesUntil = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));

  console.log(`📿 Следующая молитва: ${nextPrayer.name} в ${formatTime(nextPrayer.time)}`);
  console.log(`⏰ Через: ${hoursUntil}ч ${minutesUntil}м`);
} else {
  console.log('📿 Следующая молитва: Фаджр (завтра)');
}
