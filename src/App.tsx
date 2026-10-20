import { lazy, Suspense, useEffect } from 'react';
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
import { scheduleReminder } from './liturgy/reminders';

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
const FathersLibrary = lazy(() => import('./pages/study/FathersLibrary'));
const WorkReader = lazy(() => import('./pages/study/WorkReader'));
const PassageStudy = lazy(() => import('./pages/study/PassageStudy'));
const ListenHome = lazy(() => import('./pages/listen/ListenHome'));
const EpisodePage = lazy(() => import('./pages/listen/EpisodePage'));
const PrayHome = lazy(() => import('./pages/pray/PrayHome'));
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
      root.dataset.motion = s.motion;
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

export default function App() {
  const loc = useLocation();
  useEffect(() => {
    // a page chunk that no longer exists (the app was updated under an open tab): reload once to get the new one
    const h = (e: Event) => { e.preventDefault(); try { if (!sessionStorage.getItem('sb-reloaded')) { sessionStorage.setItem('sb-reloaded', '1'); location.reload(); } } catch { location.reload(); } };
    window.addEventListener('vite:preloadError', h);
    return () => window.removeEventListener('vite:preloadError', h);
  }, []);
  useEffect(() => {
    initSync();
    scheduleReminder();
  }, []);
  return (
    <ToastProvider>
    <EditionsProvider>
      <ThemeApplier />
      <Gate>
        <PlayerProvider>
        <Shell>
          <Suspense fallback={<div className="center-note">Loading…</div>}>
            <ErrorBoundary resetKey={loc.pathname}><Settle><Routes>
              <Route path="/" element={<TodayPage />} />
              <Route path="/read" element={<Home />} />
              <Route path="/read/:edition/:book/:chapter" element={<ReadPage />} />
              <Route path="/study" element={<StudyHome />} />
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
              <Route path="/study/fathers" element={<FathersLibrary />} />
              <Route path="/study/works/:workId/:section?" element={<WorkReader />} />
              <Route path="/study/passage/:refId" element={<PassageStudy />} />
              <Route path="/listen" element={<ListenHome />} />
              <Route path="/listen/episode/:id" element={<EpisodePage />} />
              <Route path="/pray" element={<PrayHome />} />
              <Route path="/pray/readings/:date?" element={<ReadingsPage />} />
              <Route path="/more" element={<MorePage />} />
              <Route path="/pray/sleep" element={<SleepPage />} />
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
