# VibeBite 🍽️✨

**VibeBite** is an AI-powered culinary research engine that bridges the gap between _human emotion_ and _molecular gastronomy_. By synthesizing **Generative AI (Gemini 2.5)** with scientific flavor databases (**FlavorDB**), VibeBite translates abstract moods into scientifically validated recipe recommendations.

![VibeBite Hero](https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80)
_(Note: Replace with actual screenshot)_

---

## 🧠 Core Intelligence: The RAG & Gen AI Pipeline

VibeBite is not just a keyword searcher. It uses a **Retrieval-Augmented Generation (RAG)** pipeline to understand the _science_ behind your cravings.

### 1. The Mood-to-Molecule Bridge (Gemini 2.5 Flash)

When a user inputs a vibe (e.g., "Post-workout clarity" or "Rainy day blues"), the system doesn't just look for "soup".

- **Input**: User Mood.
- **RAG Context**: The system loads `src/data/custom-rules.json`, a curated knowledge base of cultural and scientific food associations.
- **Generative Analysis**: **Gemini 2.5 Flash** analyzes the mood against this context to determine _why_ certain ingredients fit.
  - _Example_: "Dark chocolate contains theobromine, which aligns with 'focus' moods due to mild stimulant properties."
- **Output**: A precise set of base ingredients (e.g., "Dark Chocolate", "Walnuts").

### 2. Deep Flavor Matrix (FlavorDB Research)

We implement the principles from the **FlavorDB** research paper (`A Database of Flavor Molecules`).

- **Action**: The system takes the AI-suggested ingredients and queries the **FlavorDB API**.
- **Molecular Pairing**: It identifies ingredients that share dominant flavor molecules with the base ingredient, ensuring scientifically harmonious pairings.
- **Result**: A "Flavor Matrix" used to filter recipes.

### 3. The Foodoscope Search Engine (Deterministic Registry)

Our custom-built **Foodoscope Engine** (`src/lib/foodoscope.ts`) execute the final retrieval.

- **Features**:
  - **Deep Scan Registry**: Prevents API rate limits by intelligently caching and striding through recipe pages.
  - **Scientific Local Filter**: Recipes are only accepted if they contain the molecular matches identified by FlavorDB.
  - **Health Guards**: Strict post-processing filters for sodium, protein, and calories.

---

## 🚀 Key Features

### 🧪 Scientific "Vibe" Search

- Translates abstract input ("I missed my flight") into concrete culinary solutions using **Gemini AI**.
- Explains the _reasoning_ behind every recommendation (e.g., "Why this works: Capsaicin triggers endorphins to counter stress").

### ❤️ "Kam Namak" & Health Guards

- Strict, uncompromised health filtering.
- **Kam Namak (Low Sodium)**: Enforces `< 400mg` sodium limits for heart health.
- **Guards**: High-Protein, Keto, Vegan, and Low-Calorie toggles that rigorously filter the dataset.

### 🎵 Sonic Seasoning (Simulated)

- Integrates music psychology with dining.
- Pairs recipe vibes with curated **YouTube Music** playlists (e.g., "Lo-Fi Beats for Slow Cooking").

### ⚡ Premium "Dark Mode" Aesthetic

- built with **TailwindCSS** and **Framer Motion**.
- Glassmorphism UI, smooth transitions, and a mobile-first responsive design.

---

## 📚 Research & References

This project is built upon the foundational research in computational gastronomy:

- **FlavorDB**: _A Database of Flavor Molecules_.
  - Used for: Molecular pairing and cross-modal correspondence.
  - [Launch FlavorDB](http://cosylab.iiitd.edu.in/flavordb)
- **Foodoscope**: _Recipe Data & Nutrition API_.
  - Used for: Real-time recipe metadata and nutritional analysis.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **AI & LLM**: Google Gemini 2.5 Flash (via Vercel AI SDK / Direct API)
- **Database**: Prisma (PostgreSQL / SQLite)
- **Styling**: TailwindCSS
- **External APIs**:
  - FlavorDB (Scientific Pairing)
  - Foodoscope (Recipe Data)

---

## 📦 Implementation Details

### How things work under the hood:

1.  **`src/app/api/translate-mood/route.ts`**:
    - The entry point for AI. Receives user text, loads `custom-rules.json`, and prompts Gemini.
    - Returns: JSON object with `ingredients` and `scientific_reasoning`.

2.  **`src/lib/flavordb.ts`**:
    - Takes the ingredients from Gemini.
    - Performs a real-time fetch to `cosylab.iiitd.edu.in` to find biologically similar foods.

3.  **`src/lib/foodoscope.ts`**:
    - The orchestrator. It manages the "Registry" of recipes.
    - Instead of simple API calls, it performs "Strided Scans" (fetching pages 1, 2, 10, etc.) to get a diverse dataset.
    - Applies the `applyHealthGuards()` function to strictly enforce nutritional limits.

---

## 🏃‍♂️ Getting Started

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/Rahulchaudharyji2/VibeBite.git
    cd VibeBite
    ```

2.  **Install dependencies**:

    ```bash
    npm install
    ```

3.  **Set up Environment Variables**:
    Create a `.env.local` file:

    ```env
    GOOGLE_API_KEY=your_gemini_key
    FOODOSCOPE_API_KEY=your_foodoscope_key
    DATABASE_URL=your_database_url
    ```

4.  **Run the development server**:

    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

_Built with ❤️ by Rahul Chaudhary_
