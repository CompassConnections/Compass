-- Get expensive queries (in terms of total rows)
SELECT query,
       calls,
       total_exec_time,
       rows,
       1.0 * total_exec_time / calls AS avg_time
FROM pg_stat_statements
ORDER BY rows DESC
LIMIT 10;

-- Get row size (in bytes)
SELECT count(*)                                 as sampled_rows,
       pg_size_pretty(sum(pg_column_size(t.*))) as total_data_size,
       pg_size_pretty(avg(pg_column_size(t.*))) as avg_row_size
FROM (
         -- Paste your actual query here, but add a LIMIT
         SELECT *
         from user_events
         LIMIT 1000) t;

-- Multiply row size by the number of rows to get the get total egress size for each query (since pg_stat_statement was last reset)