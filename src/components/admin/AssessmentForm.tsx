"use client";
import Link from "next/link";
import { useActionState } from "react";
import { saveAssessment } from "@/app/actions/admin";
import { FormAlert } from "../ui/Field";
import SubmitButton from "../ui/SubmitButton";
import CurriculumSelect, { type TopicOpt } from "./CurriculumSelect";

type A = { id: string; kind: string; title: string; description: string; grade: number; quarter: number; topicId: number | null; variant: string; answers: string | null; criteria: string | null; descriptors: string | null; published: boolean; fileName: string | null; hasAnswersFile: boolean } | null;
const fileCls = "block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-sky-100 file:px-3 file:py-2 file:font-semibold file:text-sky-600";

export default function AssessmentForm({ a, topics }: { a: A; topics: TopicOpt[] }) {
  const [state, action] = useActionState(saveAssessment, undefined);
  return (
    <form action={action} className="card p-6 sm:p-8 space-y-5 max-w-3xl">
      <FormAlert msg={state?.error} />
      {a && <input type="hidden" name="id" value={a.id} />}
      <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
        <div><label className="label" htmlFor="title">Атауы *</label><input id="title" name="title" className="input" defaultValue={a?.title} required /></div>
        <div><label className="label" htmlFor="kind">Түрі *</label><select id="kind" name="kind" className="input" defaultValue={a?.kind ?? "BZHB"}><option value="BZHB">БЖБ</option><option value="TZHB">ТЖБ</option></select></div>
      </div>
      <div><label className="label" htmlFor="description">Сипаттамасы</label><textarea id="description" name="description" rows={3} className="input" defaultValue={a?.description} /></div>
      <CurriculumSelect topics={topics} grade={a?.grade} quarter={a?.quarter} topicId={a?.topicId} />
      <div className="max-w-xs"><label className="label" htmlFor="variant">Нұсқа</label><input id="variant" name="variant" className="input" defaultValue={a?.variant ?? "1-нұсқа"} /></div>
      <fieldset className="rounded-xl border border-sky-100 p-4 space-y-4">
        <legend className="px-1 text-sm font-semibold">Файлдар</legend>
        <div><label className="label" htmlFor="file">Тапсырма файлы {a ? "" : "*"}</label>{a?.fileName && <p className="text-xs muted mb-1">Қазіргі: <b>{a.fileName}</b></p>}<input id="file" name="file" type="file" accept=".pdf,.docx,.pptx,.zip" className={fileCls} /></div>
        <div><label className="label" htmlFor="preview">Алдын ала қарауға арналған PDF (DOCX болса)</label><input id="preview" name="preview" type="file" accept=".pdf" className={fileCls} /></div>
        <div><label className="label" htmlFor="answersFile">Жауаптар файлы</label>{a?.hasAnswersFile && <p className="text-xs muted mb-1">Жауаптар файлы бар</p>}<input id="answersFile" name="answersFile" type="file" accept=".pdf,.docx,.zip" className={fileCls} /></div>
      </fieldset>
      <div><label className="label" htmlFor="answers">Жауаптар (мәтін)</label><textarea id="answers" name="answers" rows={4} className="input font-mono text-sm" defaultValue={a?.answers ?? ""} /></div>
      <div><label className="label" htmlFor="criteria">Бағалау критерийлері</label><textarea id="criteria" name="criteria" rows={3} className="input" defaultValue={a?.criteria ?? ""} /></div>
      <div><label className="label" htmlFor="descriptors">Дескрипторлар</label><textarea id="descriptors" name="descriptors" rows={4} className="input" defaultValue={a?.descriptors ?? ""} /></div>
      <label className="flex items-center gap-3 rounded-xl bg-sky-50 p-4 cursor-pointer"><input type="checkbox" name="published" defaultChecked={a?.published ?? true} className="h-5 w-5 accent-sky-500" /><span className="font-semibold">Жариялау</span></label>
      <div className="flex gap-2"><SubmitButton className="btn-primary" pendingText="Сақталып жатыр…">Сақтау</SubmitButton><Link href="/admin/assessments" className="btn-ghost">Болдырмау</Link></div>
    </form>
  );
}
