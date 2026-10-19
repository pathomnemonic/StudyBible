/** Hand-picked passages (modern numbering) rotated by calendar day. Text is always read from the chosen edition, never stored here. */
export const VERSE_OF_DAY: string[] = [
  'Genesis 1:1-5', 'Genesis 1:26-27', 'Genesis 12:1-3', 'Exodus 3:13-14', 'Exodus 20:1-6', 'Deuteronomy 6:4-7', 'Joshua 1:9', '1 Samuel 16:7', '1 Kings 19:11-13',
  'Job 19:25-27', 'Psalm 23:1-6', 'Psalm 27:1', 'Psalm 34:8', 'Psalm 46:10', 'Psalm 51:10-12', 'Psalm 63:1', 'Psalm 91:1-2', 'Psalm 103:1-5', 'Psalm 119:105', 'Psalm 139:1-4',
  'Proverbs 3:5-6', 'Ecclesiastes 3:1-8', 'Wisdom 3:1-3', 'Sirach 2:1-6', 'Isaiah 6:8', 'Isaiah 9:6', 'Isaiah 40:28-31', 'Isaiah 43:1-4', 'Isaiah 53:4-6', 'Isaiah 55:8-9',
  'Jeremiah 29:11-13', 'Lamentations 3:22-23', 'Ezekiel 36:26', 'Micah 6:8', 'Matthew 5:3-10', 'Matthew 6:9-13', 'Matthew 6:33', 'Matthew 11:28-30', 'Matthew 16:15-18',
  'Matthew 22:37-40', 'Matthew 28:19-20', 'Mark 10:45', 'Mark 12:30-31', 'Luke 1:46-55', 'Luke 2:10-11', 'Luke 10:38-42', 'Luke 15:20', 'Luke 24:30-32',
  'John 1:1-5', 'John 1:14', 'John 3:16-17', 'John 6:35', 'John 6:68-69', 'John 8:12', 'John 10:10', 'John 11:25-26', 'John 14:6', 'John 15:5', 'John 15:12-13', 'John 20:28-29',
  'Acts 2:42', 'Romans 5:8', 'Romans 8:28', 'Romans 8:38-39', 'Romans 12:1-2', '1 Corinthians 10:16-17', '1 Corinthians 13:4-8', '1 Corinthians 13:12-13', '2 Corinthians 12:9',
  'Galatians 2:20', 'Ephesians 2:8-10', 'Philippians 4:4-7', 'Philippians 4:13', 'Colossians 3:12-14', '1 Thessalonians 5:16-18', 'Hebrews 4:12', 'Hebrews 11:1', 'James 1:2-4',
  '1 Peter 5:6-7', '1 John 4:7-8', '1 John 4:18-19', 'Revelation 3:20', 'Revelation 21:3-4',
];

export const dayOfYear = (d = new Date()) => Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 86400000);
export const verseForDay = (d = new Date()) => VERSE_OF_DAY[(dayOfYear(d) - 1 + d.getFullYear()) % VERSE_OF_DAY.length];
