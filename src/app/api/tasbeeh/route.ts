/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Tasbeeh from '@/models/Tasbeeh';
import { sendSuccess, sendError } from '@/utils/apiResponse';
import { requireAuth } from '@/utils/auth';
import { CAPABILITIES, ERROR_CODES } from '@/constants';

export async function GET() {
  try {
    await connectDB();
    let list = await Tasbeeh.find({}).sort({ sortOrder: 1, createdAt: 1 });

    // Seed defaults if empty
    if (list.length === 0) {
      const defaults = [
        { arabic: 'سُبْحَانَ اللهِ', en: 'SubhanAllah',
          meaning: { en: 'Glory be to Allah', hi: 'अल्लाह की पवित्रता', ur: 'اللہ کی تسبیح' },
          target: 33, category: 'general', sortOrder: 1 },
        { arabic: 'الحَمْدُ للهِ', en: 'Alhamdulillah',
          meaning: { en: 'All praise is for Allah', hi: 'सब प्रशंसा अल्लाह के लिए', ur: 'تمام تعریف اللہ کے لئے' },
          target: 33, category: 'general', sortOrder: 2 },
        { arabic: 'اللهُ أَكْبَر', en: 'Allahu Akbar',
          meaning: { en: 'Allah is the Greatest', hi: 'अल्लाह सबसे बड़ा है', ur: 'اللہ سب سے بڑا ہے' },
          target: 34, category: 'general', sortOrder: 3 },
        { arabic: 'لَا إِلَهَ إِلَّا اللهُ', en: 'La ilaha illallah',
          meaning: { en: 'There is no god but Allah', hi: 'अल्लाह के सिवा कोई माबूद नहीं', ur: 'اللہ کے علاوہ کوئی معبود نہیں' },
          target: 100, category: 'general', sortOrder: 4 },
        { arabic: 'أَسْتَغْفِرُ اللهَ', en: 'Astaghfirullah',
          meaning: { en: 'I seek forgiveness from Allah', hi: 'मैं अल्लाह से माफी माँगता हूँ', ur: 'میں اللہ سے معافی مانگتا ہوں' },
          target: 100, category: 'general', sortOrder: 5 },
        { arabic: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ', en: 'SubhanAllahi Wabihamdihi',
          meaning: { en: 'Glory to Allah and His praise', hi: 'अल्लाह की महिमा और प्रशंसा', ur: 'اللہ کی پاکی اور اس کی حمد' },
          target: 100, category: 'morning', sortOrder: 6 },
        { arabic: 'سُبْحَانَ اللهِ الْعَظِيمِ', en: 'SubhanAllahil Azeem',
          meaning: { en: 'Glory to Allah, the Magnificent', hi: 'महान अल्लाह की महिमा', ur: 'عظیم اللہ کی پاکی' },
          target: 100, category: 'general', sortOrder: 7 },
        { arabic: 'صَلَّى اللهُ عَلَى النَّبِيّ', en: 'Salallahu Alan Nabi',
          meaning: { en: 'May Allah bless the Prophet ﷺ', hi: 'नबी ﷺ पर अल्लाह की रहमत', ur: 'نبی ﷺ پر اللہ کی رحمت' },
          target: 100, category: 'salah', sortOrder: 8 },
      ];
      list = await Tasbeeh.insertMany(defaults);
    }

    const response = sendSuccess(list, 'Tasbeeh list fetched');
    response.headers.set('Cache-Control', 'public, s-maxage=2592000, stale-while-revalidate=86400');
    return response;
  } catch (error: any) {
    return sendError('Failed to fetch', 500, ERROR_CODES.SERVER_ERROR, error.message);
  }
}

export async function POST(req: NextRequest) {
  try {
    requireAuth(req, CAPABILITIES.WRITE_ANNOUNCEMENTS);
    await connectDB();
    const body = await req.json();
    const tasbeeh = await Tasbeeh.create(body);
    return sendSuccess(tasbeeh, 'Created', 201);
  } catch (error: any) {
    return sendError('Failed', 400, ERROR_CODES.VALIDATION_ERROR, error.message);
  }
}