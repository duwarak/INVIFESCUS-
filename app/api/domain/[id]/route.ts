import { NextRequest, NextResponse } from "next/server";
import { chatJSON } from "@/lib/ai";
import { getConceptsByDomain, linkToDomain } from "@/lib/neo4j";
import { DOMAIN_PROMPT } from "@/lib/prompts";

interface DomainResult {
  parentNodes: string[];
  relatedNodes: string[];
  summary: string;
  isNewBranch: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { conceptName, domain } = body as {
      conceptName: string;
      domain: string;
    };

    const conceptId = params.id;

    // Get existing concepts in this domain
    const existing = await getConceptsByDomain(domain);

    const existingDescription = existing.length > 0
      ? existing.map((c) => `- ${c.name} (id: ${c.id})`).join("\n")
      : "No existing concepts in this domain yet.";

    const result = await chatJSON<DomainResult>(
      DOMAIN_PROMPT,
      `New concept: "${conceptName}" in domain "${domain}"

Existing concepts in ${domain}:
${existingDescription}`
    );

    // Link to domain in Neo4j
    const parentId = result.parentNodes[0] || undefined;
    await linkToDomain(conceptId, domain, parentId);

    return NextResponse.json({
      conceptId,
      domain,
      ...result,
    });
  } catch (error) {
    console.error("Domain error:", error);
    return NextResponse.json(
      { error: "Failed to position concept", details: String(error) },
      { status: 500 }
    );
  }
}
