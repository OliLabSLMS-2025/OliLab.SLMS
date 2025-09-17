
// FIX: Changed import to `import type` for better practice, as we are only importing TypeScript types. This is now possible after fixing the type declarations in `next-env.d.ts`.
import type { NextApiRequest, NextApiResponse } from 'next';
import { generateInventoryReport } from '../../services/geminiService';
import { InventoryReport } from '../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { items, logs, users } = req.body;

    if (!items || !logs || !users) {
      return res.status(400).json({ message: 'Missing required data: items, logs, and users.' });
    }

    const report: InventoryReport = await generateInventoryReport(items, logs, users);
    res.status(200).json(report);

  } catch (error: any) {
    console.error("Error in /api/generate-report:", error);
    res.status(500).json({ message: error.message || 'An unknown error occurred.' });
  }
}