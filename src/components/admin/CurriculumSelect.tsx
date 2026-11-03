"use client";
import { useState } from "react";
import { GRADES, QUARTER_LABELS } from "@/lib/labels";

export type TopicOpt = { id: number; title: string; grade: number; quarter: number };

/** Сынып → тоқсан → тақырып тәуелді таңдау. */
export default function CurriculumSelect({ topics, grade: g0, quarter: q0, topicId: t0, withQuarter = true }: { topics: TopicOpt[]; grade?: number; quarter?: number; topicId?: number | null; withQuarter?: boolean }) {
  const [grade, setGrade] = useState(g0 ?? 0);
  const [quarter, setQuarter] = useState(q0 ?? 0);
  const [topic, setTopic] = useState(t0 ?? 0);
  const list = topics.filter((t) => t.grade === grade && (!withQuarter || t.quarter === quarter));
  return (
    <div className={`grid gap-3 ${withQuarter ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
      <div>
        <label className="label" htmlFor="grade">Сынып *</label>
        <select id="grade" name="grade" className="input" value={grade} onChange={(e) => { setGrade(+e.target.value); setTopic(0); }} required>
          <option value={0} disabled>Таңдаңыз</option>
          {GRADES.map((g) => <option key={g} value={g}>{g}-сынып</option>)}
        </select>
      </div>
      {withQuarter && (
        <div>
          <label className="label" htmlFor="quarter">Тоқсан *</label>
          <select id="quarter" name="quarter" className="input" value={quarter} onChange={(e) => { setQuarter(+e.target.value); setTopic(0); }} required>
            <option value={0} disabled>Таңдаңыз</option>
            {[1, 2, 3, 4].map((q) => <option key={q} value={q}>{QUARTER_LABELS[q]}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="label" htmlFor="topicId">Тақырып</label>
        <select id="topicId" name="topicId" className="input" value={topic} onChange={(e) => setTopic(+e.target.value)} disabled={!grade || (withQuarter && !quarter)}>
          <option value={0}>{list.length ? "Тақырыпсыз" : "Тақырып жоқ"}</option>
          {list.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </select>
      </div>
    </div>
  );
}

