# Thiết kế database

Phạm vi: một tài khoản duy nhất, không có household / subscription / đồng bộ đa người dùng.
Chia hai tầng:

- **Catalog**: dữ liệu có sẵn, sinh ra từ `scraping-app/data`, chỉ đọc lúc chạy.
- **Runtime**: dữ liệu phát sinh khi người dùng sử dụng app.

Đánh đổi chính so với bản chi tiết: các quan hệ phụ (bước nấu, dietary, allergen, chế độ nấu) dùng cột `array`/`jsonb` trên `meal` thay vì tách bảng; không có `user_id` ở bất kỳ đâu.

## Catalog — 4 bảng

```sql
create table category (
  id         text primary key,        -- 'chicken','seafood','pasta','airfryer',...
  label      text not null,
  emoji      text,
  sort_order smallint not null default 0
);

create table ingredient (
  id        text primary key,         -- 'anchovies'
  name      text not null,
  image     text,
  section   text,                     -- 'produce','meat','dairy','pantry' — chia nhóm khi đi chợ
  is_pantry boolean not null default false   -- gia vị/dầu: không cho vào list mua
);

create table meal (
  id             text primary key,     -- '15minutecheeseburgerpasta'
  category_id    text references category(id),
  title          text not null,
  image          text,
  base_servings  smallint not null default 2,
  prep_minutes   smallint not null,
  cook_minutes   smallint not null,
  price_serving  numeric(10,2),        -- VND / khẩu phần
  calories       smallint,             -- per serving
  protein_g      smallint,
  carbs_g        smallint,
  fat_g          smallint,
  dietary        text[] not null default '{}',  -- {'dairyfree','glutenfree'}
  allergens      text[] not null default '{}',  -- {'milk','gluten'}
  methods        text[] not null default '{}',  -- {'hob','oven'}
  steps          jsonb  not null default '{}'   -- {"hob":["Bước 1","Bước 2"],"oven":[...]}
);

create table meal_ingredient (
  meal_id       text not null references meal(id) on delete cascade,
  ingredient_id text not null references ingredient(id),
  amount        numeric(10,3) not null,   -- cho meal.base_servings
  unit          text not null,            -- 'g','ml','tbsp','piece'
  primary key (meal_id, ingredient_id)
);
```

`meal` và `ingredient` là quan hệ nhiều-nhiều, nên bảng thứ tư là bảng nối `meal_ingredient` (công thức).
`steps` JSONB map thẳng type `Partial<Record<CookMethod, string[]>>` trong `App/src/features/meals/types.ts`, đọc được ngay, không cần join.

## Runtime — 5 bảng

```sql
create table preference (              -- đúng 1 dòng duy nhất
  id                int primary key default 1 check (id = 1),
  household_size    smallint not null default 2,
  dietary_ids       text[] not null default '{}',
  allergen_ids      text[] not null default '{}',
  protein_likes     text[] not null default '{}',
  disliked_meal_ids text[] not null default '{}',
  cooking_days      smallint[] not null default '{1,2,3,4,5}',
  max_cook_minutes  smallint,
  weekly_budget     numeric(10,2),
  weekly_reminder   boolean not null default false
);

create table meal_activity (           -- lưu / chấm điểm / ghi chú / đã nấu / không thích / xem gần đây
  meal_id        text primary key references meal(id) on delete cascade,
  is_saved       boolean not null default false,
  is_disliked    boolean not null default false,
  rating         smallint check (rating between 1 and 5),
  note           text,
  last_cooked_at timestamptz,
  last_viewed_at timestamptz
);

create table plan (                    -- 1 dòng / tuần
  week_start date primary key,         -- thứ 2
  servings   numeric(4,1) not null default 2,
  budget     numeric(10,2)
);

create table plan_item (
  id         uuid primary key default gen_random_uuid(),
  week_start date not null references plan(week_start) on delete cascade,
  weekday    smallint not null check (weekday between 1 and 7),
  position   smallint not null default 0,
  meal_id    text not null references meal(id),
  servings   numeric(4,1) not null
);

create table shopping_item (
  id            uuid primary key default gen_random_uuid(),
  week_start    date,
  ingredient_id text references ingredient(id),   -- null = nhập tay
  label         text not null,
  quantity      numeric(12,3),
  unit          text,
  checked       boolean not null default false,
  store_id      text                              -- id trong stores.json, không cần bảng
);
```

## Quy tắc sinh danh sách đi chợ

```
join plan_item → meal_ingredient
quantity = meal_ingredient.amount × (plan_item.servings / meal.base_servings)
```

Bỏ qua `ingredient.is_pantry = true`, rồi upsert theo `(week_start, ingredient_id, unit)`.

## Những gì cố ý không đưa vào

| Bỏ | Lý do |
|---|---|
| Bảng `user`, `household`, `subscription`, `push_token` | Một tài khoản, không có backend chia sẻ/thu phí |
| Bảng `store` | 129 siêu thị chỉ để hiển thị → giữ JSON tĩnh ở `App/src/features/shopping/data/stores.json` |
| Bảng cho `dietary`, `allergen`, `tag` | Giá trị cố định, đủ dùng dạng `text[]` trên `meal` và `preference` |
| Bảng `meal_step`, `meal_cook_method` | Dùng `steps` jsonb + `methods` array |
| Bảng `translation` | Chỉ tiếng Việt |
| Bảng `subscription_event`, `join_attempt`, `swap_log` | Audit/analytics, chưa cần |
| `catalog_version` | Catalog cố định một bản; thêm sau nếu cần cập nhật từ xa |
