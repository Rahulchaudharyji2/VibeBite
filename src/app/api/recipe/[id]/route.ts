import { NextRequest, NextResponse } from "next/server";
import { getRecipeById } from "@/lib/foodoscope";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const recipe = await getRecipeById(id);

  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  return NextResponse.json(recipe);
}
