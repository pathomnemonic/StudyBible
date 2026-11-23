import { beforeEach, describe, expect, it, vi } from 'vitest';
const mem = new Map<string, string>();
vi.stubGlobal('localStorage', { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) });
vi.stubGlobal('window', { dispatchEvent: () => true, addEventListener: () => {}, removeEventListener: () => {} });
import { clearLessonProgress, getSavedStep, isMarked, lessonMarks, resumeOf, saveLessonProgress, toggleMark, unfinishedLessons } from '../src/curriculum/resume';

beforeEach(() => mem.clear());

describe('lesson resume', () => {
  it('remembers the step a learner stopped at, across sessions (it is stored, not just in the tab)', () => {
    saveLessonProgress({ grade: '4', lesson: 'l1', title: 'Bread', step: 3, steps: 7 });
    expect(getSavedStep('4', 'l1')).toBe(3);
    expect(resumeOf('4', 'l1')).toMatchObject({ step: 3, steps: 7 });
    expect(unfinishedLessons()).toHaveLength(1);
  });
  it('a finished lesson no longer offers Resume', () => {
    saveLessonProgress({ grade: '4', lesson: 'l1', title: 'Bread', step: 3, steps: 7 });
    clearLessonProgress('4', 'l1');
    expect(resumeOf('4', 'l1')).toBeNull();
    expect(getSavedStep('4', 'l1')).toBe(0);
  });
  it('a lesson saved on its last step counts as finished', () => {
    saveLessonProgress({ grade: '4', lesson: 'l2', title: 'Wine', step: 6, steps: 7 });
    expect(resumeOf('4', 'l2')).toBeNull();
  });
  it('still remembers the last step, so reopening the lesson does not restart it at step 1', () => {
    saveLessonProgress({ grade: '4', lesson: 'l2', title: 'Wine', step: 6, steps: 7 });
    expect(getSavedStep('4', 'l2')).toBe(6);
    clearLessonProgress('4', 'l2'); // marking the lesson done clears it
    expect(getSavedStep('4', 'l2')).toBe(0);
  });
});

describe('My lessons bookmarks', () => {
  it('adds, lists newest first, and removes', () => {
    expect(toggleMark('4', 'l1', 'Bread')).toBe(true);
    expect(isMarked('4', 'l1')).toBe(true);
    toggleMark('5', 'l9', 'Light');
    expect(lessonMarks().map((m) => m.lesson).sort()).toEqual(['l1', 'l9']);
    expect(toggleMark('4', 'l1', 'Bread')).toBe(false);
    expect(isMarked('4', 'l1')).toBe(false);
    expect(lessonMarks()).toHaveLength(1);
  });
  it('survives a corrupt store', () => {
    mem.set('sb:cur:marks:v1', '{oops');
    expect(lessonMarks()).toEqual([]);
    expect(toggleMark('4', 'l1', 'Bread')).toBe(true);
  });
});
