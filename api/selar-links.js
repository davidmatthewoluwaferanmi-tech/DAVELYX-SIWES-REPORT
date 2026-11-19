module.exports = function handler(_req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    logbook: process.env.NEXT_PUBLIC_SEALR_LOGBOOK_URL || 'https://selar.com/placeholder',
    report: process.env.NEXT_PUBLIC_SEALR_REPORT_URL || 'https://selar.com/placeholder',
    bundle: process.env.NEXT_PUBLIC_SEALR_BUNDLE_URL || 'https://selar.com/placeholder'
  });
};
