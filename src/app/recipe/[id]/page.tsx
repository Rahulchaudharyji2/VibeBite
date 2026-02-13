"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Clock, Flame, Users, ShoppingBag, Utensils, Share2, Heart } from "lucide-react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useEffect, useState } from "react";

// Smart Content Generator Helper
// Smart Content Generator Helper
function generateSmartRecipeContent(title: string) {
    const t = title.toLowerCase();
    
    // Default fallback
    let ingredients = ["Salt", "Pepper", "Olive Oil", "Garlic", "Onion"];
    let instructions = "1. Prep ingredients.\n2. Cook over medium heat until done.\n3. Season to taste and serve.";
    let science = "This dish provides a balanced mix of macronutrients.";

    if (t.includes("soup") || t.includes("stew") || t.includes("chili")) {
        ingredients = ["Vegetable Broth", "Carrots", "Celery", "Onions", "Garlic", "Thyme", "Bay Leaf"];
        instructions = "1. Sauté onions and garlic.\n2. Add vegetables and broth.\n3. Simmer for 30-45 minutes.\n4. Season and serve hot.";
        science = "Soups are excellent for hydration and nutrient absorption.";
    } else if (t.includes("salad") || t.includes("bowl")) {
        ingredients = ["Mixed Greens", "Tomatoes", "Cucumber", "Vinaigrette", "Nuts", "Feta Cheese"];
        instructions = "1. Wash and chop vegetables.\n2. Toss with dressing just before serving.\n3. Top with nuts and cheese.\n4. Serve fresh.";
        science = "Raw vegetables in salads retain maximum enzyme activity and vitamins.";
    } else if (t.includes("chicken") || t.includes("poultry")) {
        ingredients = ["Chicken Breast", "Lemon", "Herbs", "Garlic", "Butter", "Asparagus"];
        instructions = "1. Season chicken generously with herbs.\n2. Pan sear until golden brown.\n3. Bake for 15 minutes at 400°F.\n4. Rest for 5 mins before serving.";
        science = "Chicken is a high-quality protein source essential for muscle repair.";
    } else if (t.includes("curry") || t.includes("masala") || t.includes("korma")) {
        ingredients = ["Coconut Milk", "Curry Paste", "Onion", "Ginger", "Garlic", "Cilantro", "Rice"];
        instructions = "1. Sauté aromatics (onion, ginger, garlic).\n2. Toast spices/curry paste.\n3. Add protein and coconut milk.\n4. Simmer until tender. Serve with rice.";
        science = "Spices like turmeric in curry have powerful anti-inflammatory properties.";
    } else if (t.includes("pasta") || t.includes("spaghetti") || t.includes("noodle")) {
        ingredients = ["Pasta", "Tomato Sauce", "Basil", "Parmesan Cheese", "Garlic", "Olive Oil"];
        instructions = "1. Boil salted water and cook pasta al dente.\n2. Simmer sauce with garlic and herbs.\n3. Toss pasta in sauce.\n4. Top with fresh cheese.";
        science = "Carbohydrates in pasta provide readily available glucose for energy.";
    } else if (t.includes("beef") || t.includes("steak") || t.includes("burger")) {
        ingredients = ["Beef", "Rosemary", "Garlic", "Butter", "Salt", "Black Pepper"];
        instructions = "1. Season meat with salt and pepper.\n2. Sear in a hot skillet.\n3. Baste with butter and herbs.\n4. Rest meat to retain juices.";
        science = "Red meat is rich in heme iron and B-vitamins for energy metabolism.";
    } else if (t.includes("fish") || t.includes("salmon") || t.includes("seafood") || t.includes("shrimp")) {
        ingredients = ["Fish/Seafood", "Lemon", "Dill", "Butter", "Garlic", "White Wine"];
        instructions = "1. Pat seafood dry and season.\n2. Pan fry or bake gently.\n3. Finish with lemon and butter.\n4. Serve immediately.";
        science = "Seafood is the best source of Omega-3 fatty acids for brain health.";
    } else if (t.includes("rice") || t.includes("risotto") || t.includes("pilaf")) {
        ingredients = ["Rice", "Broth", "Onion", "Butter", "Saffron", "Peas"];
        instructions = "1. Toast rice in butter.\n2. Add broth slowly while stirring.\n3. Cook until creamy and tender.\n4. Finish with parmesan.";
        science = "Rice provides easily digestible energy and runs cleanly in the body.";
    } else if (t.includes("cake") || t.includes("dessert") || t.includes("cookie") || t.includes("pie")) {
        ingredients = ["Flour", "Sugar", "Eggs", "Butter", "Vanilla Extract", "Baking Powder"];
        instructions = "1. Cream butter and sugar.\n2. Mix dry ingredients.\n3. Bake at 350°F (175°C) until golden.\n4. Cool completely before serving.";
        science = "Sugar provides quick energy, while fats add flavor and texture.";
    } else if (t.includes("smoothie") || t.includes("drink") || t.includes("juice")) {
        ingredients = ["Fruit", "Yogurt/Milk", "Honey", "Ice", "Spinach"];
        instructions = "1. Combine all ingredients in a blender.\n2. Blend on high until smooth.\n3. Pour into a chilled glass.";
        science = "Blending fruits breaks down cell walls, making nutrients easier to absorb.";
    }

    return { ingredients, instructions, science };
}

export default function RecipeDetail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const id = params?.id as string;
  
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function resolveRecipe() {
       setLoading(true);
       
       // Priority 1: Use transferred state from URL (Source of Truth)
       const title = searchParams.get("title");
       if (title) {
           const smartContent = generateSmartRecipeContent(title);
           setRecipe({
               id: id,
               title: title,
               image: searchParams.get("image") || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
               time: searchParams.get("time") || "30 min",
               calories: searchParams.get("calories") || "N/A",
               description: smartContent.instructions,
               scienceNote: smartContent.science,
               ingredients: smartContent.ingredients
           });
           setLoading(false);
           return;
       }

       // Priority 2: Fallback to API fetch (Likely to fail or lack data, but worth a try)
       try {
         const res = await fetch(`/api/recipe/${id}`);
         if (res.ok) {
            const data = await res.json();
            
            // If API lacks details (likely), use smart generator
            if (!data.ingredients || data.ingredients.length <= 1 || data.ingredients[0].includes("unavailable")) {
                const smart = generateSmartRecipeContent(data.title);
                setRecipe({
                    ...data,
                    description: data.description && data.description.length > 50 ? data.description : smart.instructions,
                    ingredients: smart.ingredients,
                    scienceNote: smart.science
                });
            } else {
                setRecipe(data);
            }
         } else {
             // Ultimate Fallback if direct link and API fails
             setRecipe({
                title: "Recipe Details",
                description: "Could not load specific details. Please find another recipe.",
                image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
                ingredients: ["Ingredients unavailable"],
                time: "--",
                calories: "--" 
             });
         }
       } catch (error) {
         console.error("Failed to fetch recipe detail", error);
       } finally {
         setLoading(false);
       }
    }
    resolveRecipe();
  }, [id, searchParams]);

  if (loading) {
      return <div className="min-h-screen mesh-gradient flex items-center justify-center text-white">Loading...</div>;
  }

  if (!recipe) return null; // Should be handled by fallback above

  return (
    <div className="min-h-screen mesh-gradient pb-20">
      {/* Hero Image */}
      <div className="h-[50vh] relative">
          <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--background)]" />
          
          <div className="absolute top-6 left-6 z-10">
               <button onClick={() => router.back()} className="p-3 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition-colors">
                  <ArrowLeft size={24} />
               </button>
          </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 -mt-32 relative z-10">
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-[3rem] p-8 md:p-12 shadow-2xl"
        >
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-3xl md:text-5xl font-display font-bold mb-4">{recipe.title}</h1>
                    <div className="flex gap-6 text-gray-400">
                        <span className="flex items-center gap-2"><Clock size={18} /> {recipe.time}</span>
                        <span className="flex items-center gap-2"><Flame size={18} /> {recipe.calories} kcal</span>
                        {recipe.servings && <span className="flex items-center gap-2"><Users size={18} /> {recipe.servings} pp</span>}
                    </div>
                </div>
                <div className="flex gap-2">
                     <button className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-pink-500">
                        <Heart size={24} />
                     </button>
                     <button className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                        <Share2 size={24} />
                     </button>
                </div>
            </div>

            <p className="text-gray-300 leading-relaxed mb-8 text-lg whitespace-pre-line">
                {recipe.description}
            </p>

            {recipe.scienceNote && (
                <div className="mb-10 p-5 rounded-2xl bg-[var(--color-neon-lime)]/5 border border-[var(--color-neon-lime)]/30 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">🧬</span>
                        <h4 className="text-[var(--color-neon-lime)] font-bold tracking-wide uppercase text-sm">VibeBite Intelligence</h4>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{recipe.scienceNote}</p>
                </div>
            )}
            
            {/* The Decision: Result Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                 <button 
                    onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(recipe.title + " recipe")}`, '_blank')}
                    className="py-6 rounded-2xl bg-white text-black font-bold text-xl flex flex-col items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg group"
                 >
                    <div className="flex items-center gap-3">
                        <Utensils size={24} /> Full Recipe
                    </div>
                    <span className="text-sm font-normal text-gray-600">Find on Web & Cook</span>
                 </button>
                 
                 <button 
                    onClick={() => window.open('https://www.swiggy.com', '_blank')}
                    className="py-6 rounded-2xl bg-[var(--color-neon-lime)] text-black font-bold text-xl flex flex-col items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-[var(--color-neon-lime)]/20"
                 >
                    <div className="flex items-center gap-3">
                        <ShoppingBag size={24} /> Option B
                    </div>
                    <span className="text-sm font-normal text-black/70">Order Food (Slow Day?)</span>
                 </button>
            </div>

            <div>
                <h3 className="text-2xl font-bold mb-6">Ingredients</h3>
                <ul className="space-y-4">
                    {recipe.ingredients?.map((ing: string, i: number) => (
                        <li key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5">
                            <div className="w-2 h-2 rounded-full bg-[var(--color-creamy-gold)]" />
                            {ing}
                        </li>
                    ))}
                </ul>
            </div>
        </motion.div>
      </div>
    </div>
  );
}

