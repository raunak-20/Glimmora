# Development Chatbot - Visual Guide

## Enhanced User Interface

### Top Section - Features Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   📝 Knowledge Base | RAG Q&A                                   │
│   Upload code files, PDFs, or markdown documents, then ask     │
│   questions about your codebase using AI-powered retrieval.    │
│                                                                 │
│   ← Back to Chat                              Sign out [danger] │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┬─────────────┬──────────────────────────────────────┐
│ 💻 Code-    │ ⚡ Multi-   │ 🧠 AI-Powered                       │
│ Aware       │ Language    │                                      │
│             │             │                                      │
│ Detects     │ Query       │ Gemini LLM                           │
│ programming │ across      │ understands code                     │
│ languages   │ Python, JS, │ context                             │
│ automatically│ TS, Go...  │                                      │
└──────────────┴─────────────┴──────────────────────────────────────┘
```

### Left Sidebar - Upload & Document List

```
┌──────────────────────────────────────┐
│ 📤 Upload document                   │ [Uploading]
│ PDF, Markdown, code files, or text. │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ 📁 Choose or drop a file         │ │
│ │ Click to browse · PDF, MD, Code  │ │
│ └──────────────────────────────────┘ │
│                                      │
│ [Upload to knowledge base]           │
│                                      │
├──────────────────────────────────────┤
│ 📚 Uploaded documents                │
│ Currently indexed for this account.  │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ app.py                           │ │ [ready]
│ │ ready · 3 chunks · python        │ │
│ ├──────────────────────────────────┤ │
│ │ utils.js                         │ │ [ready]
│ │ ready · 2 chunks · javascript    │ │
│ ├──────────────────────────────────┤ │
│ │ types.ts                         │ │ [ready]
│ │ ready · 1 chunk · typescript     │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ─────────────────────────────────── │
│ Knowledge Base                       │
│ [python] [javascript] [typescript]   │
│                          6 chunks    │
│                                      │
└──────────────────────────────────────┘
```

### Right Panel - Q&A Section

```
┌──────────────────────────────────────────────────────────┐
│ ❓ Ask a question                              Top K: [4] │
│ Code-aware queries powered by Gemini AI using your      │
│ knowledge base.                                          │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ Question:                                                │
│ ┌────────────────────────────────────────────────────────┐
│ │ What does the authentication function do?             │
│ │                                                        │
│ │                                                        │
│ └────────────────────────────────────────────────────────┘
│                                                          │
│ [  🔄 Thinking…  ] or [ Ask question ]                 │
│                                                          │
├──────────────────────────────────────────────────────────┤
│ 📝 Answer                 🔗 Sources                      │
│                           [python] [javascript]          │
│ The authentication        Results: 3                     │
│ function handles user     ──────────────────────         │
│ login by...              │ auth.py       [python]      │
│                          ├─────────────────────────     │
│ - Validates credentials  │ login.js      [javascript]  │
│ - Creates JWT token      ├─────────────────────────     │
│ - Stores in database     │ session.py    [python]      │
│ - Returns user data      └─────────────────────────     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Color Scheme & Visual Elements

### Language Badges

```
[python]        - Indigo with code syntax styling
[javascript]    - Indigo with code syntax styling
[typescript]    - Indigo with code syntax styling
[java]          - Indigo with code syntax styling
```

### Status Indicators

```
✓ ready         - Green badge (document ready for queries)
! error         - Red badge (processing failed)
⟳ uploading     - Blue badge (currently processing)
```

### Cards & Sections

```
╔═══════════════════════════════════╗
║ 📚 Card Title                     ║  Glassmorphic design
║ Card subtitle or description      ║  Rounded corners (12-20px)
║                                   ║  Backdrop blur effect
║ • Content item                    ║  Subtle borders
║ • Another item                    ║  Dark background
╚═══════════════════════════════════╝
```

### Feature Info Cards

```
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ 💻 Code-Aware  │  │ ⚡ Multi-Lang  │  │ 🧠 AI-Powered │
│                │  │                │  │                │
│ Detects prog.  │  │ Query across   │  │ Gemini LLM     │
│ languages      │  │ Python, JS,    │  │ understands    │
│ automatically  │  │ TS, Go, Rust   │  │ code context   │
└────────────────┘  └────────────────┘  └────────────────┘
```

## Responsive Breakpoints

### Desktop (> 1100px)

- Sidebar: 340px fixed width
- Main content: Flexible
- 2-column layout for answer + sources

### Tablet (900px - 1100px)

- Sidebar items side-by-side
- Answer + Sources stacked
- Features on single line

### Mobile (< 640px)

- Sidebar vertically stacked
- Full width inputs
- Optimized touch targets

## Interactive Elements

### Buttons

```
[Upload to knowledge base]      - Cyan gradient
[Ask question]                  - Violet gradient
[← Back to chat]                - Ghost style
[Sign out]                      - Danger red
```

### Animations

```
Hover effects:      0.15s transitions
Loading spinners:   0.7s rotation
Drag & drop:        Visual feedback on hover
Transitions:        Smooth opacity & color changes
```

## Data Flow Visualization

```
User Action                 → Backend Processing       → UI Update
─────────────────────────────────────────────────────────────────
1. Upload file.py           Detect: python             Show badge
                            Create chunks (3)           Show count
                            Store in DB                Display in list
                            Index in FAISS

2. Upload file.js           Detect: javascript         Show badge
                            Create chunks (2)          Show count
                            Update KB stats            Display languages

3. Ask question             Retrieve chunks            Show sources
   "Auth flow?"             Language detection         Show badges
                            Generate answer            Display languages
                            Format response            Show result count
```

## State Management Flow

```
Component State:
├── documents[]              Files uploaded
├── sourceLanguages[]        Languages from query results
├── sources[]                Source file names
├── answer                   LLM response
├── asking                   Loading state
├── uploading                Upload progress
├── question                 User input
├── topK                      Similarity search parameter
└── error/success            Notifications

Updates flow:
1. User selects file → setSelectedFile()
2. Upload triggers → Calls API → Updates documents[]
3. Query submitted → API call → Sets sourceLanguages[], sources[], answer
4. Results render → Show badges, stats, answer
```

## Accessibility Features

- Color contrast ratios > 4.5:1
- Focus indicators on all interactive elements
- Keyboard navigation support
- Semantic HTML structure
- ARIA labels where needed
- Responsive text sizing

## Typography

```
Title (h1):           22px, 600 weight, line-height: 1
Subtitle (h2):        15px, 600 weight
Body text:            14px, normal weight
Labels:               11px, 500 weight, uppercase, letter-spacing: 0.3em
Small text:           10.5px, normal weight
Code/monospace:       13px-13.5px (for answers)
```

---

This enhanced UI showcases all the development chatbot features while maintaining:

- Clean, modern design
- Professional appearance
- Full accessibility
- Intuitive user experience
- Clear information hierarchy
