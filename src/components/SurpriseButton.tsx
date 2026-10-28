import { useNavigate } from 'react-router-dom';
import { surpriseTarget } from '../lib/surprise';

/** One tap to somewhere unexpected: a chapter, a work from the library, a novena, a devotion or a feast. */
export default function SurpriseButton({ className = 'btn' }: { className?: string }) {
  const nav = useNavigate();
  return <button className={className} onClick={() => void surpriseTarget().then((to) => nav(to))}>Surprise me</button>;
}
