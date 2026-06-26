import { NextResponse } from "next/server";
import { Campus } from "@/engine/types";
import { fetchCatalogForCampus } from "@/lib/vtopImport/catalog";
import { compareVtopToCatalog } from "@/lib/vtopImport/compareCatalog";
import { consumeVtopImport } from "@/lib/vtopImport/storage";

export async function GET(
  _request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token?.trim();
    if (!token || token.length > 32) {
      return NextResponse.json({ error: "Invalid import token." }, { status: 400 });
    }

    const payload = await consumeVtopImport(token);
    if (!payload) {
      return NextResponse.json(
        { error: "Import token expired or not found." },
        { status: 404 }
      );
    }

    const campus = (payload.campus ?? "vellore") as Campus;
    let diff = null;

    try {
      const catalog = await fetchCatalogForCampus(campus);
      diff = compareVtopToCatalog(payload, catalog);
    } catch {
      diff = compareVtopToCatalog(payload, []);
    }

    return NextResponse.json({ payload, diff });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load import." },
      { status: 500 }
    );
  }
}
