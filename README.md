# 🍽️ VibeBite

**Match Your Mood To Your Meal.**  
The first context-aware recipe discovery engine that uses "Vibe Mapping" to find you the perfect food.

![VibeBite Hero](https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2670&auto=format&fit=crop)

## 🚀 The Problem

"What should I eat?" is the hardest question of the day.
Traditional recipe apps are just databases—they don't care how you _feel_ or what you're doing. VibeBite bridges the gap between your **Context** (Music, Mood, Health) and **Food**.

## ✨ Key Features

### 🎵 Spotify Sync (Mood Mode)

Connect your vibe. We analyze specific moods to recommend biologically relevant food.

- **Sad?** -> Comfort Food (Chocolate, Warm Soups).
- **Pumped?** -> High-Energy Protein (Spicy Chicken, Stir Fry).
- **Focused?** -> Brain Food (Nuts, Omega-3s).

### ❤️ Health Guard

Strict dietary filters that actually work.

- **Low Sodium**: Automatically filters sodium < 500mg.
- **Protein Packed**: Prioritizes macros for gym-goers.

### 🧠 Smart Context Search

Type what you crave ("Crunchy movie snack"), and our semantic interaction understands the intent.

---

## 🛠️ How It Works (The Core Logic)

VibeBite isn't just a wrapper around an API. It uses a 3-layer intelligence system:

### 1. Semantic Vibe Mapping

We map abstract feelings to concrete food queries.

- **Input**: "The Weeknd - " (High Tempo / Minor Key)
- **Logic**: `High BPM` + `Minor Key` = **Spicy / Late Night Food**
- **Output**: Search Query "Spicy Wings"

### 2. Smart Visuals (Context Recognition)

If a recipe lacks a good image, we don't show a blank placeholder.

- Our **Keyword Matcher** matches keywords (`"Burger"`, `"Salad"`, `"Soup"`) to a curated dataset of high-res culinary photography.

### 3. Predictive Content Generation (The "No-404" Engine)

APIs often return a title but missing instructions. VibeBite fixes this on the fly.

- **Scenario**: API returns "Avocado Toast" but no steps.
- **AI Action**: The `src/app/recipe/[id]/page.tsx` engine scans the title -> identifies "Avocado" + "Bread" -> Generates:
  1.  _Toast the bread._
  2.  _Mash the avocado._
  3.  _Season with salt and pepper._

**Result**: The user NEVER sees an incomplete page.

---

## 💻 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Custom "Glassmorphism" Design System)
- **Animations**: Framer Motion
- **Data**: Foodoscope API (RecipeDB)

---

## 🏁 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/Rahulchaudharyji2/VibeBite.git
cd vibebite
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Environment Variables

Create a `.env.local` file in the root:

```env
# Get a free key from Foodoscope or use your own logic
FOODOSCOPE_API_KEY=your_api_key_here
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🤝 Contributing

Built with using Next.js and ❤️ by [Your Name/Rahul].
