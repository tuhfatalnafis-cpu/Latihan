import React from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { AlertTriangle } from 'lucide-react';

export default function UnsupportedFormat({ type, onSkip }: { type: string, onSkip: () => void }) {
  return (
    <div className="w-full max-w-md px-4 py-20 flex flex-col items-center animate-in zoom-in duration-300">
      <Card className="text-center p-12 bg-white" padding="lg">
        <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-amber-500">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-ink mb-2">Format Tidak Disokong</h2>
        <p className="text-ink-muted font-bold mb-10">
          Format soalan <span className="text-primary">'{type}'</span> belum tersedia dalam versi ini.
        </p>
        <Button size="lg" className="w-full" onClick={onSkip}>
          Langkau Soalan Ini
        </Button>
      </Card>
    </div>
  );
}
