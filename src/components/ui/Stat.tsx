import CountUp from './CountUp';

interface StatProps {
  to: number;
  suffix?: string;
  label: string;
}

/** Industrial numeric stat: Newsreader count-up number + muted label. */
export default function Stat({ to, suffix, label }: StatProps) {
  return (
    <div data-reveal="" className="text-center pl-5 border-l border-line">
      <div className="font-serif font-semibold leading-none text-deep text-[clamp(36px,4vw,52px)]">
        <CountUp to={to} suffix={suffix} />
      </div>
      <div className="mt-2 text-[13.5px] text-muted tracking-[0.01em]">{label}</div>
    </div>
  );
}
