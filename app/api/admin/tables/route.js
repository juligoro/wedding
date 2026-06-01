import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(request) {
  try {
    const data = await request.json();
    const name = typeof data.name === "string" ? data.name.trim() : "";

    if (!name) {
      return NextResponse.json({ error: "Falta el nombre de la mesa." }, { status: 400 });
    }

    const table = await prisma.seatingTable.create({
      data: {
        name,
        capacity: 10,
      },
    });

    return NextResponse.json({ table }, { status: 201 });
  } catch (error) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Ya existe una mesa con ese nombre." }, { status: 409 });
    }

    console.error("Create table error", error);

    return NextResponse.json({ error: "No pudimos crear la mesa." }, { status: 500 });
  }
}
