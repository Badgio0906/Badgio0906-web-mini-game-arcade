import { eventNames } from './telemetrySchema';

/** External-only boundary. Local legacy events are never replayed into this format. */
export const ANALYTICS_SCHEMA_VERSION = 2 as const;
export const ANALYTICS_MAX_BATCH = 50;
export const ANALYTICS_MAX_BODY_BYTES = 64 * 1024;
export const ANALYTICS_MAX_DATA_FIELDS = 40;
export const ANALYTICS_EVENT_NAMES = [...eventNames, 'portal_view', 'game_card_impression', 'page_ready', 'client_error',
  'jump_committed', 'section_reached', 'fall_started', 'fall_stopped', 'progress_recovered', 'safe_catch_used',
  'well_cleared', 'sky_reached', 'space_reached', 'run_quit', 'shoe_selected', 'angle_selected', 'spin_selected',
  'power_selected', 'just_power', 'distance_result', 'max_height', 'spaceship_collision', 'rare_effect_eligible',
  'rare_effect_draw', 'rare_effect_shown', 'shoe_best_update'] as const;
export type AnalyticsEventName = typeof ANALYTICS_EVENT_NAMES[number];
export type AnalyticsPrimitive = string | number | boolean;
export type AnalyticsEnvironment = 'production' | 'development' | 'qa' | 'synthetic';
export interface AnalyticsEnvelope {
  schema_version: 2;
  event_id: string;
  occurred_at: string;
  game_id: string;
  game_version: string;
  rules_version: string;
  presentation_version: string;
  browser_id: string;
  visit_id: string;
  session_id: string;
  run_id: string | null;
  event_name: AnalyticsEventName;
  environment: AnalyticsEnvironment;
  device_class: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  input_type: 'touch' | 'keyboard' | 'mixed' | 'unknown';
  page: string;
  data: Record<string, AnalyticsPrimitive>;
}
export interface AnalyticsBatch { schema_version: 2; events: AnalyticsEnvelope[]; }
export const ANALYTICS_ACTIVE_GAME_IDS = ['portal', ...Array.from({ length: 24 }, (_, i) => `game${String(i + 1).padStart(3, '0')}`).filter(id => id !== 'game010')];
const names = new Set<string>(ANALYTICS_EVENT_NAMES);
const games = new Set(ANALYTICS_ACTIVE_GAME_IDS);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const opaque = /^[a-zA-Z0-9_:.-]{1,80}$/;
const version = /^[a-zA-Z0-9_.-]{1,40}$/;
const textToken = /^[a-zA-Z0-9_ .:+-]{1,80}$/;
const pages = new Set(['index.html', ...ANALYTICS_ACTIVE_GAME_IDS.filter(id => id !== 'portal' && !['game012','game013','game014'].includes(id)).map(id => `${id}.html`),
  'games/yokodori-days/index.html', 'games/tachibana-task-heaven/index.html', 'games/finger-heart-challenge/index.html']);
const stringKeys = new Set(('event event_type type phase outcome reason failure_reason death_reason metric unit source mode level air_control direction jump_band landing_id ledge_id surface kind choice slot failureCause cause grade side jump_direction charge_band section section_id chapter route_type platform_type depth_band landing_type shoe selected_game target_kind target_object target_slot safe_or_challenge pace hazard destination special special_run final_mode player_hand opponent_hand error_code catalog_version thumbnail_revision presentation_id wind_direction wind_strength coverage startMethod wind_type state milestone difficulty deal_mode daily_id rules_version word_id category').split(' '));
const numberKeys = new Set(('session_duration_ms score best time seconds duration_ms elapsed_ms step steps version rulesVersion score_version attempt_id section_from progress_lost drop loss floor delivered expired scenario partyId kg freeKg skipped objectId points searchMs penaltySeconds paper costSeconds hazard_distance cupId amount cupCount meters platform_id nice_drops floors artPairs artScore bonusScore maxCombo precisionScore perfectMultiplier first_id second_id first_ratio second_ratio recovery_pixels cargo_id offset_ratio support_margin weak_joint_index joint_index parked perfectCount maxStreak steeringDegrees speed multiplier clearance streak basePoints noBrakePoints nearMissPoints margin angleError deadline depth height distance round count level_index run_index card_position visible_duration_threshold angle spin power value probability previous_best max_height max_depth depth_reached nice_drop perfect perfect_count art_pair art_score overhang balance_margin failure_support_level parking_accuracy brake_timing near_miss load delivery deliveries deadline remaining remaining_coffee remaining_seconds spill search_duration paper_lift tidy_used correct errors lifts tidies spareTime falls total_fall biggest_fall jumps jump_charge_ms jump_power_normalized jump_start_height jump_end_height fall_start_height fall_end_height fall_distance height_before_fall height_after_fall fall_count charge_ms charge_power charge_normalized landing_height start_height end_height landing_x start_x end_x section_reached catch_ledge_used response_latency_ms sequence_length sorted_count rule_change_count completed correct_fields corrections major_failures asks close_calls image_correct text_correct final_streak best_final memory_level towers offset precision_score bonus_score progress recovered_height start_depth end_depth result_distance combo wind_strength_value wind_x wind_y height_lost height_recovered peak_height total_fall_distance milestone hints undos draw moves foundation_count assists wrong_count foods length').split(' '));
const booleanKeys = new Set(('ceiling_or_wall_bump onTime cMode contact held brakeUsed just just_power newBest practice practiceAgain completedBefore practiced eligible won shown landing_success brake_used C_mode space_reached spaceship_collision safe_catch_used well_clear space_clear sky_reached progress_recovered optional_continue tidy large_fall resumed checkpoint recovered challenge success first assisted record_added hint_used').split(' '));
export const ANALYTICS_UTM_KEYS = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'] as const;
const utmKeys = new Set<string>(ANALYTICS_UTM_KEYS);
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value) && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}
export function isAnalyticsDataField(key: string, value: unknown): value is AnalyticsPrimitive {
  if (key === 'completed' && typeof value === 'boolean') return true; // Existing numeric completion fields remain accepted.
  if (['jump_direction','direction','destination','level','milestone'].includes(key) && typeof value === 'number') return Number.isFinite(value) && Math.abs(value) <= 1e12;
  if (stringKeys.has(key)) return typeof value === 'string' && textToken.test(value);
  if (numberKeys.has(key)) return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= 1e12;
  if (booleanKeys.has(key)) return typeof value === 'boolean';
  if (utmKeys.has(key)) return typeof value === 'string' && /^[a-z0-9_-]{1,100}$/.test(value);
  if (key === 'referrer_host') return typeof value === 'string' && value.length <= 253 && /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/.test(value);
  return false;
}
/** Copies only documented primitives; rejects URLs, free text, nested objects and identity fields. */
export function sanitizeAnalyticsData(value: Record<string, unknown>): Record<string, AnalyticsPrimitive> {
  const result: Record<string, AnalyticsPrimitive> = Object.create(null);
  for (const [key, item] of Object.entries(value)) if (Object.keys(result).length < ANALYTICS_MAX_DATA_FIELDS && isAnalyticsDataField(key, item)) result[key] = item;
  return result;
}
const envelopeKeys = ['schema_version','event_id','occurred_at','game_id','game_version','rules_version','presentation_version','browser_id','visit_id','session_id','run_id','event_name','environment','device_class','input_type','page','data'];
export function isAnalyticsEnvelope(value: unknown, now?: number): value is AnalyticsEnvelope {
  if (!record(value) || Object.keys(value).length !== envelopeKeys.length || !envelopeKeys.every(key => Object.hasOwn(value,key))) return false;
  if (value.schema_version !== 2 || typeof value.event_id !== 'string' || !uuid.test(value.event_id) || typeof value.browser_id !== 'string' || !uuid.test(value.browser_id)) return false;
  if (!['visit_id','session_id'].every(key => typeof value[key] === 'string' && opaque.test(value[key] as string)) || (value.run_id !== null && !(typeof value.run_id === 'string' && opaque.test(value.run_id)))) return false;
  if (typeof value.game_id !== 'string' || !games.has(value.game_id) || typeof value.event_name !== 'string' || !names.has(value.event_name)) return false;
  if (!['game_version','rules_version','presentation_version'].every(key => typeof value[key] === 'string' && version.test(value[key] as string))) return false;
  if (typeof value.environment !== 'string' || typeof value.device_class !== 'string' || typeof value.input_type !== 'string' || !['production','development','qa','synthetic'].includes(String(value.environment)) || !['mobile','desktop','tablet','unknown'].includes(String(value.device_class)) || !['touch','keyboard','mixed','unknown'].includes(String(value.input_type))) return false;
  if (typeof value.page !== 'string' || !pages.has(value.page)) return false;
  if (typeof value.occurred_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.occurred_at)) return false;
  const at = Date.parse(value.occurred_at);
  if (!Number.isFinite(at) || new Date(at).toISOString() !== value.occurred_at || (now !== undefined && (at > now + 300000 || at < now - 86400000))) return false;
  if (!record(value.data) || Object.keys(value.data).length > ANALYTICS_MAX_DATA_FIELDS || !Object.entries(value.data).every(([key,item]) => isAnalyticsDataField(key,item))) return false;
  return true;
}
export function isAnalyticsBatch(value: unknown, now?: number): value is AnalyticsBatch {
  return record(value) && Object.keys(value).length === 2 && value.schema_version === 2 && Array.isArray(value.events) && value.events.length > 0 && value.events.length <= ANALYTICS_MAX_BATCH && value.events.every(event => isAnalyticsEnvelope(event,now));
}
