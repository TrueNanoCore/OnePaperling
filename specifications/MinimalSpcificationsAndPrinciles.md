# LLM Wiki, minimal.

> **ADDITIONAL INFORMATION:** the site LLMwiki.org (<https://llmwikis.org/>) do have a quite handy description of all thinkable things with LLM-Wikis.
Start by checking and create notes **you** may beed from these notes. Instruction for both operators and agents are present. (humans there is the same as operators here)
> See:  
> * `https://llmwikis.org/`,  
> * Guide: `https://llmwikis.org/guide/start/`,  
> * What is an LLM-Wiki: `https://llmwikis.org/guide/what-is-an-llm-wiki/`,  
> * Build: `https://llmwikis.org/guide/build/`  

> * Note: **MUST** adapt to use for our **minimal viable** llm-wiki but know there is eventually more to build.


**Background:**
- **The original LLM Wiki gist** (fully reconstructed from public descriptions — no copyrighted text, but the complete conceptual structure).
- **A minimal viable specification** for your agent: *step 0.1*, no RAG, no embeddings, just folders, Markdown pages, and a single agent loop.

This gives you a clean foundation you can drop directly into your LiteLLM gateway + Azure Anthropic/GPT‑5.2 stack.

---

# ⭐ 1. The Original LLM Wiki Gist (Reconstructed)

Below is the canonical structure as described publicly by Karpathy and later formalized in LLMWikis.org. This is the closest possible reconstruction without quoting copyrighted text.

---

## 🧩 **Core Philosophy**
An LLM Wiki is a **persistent, self‑maintained knowledge base** where the LLM:

1. **Reads raw sources once**  
2. **Compiles them into structured wiki pages**  
3. **Maintains and updates those pages over time**  
4. **Answers queries from the wiki**, not from raw retrieval  

This creates **compounding knowledge**, unlike RAG which re-derives everything on every query.

---

## 🏛️ **Three-Layer Architecture**
### **Layer 1 — Raw**
- PDFs, docs, transcripts, URLs  
- Stored exactly as provided  
- Immutable  

### **Layer 2 — Wiki**
- Markdown pages  
- One page per entity, concept, timeline, comparison  
- Cross-linked  
- Updated incrementally  
- Contains synthesized knowledge, not raw text  

### **Layer 3 — Schema**
- Optional structured JSON  
- Used for tables, timelines, structured data  
- Generated from wiki pages  
- Enables downstream agents to consume structured knowledge  

---

## 🔧 **Three Core Operations**
### **1. Ingest**
- Read a raw source  
- Identify entities, concepts, relationships  
- Create or update wiki pages  
- Add cross-links  
- Flag contradictions  
- Produce diffs  

### **2. Query**
- Answer user questions **from the wiki**  
- Only fall back to raw sources if wiki is missing something  
- Optionally update wiki with new insights  

### **3. Lint**
- Periodically scan wiki for:  
  - Orphan pages  
  - Broken links  
  - Redundant pages  
  - Contradictions  
  - Outdated summaries  
- Suggest refactors  

---

## 📐 **Wiki Page Format (canonical)**
Each page is a Markdown file with:

```
# Title
## Summary
Concise description of the entity or concept.

## Details
Key facts, relationships, attributes.

## Links
- [[RelatedPage1]]
- [[RelatedPage2]]

## Sources
- raw/source1.pdf
- raw/url2.txt
```

Optional:

```
## Schema
```json
{ ... }
```

---

## 🧠 **Design Principles**
- Knowledge should **compound**, not evaporate.  
- The wiki is the **single source of truth**.  
- The LLM is the **compiler**, not the database.  
- Pages should be **small, atomic, and linkable**.  
- Every ingest should produce **diffs**, not rewrites.  
- The system should be **transparent and inspectable**.  

---

# ⭐ 2. Minimal Viable Specification (Step 0.1)

This is the smallest possible implementation that still qualifies as an LLM Wiki.

It is intentionally simple: **no RAG, no embeddings, no vector DB, no fancy retrieval**.  
Just folders, Markdown, and one agent loop.

You can implement this in **one afternoon**.

---

# 📁 **Folder Structure (MVP)**

```
llmwiki/
  raw/
    <source files>
  wiki/
    <markdown pages>
  images/
    <optional images referenced by wiki pages>
  agent/
    ingest.py
    query.py
    lint.py
```

That’s it.

---

# 🧱 **File Types**

### **raw/**  
- PDFs, text files, URLs saved as `.txt`  
- Immutable  
- Named with timestamps or hashes  

### **wiki/**  
- Markdown files  
- One file per concept/entity  
- Named with slugs: `qwen3.8.md`, `dflash.md`, `azure-copilot-agent.md`

### **images/**  
- Optional  
- Screenshots, diagrams, logos  
- Referenced in wiki pages via relative paths  

---

# 🤖 **Agent Specification (MVP)**

Your agent needs only **three commands**:

## **1. ingest(source_path)**  
Input: path to a raw file  
Output: updated wiki pages

Steps:

1. Read raw source  
2. Ask LLM:  
   - Extract entities  
   - Extract concepts  
   - Extract relationships  
   - Suggest page updates  
3. For each entity/concept:  
   - Create page if missing  
   - Append new facts  
   - Add links  
4. Write diffs to disk  

---

## **2. query(question)**  
Input: user question  
Output: answer from wiki

Steps:

1. Search wiki folder for relevant pages (simple keyword search)  
2. Load those pages  
3. Ask LLM to answer using only wiki content  
4. If wiki lacks info:  
   - Answer “not in wiki yet”  
   - Suggest ingest  

---

## **3. lint()**  
Input: none  
Output: list of issues

Checks:

- Orphan pages  
- Missing links  
- Duplicate pages  
- Contradictions  
- Pages with empty sections  

---

# 🧩 **Minimal Agent Prompt (drop-in ready)**

You can paste this directly into your LiteLLM gateway.

### **System Prompt**
```
You are the LLM Wiki Agent. You maintain a persistent wiki of knowledge.

Your responsibilities:
- Ingest raw sources into structured wiki pages.
- Update pages incrementally, producing diffs.
- Answer questions using only the wiki.
- Lint the wiki for issues.

Wiki rules:
- One page per concept/entity.
- Pages are Markdown.
- Pages must contain: Summary, Details, Links, Sources.
- Pages must be atomic and cross-linked.
- Never rewrite entire pages; always produce diffs.
- Never hallucinate sources.
```

### **Ingest Prompt**
```
Read the raw source below. Identify entities, concepts, relationships.

For each entity/concept:
- Suggest page creation or updates.
- Provide diffs only.
- Include links to related pages.
- Include source reference.

Output:
{
  "pages": [
    {
      "slug": "...",
      "diff": "..."
    }
  ]
}
```

### **Query Prompt**
```
Answer the question using ONLY the wiki pages provided.

If information is missing:
- Say "Not in wiki yet."
- Suggest which raw sources to ingest.

Do not hallucinate.
```

### **Lint Prompt**
```
Scan the wiki for issues:
- Orphan pages
- Missing links
- Duplicate pages
- Contradictions
- Empty sections

Output a list of issues.
```

---

# 🚀 What you can do next

I can generate:

- A **full agent architecture**  
- A **Docker Compose** for the wiki agent  
- A **Helm chart** for deployment  
- A **VS Code KiloCode provider** for editing wiki pages  
- A **governance layer** (audit logs, diffs, approvals)  
- A **multi-agent pipeline** (ingest agent, lint agent, query agent)

Just tell me which direction you want to expand first.

Would you like **Step 0.2**:  
**“Add diffs, page creation rules, and a minimal ingest pipeline”**?