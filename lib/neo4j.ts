import neo4j, { Driver, Session } from "neo4j-driver";

let driver: Driver | null = null;

export function getDriver(): Driver {
  if (!driver) {
    driver = neo4j.driver(
      process.env.NEO4J_URI || "neo4j+s://localhost:7687",
      neo4j.auth.basic(
        process.env.NEO4J_USER || "neo4j",
        process.env.NEO4J_PASSWORD || "password"
      )
    );
  }
  return driver;
}

export function getSession(): Session {
  return getDriver().session();
}

// Save a concept node with its embedding vector
export async function saveConcept(concept: {
  id: string;
  name: string;
  domain: string;
  type: string;
  relatedTerms: string[];
  confidence: number;
  rawInput: string;
  embedding: number[];
  createdAt: string;
}): Promise<void> {
  const session = getSession();
  try {
    await session.run(
      `CREATE (c:Concept {
        id: $id,
        name: $name,
        domain: $domain,
        type: $type,
        relatedTerms: $relatedTerms,
        confidence: $confidence,
        rawInput: $rawInput,
        embedding: $embedding,
        createdAt: $createdAt
      })`,
      concept
    );
  } finally {
    await session.close();
  }
}

// Link a concept to its domain
export async function linkToDomain(
  conceptId: string,
  domainName: string,
  parentId?: string
): Promise<void> {
  const session = getSession();
  try {
    await session.run(
      `MERGE (d:Domain {name: $domainName})
       WITH d
       MATCH (c:Concept {id: $conceptId})
       MERGE (c)-[:BELONGS_TO]->(d)`,
      { domainName, conceptId }
    );

    if (parentId) {
      await session.run(
        `MATCH (child:Concept {id: $childId})
         MATCH (parent:Concept {id: $parentId})
         MERGE (child)-[:CHILD_OF]->(parent)`,
        { childId: conceptId, parentId }
      );
    }
  } finally {
    await session.close();
  }
}

// Create a cross-domain bridge edge
export async function createBridge(
  sourceId: string,
  targetId: string,
  explanation: string,
  strength: number
): Promise<void> {
  const session = getSession();
  try {
    await session.run(
      `MATCH (a:Concept {id: $sourceId})
       MATCH (b:Concept {id: $targetId})
       MERGE (a)-[r:BRIDGE]->(b)
       SET r.explanation = $explanation, r.strength = $strength, r.createdAt = datetime()`,
      { sourceId, targetId, explanation, strength }
    );
  } finally {
    await session.close();
  }
}

// Find similar concepts by vector (cosine distance)
export async function findSimilar(
  embedding: number[],
  excludeDomain: string,
  limit: number = 5
): Promise<Array<{ id: string; name: string; domain: string; score: number }>> {
  const session = getSession();
  try {
    // Fallback: compute cosine similarity manually for AuraDB free tier
    // (vector index may not be available on free tier)
    const result = await session.run(
      `MATCH (c:Concept)
       WHERE c.domain <> $excludeDomain AND c.embedding IS NOT NULL
       WITH c, gds.similarity.cosine(c.embedding, $embedding) AS score
       ORDER BY score DESC
       LIMIT $limit
       RETURN c.id AS id, c.name AS name, c.domain AS domain, score`,
      { embedding, excludeDomain, limit: neo4j.int(limit) }
    );
    return result.records.map((r) => ({
      id: r.get("id"),
      name: r.get("name"),
      domain: r.get("domain"),
      score: r.get("score"),
    }));
  } catch {
    // If GDS not available, return empty (graceful degradation)
    console.warn("Vector similarity not available — install GDS plugin or use vector index");
    return [];
  } finally {
    await session.close();
  }
}

// Get all concepts for the mind map
export async function getAllConcepts(): Promise<{
  nodes: Array<{ id: string; name: string; domain: string; type: string }>;
  edges: Array<{ source: string; target: string; type: string; label?: string }>;
}> {
  const session = getSession();
  try {
    const nodesResult = await session.run(
      `MATCH (c:Concept) RETURN c.id AS id, c.name AS name, c.domain AS domain, c.type AS type`
    );
    const edgesResult = await session.run(
      `MATCH (a:Concept)-[r]->(b:Concept)
       RETURN a.id AS source, b.id AS target, type(r) AS type, r.explanation AS label`
    );

    return {
      nodes: nodesResult.records.map((r) => ({
        id: r.get("id"),
        name: r.get("name"),
        domain: r.get("domain"),
        type: r.get("type"),
      })),
      edges: edgesResult.records.map((r) => ({
        source: r.get("source"),
        target: r.get("target"),
        type: r.get("type"),
        label: r.get("label"),
      })),
    };
  } finally {
    await session.close();
  }
}

// Get concepts in a specific domain
export async function getConceptsByDomain(
  domain: string
): Promise<Array<{ id: string; name: string; type: string }>> {
  const session = getSession();
  try {
    const result = await session.run(
      `MATCH (c:Concept {domain: $domain}) RETURN c.id AS id, c.name AS name, c.type AS type`,
      { domain }
    );
    return result.records.map((r) => ({
      id: r.get("id"),
      name: r.get("name"),
      type: r.get("type"),
    }));
  } finally {
    await session.close();
  }
}
