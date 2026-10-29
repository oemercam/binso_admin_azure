-- Prepared only; this file is not executed by application startup or migration.
-- Run under a separately approved maintenance read role before considering 0109.
-- A scoped/RLS-filtered result is not a complete cross-tenant assessment.
begin read only;
select count(*) as visible_projects,
       count(*) filter(where hours_budget=0) as historical_zero_hours,
       count(*) filter(where hours_budget is null) as absent_hours,
       count(*) filter(where hours_budget<0 or hours_budget>1000000) as blocking_hours_outliers
from projects;
-- Do not rewrite an outlier or turn a historical zero into NULL automatically.
-- Any blocking value needs a documented owner decision before migration approval.
rollback;
