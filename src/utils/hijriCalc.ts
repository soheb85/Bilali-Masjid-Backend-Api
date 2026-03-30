// Translated from your Dart/JS Kuwaiti Algorithm
export function calculateHijriDate(adjustDays: number = 0): string {
  const monthNames = [
    "Muḥarram", "Ṣafar", "Rabi-ul-Awwal", "Rabi-ul-Thani",
    "Jumada al-Ula", "Jumada al-Akhirah", "Rajab", "Shaaban",
    "Ramadan", "Shawwal", "Dhu al-Qadah", "Dhu al-Ḥijjah"
  ];

  try {
    const adjustedDate = new Date();
    // Apply your manual offset (Dart used subtract, so we minus the adjustDays)
    adjustedDate.setDate(adjustedDate.getDate() - adjustDays);

    const day = adjustedDate.getDate();
    let m = adjustedDate.getMonth() + 1;
    let y = adjustedDate.getFullYear();

    // Part 1: Convert Gregorian to JDN
    if (m < 3) {
      y -= 1;
      m += 12;
    }

    const a = Math.floor(y / 100);
    let b = 2 - a + Math.floor(a / 4);
    if (y < 1583) b = 0;
    if (y === 1582) {
      if (m > 10) b = -10;
      if (m === 10 && day > 4) b = -10;
    }

    const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524;

    // Part 2: Kuwaiti Algorithm Correction
    const correctionFactor = 10631.0 / 30.0;
    const epochAstro = 1948084;
    const shift1 = 8.01 / 60.0;
    
    const z = jd - epochAstro;
    const cyc = Math.floor(z / correctionFactor);
    const z2 = z - 10631 * cyc;
    const j = Math.floor((z2 - shift1) / correctionFactor);
    const iy = 30 * cyc + j;
    
    const z3 = z2 - Math.floor(j * correctionFactor + shift1);
    let im = Math.floor((z3 + 28.5001) / 29.5);
    if (im === 13) im = 12;
    
    const id = z3 - Math.floor(29.5001 * im - 29);
    im = im - 1;

    return `${id} ${monthNames[im]} ${iy}`;
  } catch (e) {
    return "Error calculating Hijri date";
  }
}