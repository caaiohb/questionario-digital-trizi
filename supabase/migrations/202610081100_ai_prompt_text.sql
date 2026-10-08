alter table public.questionnaire_submissions add column if not exists ai_prompt_text text;
notify pgrst, 'reload schema';