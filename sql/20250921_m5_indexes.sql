-- Leads
do $$ begin
	if exists (select 1 from information_schema.columns where table_name='leads' and column_name='created_at') then
		execute 'create index if not exists leads_created_at_idx on leads (created_at desc)';
	end if;
end $$;

-- Appointments
do $$ begin
	if exists (select 1 from information_schema.columns where table_name='appointments' and column_name='when') then
		execute 'create index if not exists appointments_when_idx on appointments ("when" desc)';
	end if;
end $$;

-- Chat
do $$ begin
	if exists (select 1 from information_schema.columns where table_name='chat_messages' and column_name='session_id') then
		execute 'create index if not exists chat_messages_session_created_idx on chat_messages (session_id, created_at desc)';
	end if;
end $$;
do $$ begin
	if exists (select 1 from information_schema.columns where table_name='chat_feedback' and column_name='session_id') then
		execute 'create index if not exists chat_feedback_session_idx on chat_feedback (session_id)';
	end if;
end $$;

-- Properties
do $$ begin
	if exists (select 1 from information_schema.columns where table_name='properties' and column_name='status')
		 and exists (select 1 from information_schema.columns where table_name='properties' and column_name='modification_ts') then
		execute 'create index if not exists properties_status_mod_idx on properties (status, modification_ts desc)';
	end if;
end $$;
do $$ begin
	if exists (select 1 from information_schema.columns where table_name='properties' and column_name='listing_key') then
		execute 'create index if not exists properties_listing_key_idx on properties (listing_key)';
	end if;
end $$;

-- Optional common filters (create only if columns exist)
do $$ begin
	if exists (select 1 from information_schema.columns where table_name='properties' and column_name='city') then
		execute 'create index if not exists properties_city_idx on properties (city)';
	end if;
end $$;
do $$ begin
	if exists (select 1 from information_schema.columns where table_name='properties' and column_name='list_price') then
		execute 'create index if not exists properties_price_idx on properties (list_price)';
	end if;
end $$;
