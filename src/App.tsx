import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { EditionsProvider, useEditions } from './data/EditionsContext';
import { useSettings } from './lib/store';
import Shell from './components/Shell';
import ReadPage from './pages/ReadPage';
import { PlayerProvider } from './data/PlayerContext';
import MiniPlayer from './components/MiniPlayer';

const StudyHome = lazy(() => import('./pages/study/StudyHome'));
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
const AboutPage = lazy(() => import('./pages/AboutPage'));

function ThemeApplier() {
  const [s] = useSettings();
  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      let t = s.theme;
      if (t === 'system') t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.dataset.theme = t;
      root.dataset.margin = s.margin;
      root.style.setProperty('--read-size', `${s.fontSize}px`);
      root.style.setProperty('--read-lh', String(s.lineHeight));
      root.style.setProperty('--read-font', s.fontFamily === 'serif' ? 'var(--font-serif)' : 'var(--font-sans)');
      const meta = document.querySelector('meta[name="theme-color"]');
      meta?.setAttribute('content', t === 'dark' ? '#17140f' : t === 'sepia' ? '#efe3c8' : '#fbf8f3');
    };
    apply();
    const mq = matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [s.theme, s.margin, s.fontSize, s.lineHeight, s.fontFamily]);
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

export default function App() {
  return (
    <EditionsProvider>
      <ThemeApplier />
      <Gate>
        <PlayerProvider>
        <Shell>
          <Suspense fallback={<div className="center-note">Loading…</div>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/read" element={<Home />} />
              <Route path="/read/:edition/:book/:chapter" element={<ReadPage />} />
              <Route path="/study" element={<StudyHome />} />
              <Route path="/study/search" element={<SearchPage />} />
              <Route path="/study/topics/:id" element={<TopicPage />} />
              <Route path="/study/doctrine" element={<DoctrinePage />} />
              <Route path="/study/sources" element={<SourcesPage />} />
              <Route path="/study/fathers" element={<FathersLibrary />} />
              <Route path="/study/works/:workId/:section?" element={<WorkReader />} />
              <Route path="/study/passage/:refId" element={<PassageStudy />} />
              <Route path="/listen" element={<ListenHome />} />
              <Route path="/listen/episode/:id" element={<EpisodePage />} />
              <Route path="/pray" element={<PrayHome />} />
              <Route path="/pray/readings/:date?" element={<ReadingsPage />} />
              <Route path="/pray/lectio" element={<LectioPage />} />
              <Route path="/pray/journal" element={<JournalPage />} />
              <Route path="/pray/plans" element={<PlansPage />} />
              <Route path="/pray/plans/:id" element={<PlanPage />} />
              <Route path="/library/*" element={<LibraryHome />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<Navigate replace to="/" />} />
            </Routes>
          </Suspense>
          <MiniPlayer />
        </Shell>
        </PlayerProvider>
      </Gate>
    </EditionsProvider>
  );
}
