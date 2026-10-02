# IntelliDoc Studio

A browser-first MVP for a unified PDF/Word editor and JEE/GATE study workspace.

## Current MVP

- Word/Acrobat-style workspace: Documents, PDF Editor, AI, Study, PYQs, Practice, Mocks, and Analytics.
- Faithful PDF source rendering with PDF.js, alongside a separately editable semantic reconstruction.
- Editable DOCX/HTML/RTF/Markdown/text import paths, OCR, document tools, and student PDF extraction.
- Reversible AI action previews, local checkpoints, command palette, and a JEE/GATE knowledge-graph-oriented study dashboard.

## Run locally

```bash
./run.sh
```

Open `http://localhost:8080`.

## Product boundaries

Exact PDF visual fidelity is provided by the original PDF preview. Editing takes place in the semantic reconstruction, then requires a dedicated export/layout service for production-grade PDF round-tripping. Real-time collaboration, permanent redaction, encryption, legally binding eSign, and server-backed AI require backend services and credentials; the current UI provides the client-side MVP foundation for those layers.
