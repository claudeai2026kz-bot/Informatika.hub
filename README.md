# Informatika Hub

5–11 сынып информатика мұғалімдеріне арналған қазақ тіліндегі цифрлық платформа.

**Стек:** Next.js 15 (App Router), TypeScript, Tailwind CSS, PostgreSQL, Prisma.

## GitHub Codespaces арқылы бір батырмамен ашу

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/claudeai2026kz-bot/Informatika.hub)

Codespace ашылғанда база мен үлгі деректер өзі орнатылады, сайт 3000-портта ашылады.
Сынақ әкімші: `admin@informatika.kz` / `Admin12345` (тек осы сынақ ортасы үшін).

## Іске қосу

```bash
npm install
cp .env.example .env          # DATABASE_URL мәнін өз базаңызға өзгертіңіз
npx prisma db push            # кестелерді жасау
ADMIN_EMAIL=you@mail.kz ADMIN_PASSWORD='Құпия123' npm run db:seed   # рөлдер, сыныптар, бірінші әкімші
npm run dev
```

## Интернетке шығару (Vercel + Supabase, тегін)

1. **Supabase**: жаңа жоба ашыңыз. Storage → New bucket → атауы `files`, **Public емес** (жабық).
   Project Settings → Database → Connection string → **Session pooler** URI-ін көшіріңіз (құпиясөзді қойыңыз).
   Project Settings → API → `Project URL` және `service_role` кілтін көшіріңіз.
2. **Vercel**: GitHub арқылы кіріп, осы репозиторийді Import етіңіз. Environment Variables:
   `DATABASE_URL` (Supabase URI), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `APP_URL`.
3. Deploy. `vercel-build` кестелерді жасайды, сыныптар мен тақырыптарды және әкімшіні қосады.

Файлдарды браузер тікелей Supabase-ке жүктейді (Vercel-дегі 4.5 МБ шегін айналып өту үшін), сервер файлдың түрін тексереді. Жүктеу сілтемелері қысқа мерзімді және тек рұқсаты барларға беріледі.

## Қосымша баптауды қажет ететін функциялар

| Функция | Не керек |
|---|---|
| Құпиясөзді email арқылы қалпына келтіру | `RESEND_API_KEY`, `MAIL_FROM`, `APP_URL` |
| Файлдарды хостингте сақтау | Қазір `STORAGE_DIR` дискісінде. Vercel үшін `src/lib/storage.ts` модулін S3 / Supabase Storage-ке ауыстыру керек |
| PPTX / DOCX алдын ала қарау | Әкімші файлмен бірге PDF нұсқасын жүктейді (немесе серверде LibreOffice орнату) |
| Генеративті AI робот | Қазір сайт ішіндегі іздеумен жұмыс істейді. AI үшін серверде API кілті керек |

## Робот-көмекшінің қазақша дауысы

Тегін, тіркелусіз: ашық MMS-TTS (kaz) моделі (Meta, CC-BY-NC 4.0). Жиі айтылатын сөздер `public/tts/kaz/clips` ішінде алдын ала жазылған (бірден ойнайды), қалғанын модель браузердің өзінде (`public/tts/kaz/model_q8.onnx`, Web Worker) дауысқа айналдырады. Жаңа материал көп қосылса, `scripts/voice-gen.py` басындағы нұсқаулық бойынша дауыстарды қайта жазыңыз.
