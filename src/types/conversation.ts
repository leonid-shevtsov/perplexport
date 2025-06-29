export interface ConversationResponse {
  status: string;
  entries: ConversationEntry[];
  has_next_page: boolean;
  next_cursor: string | null;
}

export interface ConversationEntry {
  backend_uuid: string;
  context_uuid: string;
  uuid: string;
  frontend_context_uuid: string;
  frontend_uuid: string;
  status: string;
  thread_title: string;
  related_queries: string[];
  display_model: string;
  user_selected_model: string;
  personalized: boolean;
  mode: string;
  query_str: string;
  search_focus: string;
  source: string;
  updated_datetime: string;
  read_write_token: string;
  is_pro_reasoning_mode: boolean;
  step_type: string;
  author_id: string;
  author_username: string;
  bookmark_state: string;
  s3_social_preview_url: string;
  thread_access: number;
  thread_url_slug: string;
  privacy_state: string;
  gpt4: boolean;
  sources: {
    sources: string[];
  };
  entry_updated_datetime: string;
  blocks: Block[];
  related_query_items: RelatedQueryItem[];
  access_level: string;
  answer_modes: AnswerMode[];
  reconnectable: boolean;
  classifier_results: ClassifierResults;
  search_implementation_mode: string;
  should_index: boolean;
}

// types seen so far; we don't need to describe all.
// image_answer_mode;
// maps_mode;
// media_items;
// plan;
// ask_text;
// pro_search_steps;
// reasoning_plan;
// shopping_mode;
// sources_answer_mode;
// video_answer_mode;
// web_results;

export type Block =
  | {
      intended_usage: "plan";
      plan_block: PlanBlock;
    }
  | {
      intended_usage: "ask_text";
      markdown_block: MarkdownBlock;
    }
  | {
      intended_usage: "sources_answer_mode";
      sources_mode_block: SourcesModeBlock;
    }
  | {
      intended_usage: "media_items";
      media_block: MediaBlock;
    }
  | {
      intended_usage: "image_answer_mode";
      image_mode_block: ImageModeBlock;
    }
  | {
      intended_usage: "video_answer_mode";
      video_mode_block: VideoModeBlock;
    };

export interface PlanBlock {
  progress: string;
  goals: Goal[];
  final: boolean;
  steps?: Step[];
}

export interface Goal {
  id: string;
  description: string;
  final: boolean;
  todo_task_status: string;
}

export interface Step {
  uuid: string;
  step_type: string;
  initial_query_content?: {
    query: string;
  };
  search_web_content?: {
    goal_id: string;
    queries: Query[];
  };
  web_results_content?: {
    goal_id: string;
    web_results: WebResult[];
  };
  terminate_content?: {
    goal_id: string;
  };
  assets: any[];
}

export interface Query {
  engine: string;
  query: string;
  limit: number;
}

export interface WebResult {
  name: string;
  url: string;
  snippet: string;
  is_attachment: boolean;
  is_memory: boolean;
  is_conversation_history: boolean;
  is_navigational: boolean;
  is_focused_web: boolean;
}

export interface MarkdownBlock {
  progress: string;
  chunks: string[];
  chunk_starting_offset: number;
  answer: string;
}

export interface WebResultBlock {
  progress: string;
  web_results: DetailedWebResult[];
}

export interface DetailedWebResult {
  name: string;
  snippet: string;
  timestamp: string;
  url: string;
  meta_data: MetaData;
  is_attachment: boolean;
  is_image: boolean;
  is_code_interpreter: boolean;
  is_knowledge_card: boolean;
  is_navigational: boolean;
  is_widget: boolean;
  is_focused_web: boolean;
  is_client_context: boolean;
  is_memory: boolean;
  is_conversation_history: boolean;
  sitelinks?: any[];
  status?: string;
  web_result?: DetailedWebResult;
}

export interface MetaData {
  date: string | null;
  client: string;
  description: string;
  domain_name: string;
  images: string[];
  published_date: string | null;
}

export interface MediaBlock {
  media_items: MediaItem[];
  generated_media_items: any[];
}

export interface MediaItem {
  medium: string;
  image: string;
  image_width: number;
  image_height: number;
  url: string;
  name: string;
  source: string;
  thumbnail: string;
  thumbnail_height: number;
  thumbnail_width: number;
}

export interface RelatedQueryItem {
  text: string;
  type: string;
}

export interface AnswerMode {
  answer_mode_type: string;
}

export interface ClassifierResults {
  personal_search: boolean;
  skip_search: boolean;
  widget_type: string;
  hide_nav: boolean;
  hide_sources: boolean;
  image_generation: boolean;
}

export interface SourcesModeBlock {
  answer_mode_type: string;
  progress: string;
  web_results: DetailedWebResult[];
  result_count: number;
  rows: SourcesModeRow[];
}

export interface ImageModeBlock {
  answer_mode_type: string;
  progress: string;
  media_items: MediaItem[];
}

export interface VideoModeBlock {
  answer_mode_type: string;
  progress: string;
  media_items: MediaItem[];
}

export interface SourcesModeRow {
  web_result: DetailedWebResult;
  status: string;
  citation: number;
}
