// MOCK DATA: the original app's recipes live on a server and were not extracted.
// Everything below is generated from the meal title so the UI has realistic content to render.
import { INGREDIENTS } from '../features/ingredients'
import type { CookMethod, Macros, Meal, Recipe, RecipeIngredient } from '../features/meals/types'
import { pick, seededRandom } from './seed'

const INGREDIENT_BY_ID = new Map(INGREDIENTS.map((ingredient) => [ingredient.id, ingredient]))

const matches = (title: string, pattern: string) => new RegExp(`\\b(?:${pattern})`, 'i').test(title)

// Allergen id -> title keywords (guessed, not real allergen data).
const ALLERGEN_KEYWORDS: Record<string, string> = {
  milk: 'chees|cream|butter(?!\\s?(bean|nut))|mozzarella|parmesan|parma\\b|feta|halloumi|ricotta|mascarpone|carbonara|alfredo|cheddar|paneer|mac\\b|tzatziki|stroganoff',
  egg: 'egg|carbonara|frittata|quiche|fried rice|mayo|omelette|brioche',
  gluten:
    'pasta|spaghetti|linguine|penne|rigatoni|farfalle|fusilli|orzo|gnocchi|noodle|lasagne|macaroni|mac\\b|tortelloni|udon|ramen|bread|wrap|flatbread|pitta|burger|naan|pie\\b|pastry|tart|crumbed|breaded|nugget|tender|quesadilla|taco|burrito|fajita|sandwich|croissant|gyoza|pizza|kiev|milanese|katsu|stuffing',
  soy: 'soy|teriyaki|tofu|hoisin|edamame|miso|gyoza|katsu|chow mein',
  peanut: 'peanut|satay',
  nuts: 'cashew|almond|walnut|pesto|pistachio|hazelnut|pine nut',
  shellfish: 'prawn|shrimp|scallop|mussel|crab|lobster|paella',
  fish: 'salmon|cod\\b|tuna|fish|mackerel|anchov|sardine|haddock',
  sesame: 'sesame|teriyaki|gyoza|tahini|hummus|falafel',
}

const MEAT = 'chicken|beef|pork|sausage|bacon|ham\\b|chorizo|lamb|steak|burger|meatball|mince|gammon|pancetta|prosciutto|pepperoni|salami|hotdog|mortadella|bangers|kiev'

// Title keywords -> ingredient ids; unknown ids are dropped at runtime.
const INGREDIENT_HINTS: Array<[string, string[]]> = [
  ['chicken', ['chickenbreast', 'chickenthigh']],
  ['pork|sausage', ['porkmince', 'porksausages', 'porkloinsteaks']],
  ['lamb', ['lamb']],
  ['salmon', ['salmonfillets']],
  ['prawn|shrimp', ['prawns']],
  ['spaghetti', ['spaghetti']],
  ['linguine', ['linguine']],
  ['penne', ['penne']],
  ['rigatoni', ['rigatoni']],
  ['farfalle', ['farfalle']],
  ['fusilli', ['fusilli']],
  ['orzo', ['orzo']],
  ['gnocchi', ['gnocchi']],
  ['macaroni|mac\\b', ['macaroni', 'cheddarcheese']],
  ['noodle|udon', ['udonnoodles']],
  ['tortelloni', ['tortelloni']],
  ['chees', ['cheddarcheese', 'mozzarella']],
  ['parmesan', ['parmesanpecorino']],
  ['feta', ['feta']],
  ['halloumi', ['halloumi']],
  ['ricotta', ['ricotta']],
  ['pesto', ['pesto']],
  ['chickpea', ['chickpeas']],
  ['lentil', ['lentils']],
  ['butter bean', ['butterbeans']],
  ['cannellini', ['cannellinibeans']],
  ['black bean', ['blackbeans']],
  ['chorizo', ['chorizo']],
  ['bacon', ['baconlardons']],
  ['pancetta', ['unsmokedpancetta']],
  ['prosciutto|parma', ['prosciutto']],
  ['curry', ['currysauce', 'ginger']],
  ['tikka', ['tikkapaste']],
  ['thai', ['thairedcurrypaste']],
  ['teriyaki', ['teriyakisauce']],
  ['hoisin', ['hoisinsauce']],
  ['bbq', ['bbqsauce']],
  ['buffalo', ['hotsauce']],
  ['spinach', ['spinach']],
  ['broccoli', ['tenderstembroccoli']],
  ['cauliflower', ['cauliflower']],
  ['courgette', ['courgette']],
  ['leek', ['leeks']],
  ['pumpkin|butternut', ['pumpkin']],
  ['cabbage', ['cabbage']],
  ['mango', ['mango']],
  ['lime', ['lime']],
  ['wrap|fajita|burrito|taco|quesadilla', ['wraps', 'salsa']],
  ['flatbread|naan', ['naanbread']],
  ['soup|stew', ['chickenstockcube']],
]

const STAPLES = ['oliveoil', 'saltandpepper', 'redonion', 'choppedtomatoes', 'cherrytomatoes', 'passata', 'tomatopuree', 'parsley', 'coriander', 'paprika', 'groundcumin', 'springonion', 'mixedgreens', 'vegetableoil']

// Ingredients counted by piece instead of weight.
const COUNT_UNITS: Record<string, string> = {
  redonion: 'củ',
  redpepper: 'quả',
  lime: 'quả',
  courgette: 'quả',
  leeks: 'cây',
  mango: 'quả',
  pumpkin: 'quả',
  cauliflower: 'bông',
  cabbage: 'cái',
  springonion: 'nhánh',
}

function measure(id: string, rand: () => number): Pick<RecipeIngredient, 'amount' | 'unit'> {
  const countUnit = COUNT_UNITS[id]
  if (countUnit) return { amount: 1 + Math.floor(rand() * 3), unit: countUnit }
  if (/oil|sauce|paste|puree|passata|vinegar|mayo|ketchup|mustard|pesto|salsa|tahini|syrup/.test(id)) {
    return { amount: 1 + Math.floor(rand() * 3), unit: 'muỗng canh' }
  }
  if (/salt|paprika|cumin|chilli|cinnamon|turmeric|oregano|thyme|rosemary|seasoning|fivespice|herbs|parsley|coriander/.test(id)) {
    return { amount: 1 + Math.floor(rand() * 2), unit: 'muỗng cà phê' }
  }
  return { amount: 100 + Math.floor(rand() * 7) * 50, unit: 'g' }
}

function buildSteps(method: CookMethod, names: string[], cookMinutes: number): string[] {
  const main = names[0] ?? 'nguyên liệu chính'
  const second = names[1] ?? 'rau củ'
  const rest = names.slice(2, 5).join(', ') || 'các nguyên liệu còn lại'
  const half = Math.max(3, Math.round(cookMinutes / 2))

  switch (method) {
    case 'hob':
      return [
        `Rửa sạch và cắt nhỏ ${main}, ${second}.`,
        'Đun nóng 1 muỗng canh dầu ô liu trong chảo lớn ở lửa vừa.',
        `Cho ${main} vào nấu khoảng ${half} phút, đảo đều tay.`,
        `Thêm ${rest}, nêm muối tiêu và nấu tiếp ${Math.max(3, cookMinutes - half)} phút.`,
        'Nếm lại cho vừa miệng, tắt bếp và dọn ra khi còn nóng.',
      ]
    case 'oven':
      return [
        'Làm nóng lò ở 200°C (180°C nếu là lò quạt gió).',
        `Xếp ${main} và ${second} lên khay nướng, rưới dầu ô liu, nêm muối tiêu.`,
        `Nướng khoảng ${cookMinutes} phút, lật một lần giữa chừng.`,
        `Thêm ${rest} vào khay 5 phút cuối cho vừa chín.`,
        'Lấy ra, để nghỉ 2 phút rồi dọn ra đĩa.',
      ]
    case 'airfryer':
      return [
        'Làm nóng air fryer ở 180°C trong 3 phút.',
        `Trộn ${main} với 1 muỗng canh dầu và gia vị.`,
        `Cho vào giỏ, chiên khoảng ${cookMinutes} phút, lắc giỏ giữa chừng.`,
        `Thêm ${second} và ${rest}, chiên thêm 3 phút.`,
        'Dọn ra ngay khi còn giòn.',
      ]
    case 'microwave':
      return [
        `Cho ${main} và ${second} vào tô an toàn với lò vi sóng.`,
        'Đậy nắp hờ, quay mức cao 3 phút.',
        `Khuấy đều, thêm ${rest} rồi quay thêm ${Math.max(2, Math.round(cookMinutes / 3))} phút.`,
        'Để nghỉ 1 phút rồi dùng ngay.',
      ]
  }
}

export function buildMockRecipe(meal: Meal): Recipe {
  const rand = seededRandom(meal.id)
  const title = meal.title

  const quick = /15 minute|5 ingredient/i.test(title)
  const airfryer = /air ?fr/i.test(title)
  const bigBatch = /stew|soup|casserole|bake|pie\b|chilli|curry/i.test(title)
  const meaty = matches(title, MEAT)

  const prepMinutes = quick ? 5 : 5 + Math.floor(rand() * 4) * 5
  const cookMinutes = quick ? 10 : airfryer ? 10 + Math.floor(rand() * 3) * 5 : 15 + Math.floor(rand() * 7) * 5

  const hinted: string[] = []
  for (const [pattern, ids] of INGREDIENT_HINTS) {
    if (!matches(title, pattern)) continue
    for (const id of ids) if (INGREDIENT_BY_ID.has(id) && !hinted.includes(id)) hinted.push(id)
  }
  const ids = hinted.slice(0, 4)
  for (let attempt = 0; attempt < 40 && ids.length < 6; attempt++) {
    const id = pick(rand, STAPLES)
    if (INGREDIENT_BY_ID.has(id) && !ids.includes(id)) ids.push(id)
  }

  const ingredients: RecipeIngredient[] = ids.flatMap((id) => {
    const ingredient = INGREDIENT_BY_ID.get(id)
    return ingredient ? [{ ingredientId: id, name: ingredient.name, image: ingredient.image, ...measure(id, rand) }] : []
  })
  const names = ingredients.map((i) => i.name)

  const methods: CookMethod[] = airfryer
    ? ['airfryer', 'oven']
    : /bake|traybake|roast|casserole|pie\b/i.test(title)
      ? ['oven']
      : quick
        ? ['hob', 'microwave', 'oven']
        : ['hob', 'oven']
  const steps: Partial<Record<CookMethod, string[]>> = {}
  for (const method of methods) steps[method] = buildSteps(method, names, cookMinutes)

  const macros: Macros = {
    calories: 420 + Math.floor(rand() * 36) * 10,
    protein: (meaty ? 28 : 15) + Math.floor(rand() * 18),
    carbs: 30 + Math.floor(rand() * 56),
    fat: 12 + Math.floor(rand() * 27),
  }

  const allergens = Object.entries(ALLERGEN_KEYWORDS)
    .filter(([, pattern]) => matches(title, pattern))
    .map(([id]) => id)

  const dietary: string[] = []
  if (!allergens.includes('milk')) dietary.push('dairyfree')
  if (!allergens.includes('gluten')) dietary.push('glutenfree')
  if (!meaty) dietary.push('pescatarian')
  if (!allergens.includes('sesame')) dietary.push('sesamefree')

  return {
    mealId: meal.id,
    baseServings: bigBatch ? 4 : 2,
    prepMinutes,
    cookMinutes,
    pricePerServing: 22000 + Math.floor(rand() * 8) * 5000 + (matches(title, 'salmon|prawn|lamb|steak|scallop') ? 12000 : 0),
    macros,
    dietary,
    allergens,
    ingredients,
    methods,
    steps,
  }
}
