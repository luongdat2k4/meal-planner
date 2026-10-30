// MOCK DATA: subscription plans and prices are placeholders; no real payment exists.
export type PlanId = 'individual' | 'family'

export interface PlanOption {
  id: PlanId
  name: string
  // VND per month.
  price: number
  members: number
  badge?: string
  perks: string[]
}

export const TRIAL_DAYS = 7

export const PLAN_OPTIONS: PlanOption[] = [
  { id: 'individual', name: 'Cá nhân', price: 79_000, members: 1, perks: ['Tạo kế hoạch không giới hạn', 'Đồng bộ trên nhiều thiết bị'] },
  {
    id: 'family',
    name: 'Gia đình',
    price: 129_000,
    members: 5,
    badge: 'Phổ biến',
    perks: ['Mọi quyền lợi gói Cá nhân', 'Chia sẻ kế hoạch cho tối đa 5 người'],
  },
]

export const PREMIUM_BENEFITS = [
  'Tạo và tạo lại kế hoạch tự động không giới hạn',
  'Đổi món theo sở thích bất cứ lúc nào',
  'Dinh dưỡng chi tiết cho từng món',
  'Đồng bộ và khôi phục dữ liệu trên nhiều thiết bị',
]

export const CANCEL_REASONS = ['Quá đắt', 'Ít khi sử dụng', 'Thiếu món tôi thích', 'Lý do khác']
