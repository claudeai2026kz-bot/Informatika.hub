"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[60vh] grid place-items-center px-4 text-center">
      <div>
        <h1 className="text-2xl font-bold">Бірдеңе дұрыс болмады</h1>
        <p className="mt-2 muted">Бетті жүктеу кезінде қате шықты. Қайталап көріңіз.</p>
        <button onClick={reset} className="btn-primary mt-6">Қайталау</button>
      </div>
    </div>
  );
}
