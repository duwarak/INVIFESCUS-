import scenarios from "./dataset/09_50_unpredictable_scenarios.json";
import gamification from "./dataset/05_gamification_system.json";
import decisionEngine from "./dataset/04_daily_decision_engine.json";
import personas from "./dataset/01_user_personas.json";
import featureMatrix from "./dataset/10_feature_mapping_matrix.json";
import journey from "./dataset/08_complete_user_journey.json";
import connectionRules from "./dataset/training/D_connection_rules.json";
import trainingPrompts from "./dataset/training/E_training_prompts.json";
import schemaMock from "./dataset/second_brain_mock_dataset.json";
import superScenarios from "./dataset/11_super_scenarios.json";

export interface SuperScenario {
  id: string;
  user: string;
  title: string;
  domains_triggered: string[];
  situation: string;
  week_inputs: Record<string, string>;
  ai_synthesis: {
    detected_pattern: string;
    cross_domain_solutions: { angle: string; solution: string; domains: string[] }[];
  };
  questions_to_ask: string[];
  priority_list: string[];
  safety_applied?: Record<string, string>;
}

export function loadSuperScenarios(): SuperScenario[] {
  return (superScenarios as any).scenarios as SuperScenario[];
}
export function pickSuperScenario(seed: number): SuperScenario {
  const list = loadSuperScenarios();
  return list[Math.abs(seed) % list.length];
}

export interface SchemaInputItem {
  input_id: string;
  user_id: string;
  type: string;
  content: string;
  source_context: string;
  timestamp: string;
  emotion_signal: string;
  stickiness_score: number;
}
export interface SchemaConcept {
  concept_id: string;
  input_id: string;
  user_id: string;
  topic: string;
  subtopic: string;
  confidence: number;
  tags: string[];
  related_concepts: string[];
  domain: string;
  abstraction_level: string;
}
export interface SchemaTask {
  task_id: string;
  user_id: string;
  concept_id: string;
  title: string;
  description: string;
  importance: number;
  urgency: number;
  energy_need: string;
  deadline: string | null;
  estimated_time_min: number;
  priority_score: number;
  status: string;
  category: string;
}
export interface SchemaReflection {
  prompt_id: string;
  user_id: string;
  task_id: string;
  question_type: string;
  question_text: string;
  context: string;
  asked_at: string;
  response_received: boolean;
  response_text: string | null;
  follow_up_prompts: string[];
}
export interface SchemaOutcome {
  outcome_id: string;
  user_id: string;
  task_id: string;
  completed: boolean;
  delayed: boolean;
  delay_reason: string | null;
  avoided: boolean;
  avoid_reason: string | null;
  learned: string;
  emotional_state: string;
  energy_used: string;
  time_actual_min: number | null;
  impact_score: number;
  recorded_at: string;
}
export interface SchemaCommunity {
  community_id: string;
  user_id: string;
  nearby_user_id: string | null;
  shared_interests: string[];
  shared_goals: string[];
  location_match: string;
  safety_score: number;
  meetup_type: string;
  meetup_scheduled: boolean;
  meetup_date: string | null;
  interaction_count: number;
  last_interaction: string | null;
  connection_strength: number;
}
export interface SchemaDataset {
  metadata: any;
  data: {
    users: any[];
    input_items: SchemaInputItem[];
    concept_extractions: SchemaConcept[];
    transfer_links: any[];
    priority_tasks: SchemaTask[];
    reflection_prompts: SchemaReflection[];
    outcome_records: SchemaOutcome[];
    community_records: SchemaCommunity[];
  };
}

export function loadSchemaDataset(): SchemaDataset {
  return schemaMock as SchemaDataset;
}

export interface ScenarioSolution {
  angle: string;
  solution: string;
  domains: string[];
}
export interface Scenario {
  id: string;
  title: string;
  user: string;
  situation: string;
  domains_triggered: string[];
  ai_synthesis: {
    detected_pattern: string;
    cross_domain_solutions: ScenarioSolution[];
  };
}

export function loadScenarios(): Scenario[] {
  const base = (scenarios as any).scenarios as Scenario[];
  const supers = loadSuperScenarios().map((s) => ({
    id: s.id,
    title: s.title,
    user: s.user,
    situation: s.situation,
    domains_triggered: s.domains_triggered,
    ai_synthesis: s.ai_synthesis,
  })) as Scenario[];
  return [...base, ...supers];
}
export function pickScenario(seed: number): Scenario {
  const list = loadScenarios();
  return list[Math.abs(seed) % list.length];
}
export function loadGamification(): any { return gamification as any; }
export function loadDecisionEngine(): any { return decisionEngine as any; }
export function loadPersonas(): any { return personas as any; }
export function loadFeatureMatrix(): any { return featureMatrix as any; }
export function loadJourney(): any { return journey as any; }
export function loadConnectionRules(): any { return connectionRules as any; }
export function loadTrainingPrompts(): any { return trainingPrompts as any; }

export function trainingStats() {
  const s = loadScenarios();
  const tp = loadTrainingPrompts();
  const dr = loadConnectionRules();
  const g = loadGamification();
  const sm = loadSchemaDataset();
  const sup = loadSuperScenarios();
  return {
    scenarios: s.length,
    domainsCovered: Array.from(new Set(s.flatMap((x) => x.domains_triggered))).length,
    crossDomainSolutions: s.reduce((n, x) => n + x.ai_synthesis.cross_domain_solutions.length, 0),
    trainingPrompts: (tp.prompts ?? []).length,
    connectionRules: Object.keys(dr.rules ?? dr).length,
    gamificationMechanics: (g.mechanics ?? []).length || Object.keys(g).length,
    schemaUsers: sm.data.users.length,
    schemaInputs: sm.data.input_items.length,
    schemaConcepts: sm.data.concept_extractions.length,
    schemaTasks: sm.data.priority_tasks.length,
    schemaReflections: sm.data.reflection_prompts.length,
    schemaOutcomes: sm.data.outcome_records.length,
    schemaCommunity: sm.data.community_records.length,
    superScenarios: sup.length,
    superQuestions: sup.reduce((n, x) => n + x.questions_to_ask.length, 0),
    superPriorities: sup.reduce((n, x) => n + x.priority_list.length, 0),
  };
}
