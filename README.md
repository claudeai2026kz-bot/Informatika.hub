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

## Қосымша баптауды қажет ететін функциялар

| Функция | Не керек |
|---|---|
| Құпиясөзді email арқылы қалпына келтіру | `RESEND_API_KEY`, `MAIL_FROM`, `APP_URL` |
| Файлдарды хостингте сақтау | Қазір `STORAGE_DIR` дискісінде. Vercel үшін `src/lib/storage.ts` модулін S3 / Supabase Storage-ке ауыстыру керек |
| PPTX / DOCX алдын ала қарау | Әкімші файлмен бірге PDF нұсқасын жүктейді (немесе серверде LibreOffice орнату) |
| Генеративті AI робот | Қазір сайт ішіндегі іздеумен жұмыс істейді. AI үшін серверде API кілті керек |
