-- 008: Chia mức điểm (2–6 mức) cho Progress Tracking. Additive: không sửa/xóa dữ liệu cũ.
-- Phụ thuộc migration 006. Mặc định TẮT (bands = '{}' nghĩa là không chia mức).
-- Mức chỉ dùng để gợi ý gói nhiệm vụ, không phải chẩn đoán; ngưỡng do nhà nghiên cứu nhập.

alter table public.survey_tracking_configs
  add column if not exists bands jsonb not null default '{}'::jsonb;

-- `band` = chỉ số vùng theo điểm tăng dần (0 = vùng điểm thấp nhất). Nhãn và ngưỡng ĐÃ DÙNG tại thời điểm chấm được lưu cố định trên từng phiên,
-- để sửa cấu hình về sau không viết lại lịch sử.
alter table public.tracking_sessions
  add column if not exists band smallint check (band between 0 and 5),
  add column if not exists band_thresholds jsonb;

create index if not exists tracking_sessions_band_idx
  on public.tracking_sessions (owner_id, assessment_key, band)
  where band is not null;
