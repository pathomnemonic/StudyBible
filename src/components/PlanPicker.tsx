import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from './Modal';
import { useEditions } from '../data/EditionsContext';
import { builtinPlans, type PlanDef } from '../plans/builtin';
import { choosePlan } from '../lib/activePlan';
import { useSettings } from '../lib/store';

/** Switch the reading plan you follow in one tap: the Bible in a Year podcast first, then the other plans. Nothing else pops up. */
export default function PlanPicker({ onClose }: { onClose: () => void }) {
  const { get } = useEditions();
  const [s] = useSettings();
  const [plans, setPlans] = useState<PlanDef[]>([]);
  const v = get('vulgate');
  useEffect(() => { if (v) void builtinPlans(v).then((l) => setPlans(l.filter((p) => p.category !== 'seasonal'))); }, [v?.id]);
  const ordered = [...plans.filter((p) => p.id === 'biay'), ...plans.filter((p) => p.id !== 'biay')];
  return (
    <Modal title="Your reading plan" onClose={onClose}>
      <ul className="plan-pick" role="radiogroup" aria-label="Reading plan">
        {ordered.map((p) => (
          <li key={p.id}>
            <button className={`plan-opt${s.activePlan === p.id ? ' on' : ''}`} role="radio" aria-checked={s.activePlan === p.id} onClick={() => { choosePlan(p.id); onClose(); }}>
              <span className="plan-opt-t">{p.name}{p.id === 'biay' ? ' · default' : ''}</span>
              <span className="plan-opt-d">{p.days.length} days{p.description ? ` · ${p.description.slice(0, 80)}${p.description.length > 80 ? '…' : ''}` : ''}</span>
            </button>
          </li>
        ))}
        <li><button className={`plan-opt${!s.activePlan ? ' on' : ''}`} role="radio" aria-checked={!s.activePlan} onClick={() => { choosePlan(''); onClose(); }}><span className="plan-opt-t">No plan</span><span className="plan-opt-d">Just read; nothing to keep up with.</span></button></li>
      </ul>
      <p className="small"><Link to="/pray/plans" onClick={onClose}>All plans, with previews and your own</Link></p>
    </Modal>
  );
}
