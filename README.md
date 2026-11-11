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
| Құпиясөзді email арқылы қалпына келтіру | Gmail: `SMTP_USER`, `SMTP_PASS` (қолданба құпиясөзі), `APP_URL`; немесе Resend: `RESEND_API_KEY`, `MAIL_FROM` |
| Файлдарды хостингте сақтау | Қазір `STORAGE_DIR` дискісінде. Vercel үшін `src/lib/storage.ts` модулін S3 / Supabase Storage-ке ауыстыру керек |
| PPTX / DOCX алдын ала қарау | Әкімші файлмен бірге PDF нұсқасын жүктейді (немесе серверде LibreOffice орнату) |
| Генеративті AI робот | Қазір сайт ішіндегі іздеумен жұмыс істейді. AI үшін серверде API кілті керек |

## Робот-көмекшінің қазақша дауысы

Тегін, тіркелусіз: **ISSAI KazakhTTS2** дауысы (Piper `kk_KZ-issai-high`, 3-диктор `ISSAI_KazakhTTS2_F3`, әйел), лицензиясы CC-BY-4.0 (ISSAI, Назарбаев университеті).

- Робот айтатын сөйлемдер (`public/tts/kk-issai/phrases.json`) алдын ала жазылған: барлығы бір `clips.bin` файлында, ал `clips.json` әр сөйлемнің сол файлдағы орнын береді. Бірден ойнайды.
- Тізімде жоқ жаңа сөйлемдерді сол дауыс браузердің өзінде дыбысқа айналдырады (`src/lib/kk-piper.worker.ts`). Модель (~128 МБ) Hugging Face-тен тек керек кезде бір рет жүктеліп, браузерде сақталады.
- Дауыстың жылдамдығы мен дикторы `src/lib/kk-piper.worker.ts` ішіндегі `VOICE` баптауында.
- Жаңа сөйлемдерді алдын ала жазу: `npm run dev` іске қосулы кезде `phrases.json`-ға сөйлемдерді қосып, браузерде генераторды іске қосады да, `POST /api/dev-voice?build=1` арқылы `clips.bin`/`clips.json` қайта жиналады (`src/app/api/dev-voice` тек әзірлеу режимінде жұмыс істейді).
- Ескі MMS дауысы (`public/tts/kaz`, `src/lib/kk-tts.worker.ts`) енді қолданылмайды, оларды өшіруге болады.
