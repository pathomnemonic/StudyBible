import { useSpelling } from './lib/spelling';
import { lazy, Suspense, useEffect } from 'react';
import { buzz } from './lib/haptics';
import { installRipples } from './lib/ripple';
import ErrorBoundary from './components/ErrorBoundary';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { EditionsProvider, useEditions } from './data/EditionsContext';
import { useSettings } from './lib/store';
import Shell from './components/Shell';
import ReadPage from './pages/ReadPage';
import { PlayerProvider } from './data/PlayerContext';
import MiniPlayer from './components/MiniPlayer';
import { ToastProvider } from './components/Toast';
import { initSync } from './sync/state';
import UpdateBanner from './components/UpdateBanner';
import ScrollMemory from './components/ScrollMemory';
import { db, TRASH_DAYS } from './db/db';
import { scheduleReminder } from './liturgy/reminders';

const DivineLiturgyPage = lazy(() => import('./pages/pray/DivineLiturgyPage'));
const YoungAdultsPage = lazy(() => import('./pages/study/YoungAdultsPage'));
const CurriculumHome = lazy(() => import('./pages/study/CurriculumHome'));
const JoinPage = lazy(() => import('./live/Screens').then((m) => ({ default: m.JoinPage })));
const PlayPage = lazy(() => import('./live/Screens').then((m) => ({ default: m.PlayPage })));
const TeachHome = lazy(() => import('./teach/TeachPages').then((m) => ({ default: m.TeachHome })));
const ClassPage = lazy(() => import('./teach/TeachPages').then((m) => ({ default: m.ClassPage })));
const HostPage = lazy(() => import('./live/Screens').then((m) => ({ default: m.HostPage })));
const CurriculumGrade = lazy(() => import('./pages/study/CurriculumGrade'));
const CurriculumLesson = lazy(() => import('./pages/study/CurriculumLesson'));
const CurriculumTeachers = lazy(() => import('./pages/study/CurriculumTeachers'));
const CurriculumPacket = lazy(() => import('./pages/study/CurriculumPacket'));
const MassModePage = lazy(() => import('./pages/pray/MassModePage'));
const LiturgiesPage = lazy(() => import('./pages/pray/LiturgiesPage'));
const PapalPage = lazy(() => import('./pages/study/PapalPage'));
const MassEFPage = lazy(() => import('./pages/pray/MassEFPage'));
const GalleryPage = lazy(() => import('./pages/study/GalleryPage'));
const VisualPage = lazy(() => import('./pages/study/VisualPage'));
const DaysPage = lazy(() => import('./pages/DaysPage'));
const CatechismPage = lazy(() => import('./pages/study/CatechismPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SaintsPage = lazy(() => import('./pages/study/SaintsPage'));
const ApologeticsPage = lazy(() => import('./pages/study/ApologeticsPage'));
const KidsPage = lazy(() => import('./pages/study/KidsPage'));
const RoomHome = lazy(() => import('./pages/room/RoomHome'));
const VideoLibrary = lazy(() => import('./pages/study/VideoLibrary'));
const EncyclopediaPage = lazy(() => import('./pages/study/EncyclopediaPage'));
const StudyHome = lazy(() => import('./pages/study/StudyHome'));
const PathPage = lazy(() => import('./pages/study/PathsPage'));
const PathsIndex = lazy(() => import('./pages/study/PathsPage').then((m) => ({ default: m.PathsIndex })));
const ChurchDocs = lazy(() => import('./pages/study/ChurchDocs'));
const MorePage = lazy(() => import('./pages/MorePage'));
const SleepPage = lazy(() => import('./pages/pray/SleepPage'));
const QuotationTracker = lazy(() => import('./pages/study/QuotationTracker'));
const SearchPage = lazy(() => import('./pages/study/SearchPage'));
const TopicPage = lazy(() => import('./pages/study/TopicPage'));
const DoctrinePage = lazy(() => import('./pages/study/DoctrinePage'));
const SourcesPage = lazy(() => import('./pages/study/SourcesPage'));
const WorkReader = lazy(() => import('./pages/study/WorkReader'));
const PassageStudy = lazy(() => import('./pages/study/PassageStudy'));
const ListenHome = lazy(() => import('./pages/listen/ListenHome'));
const EpisodePage = lazy(() => import('./pages/listen/EpisodePage'));
const PrayHome = lazy(() => import('./pages/pray/PrayHome'));
const PresenterView = lazy(() => import('./curriculum/PresenterView'));
const DownloadsPage = lazy(() => import('./pages/DownloadsPage'));
const LexiconPage = lazy(() => import('./pages/study/LexiconPage'));
const LearnPage = lazy(() => import('./pages/LearnPage'));
const MementoPage = lazy(() => import('./pages/MementoPage'));
const GoalsPage = lazy(() => import('./pages/GoalsPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const GlossaryPage = lazy(() => import('./pages/study/GlossaryPage'));
const AskPage = lazy(() => import('./pages/study/AskPage'));
const FeastCardPage = lazy(() => import('./pages/FeastCardPage'));
const ShareVersePage = lazy(() => import('./pages/ShareLinkPage').then((m) => ({ default: m.ShareVersePage })));
const SharePrayerPage = lazy(() => import('./pages/ShareLinkPage').then((m) => ({ default: m.SharePrayerPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const IntentionsPage = lazy(() => import('./pages/pray/IntentionsPage'));
const PilgrimPage = lazy(() => import('./pages/pray/PilgrimPage'));
const DevotionsPage = lazy(() => import('./pages/pray/DevotionsPage'));
const LifePage = lazy(() => import('./pages/pray/LifePage'));
const PreparePage = lazy(() => import('./pages/study/PreparePage'));
const SundayPrepPage = lazy(() => import('./pages/pray/SundayPrepPage'));
const PrayerBookPage = lazy(() => import('./pages/pray/PrayerBookPage'));
const ExaminationPage = lazy(() => import('./pages/pray/ExaminationPage'));
const NovenaPage = lazy(() => import('./pages/pray/NovenaPage'));
const CoursePage = lazy(() => import('./pages/study/CoursePage'));
const SessionBuilderPage = lazy(() => import('./pages/pray/SessionBuilderPage'));
const MassGuidePage = lazy(() => import('./pages/pray/MassGuidePage'));
const DossierPage = lazy(() => import('./pages/study/DossierPage'));
const ExamenPage = lazy(() => import('./pages/pray/ExamenPage'));
const ChurchYearPage = lazy(() => import('./pages/pray/ChurchYearPage'));
const StoryPage = lazy(() => import('./pages/study/StoryPage'));
const MorningPage = lazy(() => import('./pages/pray/MorningPage'));
const OfficePage = lazy(() => import('./pages/pray/OfficePage'));
const LiturgyTextPage = lazy(() => import('./pages/pray/LiturgyTextPage'));
const ReadingsPage = lazy(() => import('./pages/pray/ReadingsPage'));
const LectioPage = lazy(() => import('./pages/pray/LectioPage'));
const JournalPage = lazy(() => import('./pages/pray/JournalPage'));
const PlansPage = lazy(() => import('./pages/pray/PlansPage'));
const PlanPage = lazy(() => import('./pages/pray/PlanPage'));
const LibraryHome = lazy(() => import('./pages/library/LibraryHome'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const MapsPage = lazy(() => import('./pages/study/MapsPage'));
const VoicesPage = lazy(() => import('./pages/study/VoicesPage'));
const ConceptsPage = lazy(() => import('./pages/study/ConceptsPage'));
const ManuscriptsPage = lazy(() => import('./pages/study/ManuscriptsPage'));
const GalaxyPage = lazy(() => import('./pages/study/GalaxyPage'));
const TimeSpacePage = lazy(() => import('./pages/study/TimeSpacePage'));
const FulfilmentPage = lazy(() => import('./pages/study/FulfilmentPage'));
const TermPage = lazy(() => import('./pages/study/TermPage'));
const TermsIndex = lazy(() => import('./pages/study/TermPage').then((m) => ({ default: m.TermsIndex })));
const ConstellationPage = lazy(() => import('./pages/study/ConstellationPage'));
const TopicalPage = lazy(() => import('./pages/study/TopicalPage'));
const ConcordancePage = lazy(() => import('./pages/study/ConcordancePage'));
const BooksPage = lazy(() => import('./pages/study/BooksPage'));
const IndexPage = lazy(() => import('./pages/study/IndexPage'));
const SynopsisPage = lazy(() => import('./pages/study/SynopsisPage'));
const PaulinePage = lazy(() => import('./pages/study/PaulinePage'));
const PeoplePage = lazy(() => import('./pages/study/PeoplePage'));
const MemorizePage = lazy(() => import('./pages/pray/MemorizePage'));
const SharePage = lazy(() => import('./pages/SharePage'));
const WidgetPage = lazy(() => import('./pages/WidgetPage'));
const ThemesPage = lazy(() => import('./pages/study/ThemesPage'));
const TextualPage = lazy(() => import('./pages/study/TextualPage'));
const WorldPage = lazy(() => import('./pages/study/WorldPage'));
const SessionPage = lazy(() => import('./pages/SessionPage'));
const TodayPage = lazy(() => import('./pages/TodayPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const AttachPage = lazy(() => import('./pages/AttachPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));

function ThemeApplier() {
  const [s] = useSettings();
  useEffect(() => installRipples(), []);

  // a short tick under the finger for taps on buttons, tabs and chips, for readers who switched haptics on
  useEffect(() => {
    let at: { x: number; y: number } | null = null;
    const d = (e: PointerEvent) => { at = { x: e.clientX, y: e.clientY }; };
    const u = (e: PointerEvent) => { const a = at; at = null; if (a && e.pointerType === 'touch' && Math.hypot(e.clientX - a.x, e.clientY - a.y) < 10 && (e.target as HTMLElement | null)?.closest?.('.btn, .tab, .chip, .icon-btn, .hub-tile, .fold > summary')) buzz(6); };
    document.addEventListener('pointerdown', d, { passive: true });
    document.addEventListener('pointerup', u, { passive: true });
    return () => { document.removeEventListener('pointerdown', d); document.removeEventListener('pointerup', u); };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      let t: string = s.theme;
      if (t === 'system') {
        const dark = matchMedia('(prefers-color-scheme: dark)').matches;
        const more = matchMedia('(prefers-contrast: more)').matches;
        t = more ? (dark ? 'contrast-dark' : 'contrast') : dark ? 'twilight' : 'dawn';
      }
      root.dataset.theme = t;
      root.dataset.margin = s.margin;
      root.style.setProperty('--read-size', `${s.fontSize}px`);
      root.style.setProperty('--read-lh', String(s.lineHeight));
      root.style.setProperty('--read-font', s.fontFamily === 'serif' ? 'var(--font-serif)' : s.fontFamily === 'hyperlegible' ? "'Atkinson Hyperlegible', var(--font-sans)" : s.fontFamily === 'dyslexic' ? "'OpenDyslexic', 'Atkinson Hyperlegible', var(--font-sans)" : 'var(--font-sans)');
      root.style.setProperty('--read-ls', `${s.letterSpacing}em`);
      root.style.setProperty('--read-ws', `${s.wordSpacing}em`);
      root.dataset.align = s.plainAlign ? 'plain' : '';
      root.dataset.verses = s.verseLines ? 'lines' : 'flow';
      root.dataset.notemarks = s.showNoteMarks ? 'on' : 'off';
      root.dataset.motion = s.motion;
      root.dataset.layout = s.layout;
      root.lang = s.language;
      if (s.fontFamily === 'hyperlegible') void import('@fontsource/atkinson-hyperlegible/400.css').catch(() => {});
      if (s.fontFamily === 'dyslexic') { void import('@fontsource/opendyslexic/400.css').catch(() => {}); void import('@fontsource/atkinson-hyperlegible/400.css').catch(() => {}); }
      const meta = document.querySelector('meta[name="theme-color"]');
      meta?.setAttribute('content', getComputedStyle(root).getPropertyValue('--bg').trim() || '#121110');
    };
    apply();
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const mc = matchMedia('(prefers-contrast: more)');
    mq.addEventListener('change', apply);
    mc.addEventListener('change', apply);
    return () => {
      mq.removeEventListener('change', apply);
      mc.removeEventListener('change', apply);
    };
  }, [s.language, s.theme, s.margin, s.fontSize, s.lineHeight, s.fontFamily, s.letterSpacing, s.wordSpacing, s.plainAlign, s.motion]);
  return null;
}

function Gate({ children }: { children: JSX.Element }) {
  const { ready, error } = useEditions();
  if (!ready) return <div className="center-note">Opening the library…</div>;
  if (error) return <div className="center-note error">{error}</div>;
  return children;
}

function Home() {
  const [s] = useSettings();
  const l = s.last;
  return <Navigate replace to={l ? `/read/${l.edition}/${l.book}/${l.chapter}` : `/read/${s.defaultEdition}/JHN/1`} />;
}

/** Each page settles in with a slow fade and a small rise. The reader keeps one key so turning chapters never remounts it. */
function Settle({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return <div className="settle" key={pathname.startsWith('/read/') ? 'reader' : pathname}>{children}</div>;
}

function RedirectKeepSearch({ to }: { to: string }) {
  const l = useLocation();
  return <Navigate replace to={to + l.search} />;
}

export default function App() {
  const loc = useLocation();
  const [spell] = useSettings();
  useSpelling(spell.spelling);
  useEffect(() => {
    // a page chunk that no longer exists (the app was updated under an open tab): reload once to get the new one
    const h = (e: Event) => { e.preventDefault(); try { const k = 'sb-reloaded'; const last = Number(sessionStorage.getItem(k) ?? 0); if (Date.now() - last > 60_000) { sessionStorage.setItem(k, String(Date.now())); location.reload(); } } catch { location.reload(); } };
    window.addEventListener('vite:preloadError', h);
    return () => window.removeEventListener('vite:preloadError', h);
  }, []);
  useEffect(() => {
    initSync();
    scheduleReminder();
    // things deleted more than 30 days ago leave the Recently deleted list for good
    db.trash.where('deletedAt').below(Date.now() - TRASH_DAYS * 86400000).delete().catch(() => {});
  }, []);
  return (
    <ToastProvider>
    <EditionsProvider>
      <ThemeApplier />
      <UpdateBanner />
      <ScrollMemory />
      <Gate>
        <PlayerProvider>
        <Shell>
          <Suspense fallback={<div className="skeleton-list" aria-busy="true" role="status" aria-label="Loading"><i /><i /><i /></div>}>
            <ErrorBoundary resetKey={loc.pathname}><Settle><Routes>
              <Route path="/" element={<TodayPage />} />
              <Route path="/read" element={<Home />} />
              <Route path="/read/:edition/:book/:chapter" element={<ReadPage />} />
              <Route path="/study" element={<StudyHome />} />
              <Route path="/study/gallery" element={<GalleryPage />} />
              <Route path="/study/visual" element={<VisualPage />} />
              <Route path="/study/visual/:id" element={<VisualPage />} />
              <Route path="/study/catechism/:n?" element={<CatechismPage />} />
              <Route path="/study/saints/:md?" element={<SaintsPage />} />
              <Route path="/study/papal" element={<PapalPage />} />
              <Route path="/teach" element={<TeachHome />} />
              <Route path="/teach/:classId" element={<ClassPage />} />
              <Route path="/join" element={<JoinPage />} />
              <Route path="/join/:code" element={<JoinPage />} />
              <Route path="/play/:code" element={<PlayPage />} />
              <Route path="/host/:code" element={<HostPage />} />
              <Route path="/study/curriculum" element={<CurriculumHome />} />
              <Route path="/study/curriculum/teachers" element={<CurriculumTeachers />} />
              <Route path="/study/curriculum/:grade" element={<CurriculumGrade />} />
              <Route path="/study/curriculum/:grade/packet" element={<CurriculumPacket />} />
              <Route path="/study/curriculum/:grade/:lessonId" element={<CurriculumLesson />} />
              <Route path="/study/young-adults" element={<YoungAdultsPage />} />
              <Route path="/study/adults" element={<YoungAdultsPage />} />
              <Route path="/study/apologetics/:id?" element={<ApologeticsPage />} />
              <Route path="/study/kids/:id?" element={<KidsPage />} />
              <Route path="/study/videos" element={<VideoLibrary />} />
              <Route path="/room" element={<RoomHome />} />
              <Route path="/room/work/:workId/:section?" element={<WorkReader />} />
              <Route path="/study/encyclopedia/:slug?" element={<EncyclopediaPage />} />
              <Route path="/study/search" element={<SearchPage />} />
              <Route path="/study/topics/:id" element={<TopicPage />} />
              <Route path="/study/books/:id?" element={<BooksPage />} />
              <Route path="/study/index" element={<IndexPage />} />
              <Route path="/study/synopsis" element={<SynopsisPage />} />
              <Route path="/study/pauline" element={<PaulinePage />} />
              <Route path="/study/people" element={<PeoplePage />} />
              <Route path="/study/themes" element={<ThemesPage />} />
              <Route path="/study/textual" element={<TextualPage />} />
              <Route path="/study/world" element={<WorldPage />} />
              <Route path="/study/voices" element={<VoicesPage />} />
              <Route path="/study/concepts" element={<ConceptsPage />} />
              <Route path="/study/manuscripts" element={<ManuscriptsPage />} />
              <Route path="/study/universe" element={<GalaxyPage />} />
              <Route path="/study/timespace" element={<TimeSpacePage />} />
              <Route path="/study/fulfilment" element={<FulfilmentPage />} />
              <Route path="/study/paths" element={<PathsIndex />} />
              <Route path="/study/path/:id" element={<PathPage />} />
              <Route path="/study/church" element={<ChurchDocs />} />
              <Route path="/study/quotations" element={<QuotationTracker />} />
              <Route path="/study/terms" element={<TermsIndex />} />
              <Route path="/study/term/:id" element={<TermPage />} />
              <Route path="/study/constellation" element={<ConstellationPage />} />
              <Route path="/study/maps" element={<MapsPage />} />
              <Route path="/study/topical" element={<TopicalPage />} />
              <Route path="/study/concordance" element={<ConcordancePage />} />
              <Route path="/study/doctrine" element={<DoctrinePage />} />
              <Route path="/study/sources" element={<SourcesPage />} />
              <Route path="/study/fathers" element={<RedirectKeepSearch to="/room" />} />
              <Route path="/study/works/:workId/:section?" element={<WorkReader />} />
              <Route path="/study/passage/:refId" element={<PassageStudy />} />
              <Route path="/study/dossier" element={<DossierPage />} />
              <Route path="/listen" element={<ListenHome />} />
              <Route path="/listen/episode/:id" element={<EpisodePage />} />
              <Route path="/pray" element={<PrayHome />} />
              <Route path="/presenter" element={<PresenterView />} />
              <Route path="/downloads" element={<DownloadsPage />} />
              <Route path="/study/lexicon" element={<LexiconPage />} />
              <Route path="/learn" element={<LearnPage />} />
              <Route path="/memento" element={<MementoPage />} />
              <Route path="/goals" element={<GoalsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/study/glossary" element={<GlossaryPage />} />
              <Route path="/study/ask" element={<AskPage />} />
              <Route path="/feast/:date?" element={<FeastCardPage />} />
              <Route path="/s/verse" element={<ShareVersePage />} />
              <Route path="/s/prayer/:id" element={<SharePrayerPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/pray/intentions" element={<IntentionsPage />} />
              <Route path="/pray/pilgrim/:id?" element={<PilgrimPage />} />
              <Route path="/pray/liturgy/:id" element={<LiturgyTextPage />} />
              <Route path="/pray/readings/:date?" element={<ReadingsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/days" element={<DaysPage />} />
              <Route path="/more" element={<MorePage />} />
              <Route path="/pray/sleep" element={<SleepPage />} />
              <Route path="/pray/office" element={<OfficePage />} />
              <Route path="/pray/liturgies" element={<LiturgiesPage />} />
              <Route path="/mass/ef" element={<MassEFPage />} />
              <Route path="/mass" element={<MassModePage />} />
              <Route path="/pray/mass-mode" element={<MassModePage />} />
              <Route path="/pray/morning" element={<MorningPage />} />
              <Route path="/pray/divine-liturgy" element={<DivineLiturgyPage />} />
              <Route path="/pray/year" element={<ChurchYearPage />} />
              <Route path="/pray/examen" element={<ExamenPage />} />
              <Route path="/pray/build" element={<SessionBuilderPage />} />
              <Route path="/pray/mass" element={<MassGuidePage />} />
              <Route path="/study/course/:id?" element={<CoursePage />} />
              <Route path="/study/story/:id?" element={<StoryPage />} />
              <Route path="/pray/novenas/:id?" element={<NovenaPage />} />
              <Route path="/pray/prayers" element={<PrayerBookPage />} />
              <Route path="/pray/examination" element={<ExaminationPage />} />
              <Route path="/pray/sunday" element={<SundayPrepPage />} />
              <Route path="/pray/devotions/:id?" element={<DevotionsPage />} />
              <Route path="/pray/life" element={<LifePage />} />
              <Route path="/study/prepare" element={<PreparePage />} />
              <Route path="/pray/lectio" element={<LectioPage />} />
              <Route path="/pray/journal" element={<JournalPage />} />
              <Route path="/pray/plans" element={<PlansPage />} />
              <Route path="/pray/plans/:id" element={<PlanPage />} />
              <Route path="/library/*" element={<LibraryHome />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/memorize" element={<MemorizePage />} />
              <Route path="/share" element={<SharePage />} />
              <Route path="/widget" element={<WidgetPage />} />
              <Route path="/session" element={<SessionPage />} />
              <Route path="/today" element={<TodayPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/attach" element={<AttachPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<Navigate replace to="/" />} />
            </Routes></Settle></ErrorBoundary>
          </Suspense>
          <MiniPlayer />
        </Shell>
        </PlayerProvider>
      </Gate>
    </EditionsProvider>
    </ToastProvider>
  );
}
