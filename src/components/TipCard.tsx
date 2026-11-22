import { TIP_URL, tipVisible } from '../lib/tip';

/** "Leave a tip": a plain link. Everything in the app stays free; this is only a way to say thanks. */
export default function TipCard() {
  if (!tipVisible()) return null;
  return (
    <div className="card" id="tip">
      <h2 className="card-title">Leave a tip</h2>
      <p className="small">Everything in this app is free, with no paywalls and nothing locked, and it always will be. If it has helped you and you would like to say thanks, you can leave a tip. It is entirely optional.</p>
      <a className="btn" href={TIP_URL} target="_blank" rel="noopener noreferrer">Leave a tip (opens Ko-fi)</a>
    </div>
  );
}
