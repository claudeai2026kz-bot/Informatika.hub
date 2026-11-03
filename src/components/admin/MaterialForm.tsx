"use client";
import Link from "next/link";
import { useActionState } from "react";
import { saveMaterial } from "@/app/actions/admin";
import { MATERIAL_TYPES } from "@/lib/labels";
import { FormAlert } from "../ui/Field";
import SubmitButton from "../ui/SubmitButton";
import CurriculumSelect, { type TopicOpt } from "./CurriculumSelect";

type M = { id: string; title: string; description: string; typeKey: string; grade: number; quarter: number; topicId: number | null; videoUrl: string | null; externalUrl: string | null; published: boolean; fileName: string | null; hasPreview: boolean } | null;

export default function MaterialForm({ m, topics }: { m: M; topics: TopicOpt[] }) {
  const [state, action] = useActionState(saveMaterial, undefined);
  return (
    <form action={action} className="card p-6 sm:p-8 space-y-5 max-w-3xl">
      <FormAlert msg={state?.error} />
      {m && <input type="hidden" name="id" value={m.id} />}
      <div><label className="label" htmlFor="title">Материал атауы *</label><input id="title" name="title" className="input" defaultValue={m?.title} required maxLength={200} /></div>
      <div><label className="label" htmlFor="description">Сипаттамасы</label><textarea id="description" name="description" rows={4} className="input" defaultValue={m?.description} maxLength={3000} /></div>
      <div>
        <label className="label" htmlFor="typeKey">Материал түрі *</label>
        <select id="typeKey" name="typeKey" className="input" defaultValue={m?.typeKey ?? ""} required>
          <option value="" disabled>Таңдаңыз</option>
          {MATERIAL_TYPES.map((t) => <option key={t.key} value={t.key}>{t.one}</option>)}
        </select>
      </div>
      <CurriculumSelect topics={topics} grade={m?.grade} quarter={m?.quarter} topicId={m?.topicId} />
      <fieldset className="rounded-xl border border-sky-100 p-4 space-y-4">
        <legend className="px-1 text-sm font-semibold">Файлдар</legend>
        <div>
          <label className="label" htmlFor="file">Негізгі файл (PDF, PPTX, DOCX, XLSX, ZIP, сурет, MP4 · 50 МБ дейін)</label>
          {m?.fileName && <p className="text-xs muted mb-1">Қазіргі файл: <b>{m.fileName}</b>. Жаңасын жүктесеңіз, ауыстырылады.</p>}
          <input id="file" name="file" type="file" accept=".pdf,.pptx,.docx,.xlsx,.zip,.png,.jpg,.jpeg,.webp,.mp4" className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-sky-100 file:px-3 file:py-2 file:font-semibold file:text-sky-600" />
        </div>
        <div>
          <label className="label" htmlFor="preview">Алдын ала қарауға арналған PDF (PPTX/DOCX үшін ұсынылады)</label>
          <input id="preview" name="preview" type="file" accept=".pdf" className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-lilac-100 file:px-3 file:py-2 file:font-semibold file:text-lilac-500" />
          {m?.hasPreview && <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" name="removePreview" /> Қазіргі алдын ала қарау нұсқасын өшіру</label>}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="videoUrl">Видео сілтемесі (YouTube, Vimeo)</label><input id="videoUrl" name="videoUrl" type="url" className="input" defaultValue={m?.videoUrl ?? ""} placeholder="https://youtube.com/watch?v=…" /></div>
        <div><label className="label" htmlFor="externalUrl">Сыртқы сілтеме</label><input id="externalUrl" name="externalUrl" type="url" className="input" defaultValue={m?.externalUrl ?? ""} placeholder="https://…" /></div>
      </div>
      <label className="flex items-center gap-3 rounded-xl bg-sky-50 p-4 cursor-pointer">
        <input type="checkbox" name="published" defaultChecked={m?.published ?? true} className="h-5 w-5 accent-sky-500" />
        <span><span className="font-semibold block">Жариялау</span><span className="text-sm muted">Белгіленбесе, материал жоба ретінде сақталады және тек әкімшіге көрінеді.</span></span>
      </label>
      <div className="flex gap-2">
        <SubmitButton className="btn-primary" pendingText="Сақталып жатыр…">{m ? "Сақтау" : "Материал қосу"}</SubmitButton>
        <Link href="/admin/materials" className="btn-ghost">Болдырмау</Link>
      </div>
    </form>
  );
}
