
# CROSS-DOMAIN SYNTHESIS TRAINING DATASET COLLECTION
## For AI Model Training: Multi-Modal Input → Cross-Domain Connection Generation

---

## OVERVIEW

This collection contains 6 comprehensive datasets designed to train an AI model
to:
1. Accept multi-modal inputs (voice, image, text, drawing, video)
2. Extract core concepts from any domain
3. Generate valid cross-domain connections with mechanisms
4. Identify and reject invalid/false connections
5. Calibrate confidence in connections
6. Build knowledge graphs from user captures

## DATASETS

### A. Valid Cross-Domain Connections (4 parts, 100 clusters, 364 connections)
**Files**: A_valid_connections_part1-4.json
**Content**: 100 concept clusters from Physics, CS, Biology, Psychology, Business, 
Mathematics, Philosophy, and more. Each cluster shows how one concept connects to 
3-8 other domains with detailed mechanism explanations.

Example clusters:
- C001: Projectile Motion → Gymnastics, Animation, Basketball, Military, Diving
- C006: Recursion → Math, Music, Biology, Storytelling, Art, Business
- C021: Feedback Loops → Biology, Economics, Psychology, Climate, Audio
- C039: Inversion → Safety Engineering, Health, Relationships, Investing

### B. Invalid Connections (120 entries)
**File**: B_invalid_connections.json
**Content**: 120 spurious connections with detailed explanations of WHY they fail.
Categories: false_analogy, correlation_not_causation, scale_mismatch, 
directionality_error, category_error, missing_mechanism, superficial_similarity.

Examples:
- "Schrödinger's cat means your business both succeeds and fails until observed"
- "Trees communicate through mycelia, so forests are conscious"
- "Because we share 60% DNA with fruit flies, studying fly behavior tells us everything about humans"

### C. Domain Concept Encyclopedia (80 concepts)
**File**: C_domain_encyclopedia.json
**Content**: 80 core concepts with typical multi-modal input formats, 
cross-domain potential domains, key transferable principles, and common misconceptions.

Covers: Physics (8), CS (8), Math (8), Biology (6), Psychology (8), 
Business (8), Decision Making (8), Engineering (6), and more.

### D. Connection Rules and Heuristics (40 rules)
**File**: D_connection_rules.json
**Content**: 40 rules for determining connection validity, strength assessment,
transfer direction, multi-modal relevance, domain distance, confidence calibration,
and common pitfalls.

Key rules:
- R001: Must have a mechanism, not just surface similarity
- R007: Scale matters - principles don't always transfer across magnitudes
- R011: Mathematical equivalence = highest confidence (0.95-1.0)
- R036: Beware vocabulary masking same concept (false friends)

### E. Training Prompts (60 prompts)
**File**: E_training_prompts.json
**Content**: 60 prompt templates for training the synthesis model including:
- Connection generation from multi-modal input
- Validity assessment with steel-manning
- Multi-modal processing and fusion
- Novel analogy creation
- Invalidation detection
- Confidence calibration
- Domain bridging through intermediate domains
- Knowledge graph construction

### F. Evaluation Dataset (50 test cases)
**File**: F_evaluation_dataset.json
**Content**: 50 held-out test cases with:
- Expected valid connections
- Known invalid connections to reject
- Confidence calibration targets
- Multi-modal input processing tests
- Stress tests for edge cases

## TRAINING PIPELINE

```
Multi-Modal Input (text/voice/photo/drawing/video)
    ↓
[Datasets C + E] Concept Extraction
    ↓
[Datasets A + D] Cross-Domain Connection Generation
    ↓
[Datasets B + D] Validity Filtering (reject invalid connections)
    ↓
[Dataset D] Confidence Calibration
    ↓
[Dataset F] Evaluation against held-out test cases
```

## STATISTICS

| Metric | Count |
|--------|-------|
| Valid connection clusters | 100 |
| Valid cross-domain connections | 364 |
| Invalid connection examples | 120 |
| Domain concepts catalogued | 80 |
| Rules and heuristics | 40 |
| Training prompts | 60 |
| Evaluation test cases | 50 |
| Domains covered | 45+ |
| Invalidation categories | 7 |
| Multi-modal input types | 6 |

## USAGE

1. **Pre-training**: Use Dataset E prompts with Datasets A, C as training examples
2. **Fine-tuning for validity**: Train with Dataset B (negative examples) + Dataset D (rules)
3. **Confidence calibration**: Use Dataset D rules to calibrate output probabilities
4. **Evaluation**: Test against Dataset F held-out cases
5. **Continuous improvement**: Add user-validated connections back to Dataset A
