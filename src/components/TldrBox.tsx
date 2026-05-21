interface TldrBoxProps {
  text: string;
}

export function TldrBox({ text }: TldrBoxProps) {
  return (
    <div className="tldr-box direct-answer bg-primary/5 border border-primary/20 rounded-lg px-5 py-4 mb-8 max-w-2xl">
      <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">Vastaus lyhyesti</p>
      <p className="text-sm text-foreground leading-relaxed">{text}</p>
    </div>
  );
}
